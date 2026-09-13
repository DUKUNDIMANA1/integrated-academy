import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { SupplierStatus, POStatus, SupplierInvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const generateCode = (prefix: string) => {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${new Date().getFullYear()}-${rand}`;
};

export class SupplierService {
  // ── SUPPLIERS ─────────────────────────────────────────────────────────────

  async getSuppliers(page = 1, limit = 20, filters: { status?: SupplierStatus; search?: string; category?: string } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { supplierCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { invoices: true, purchaseOrders: true, payments: true } },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total };
  }

  async getSupplierById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
        purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 5 },
        contracts: { orderBy: { createdAt: 'desc' } },
        evaluations: { orderBy: { evaluatedAt: 'desc' }, take: 3 },
        _count: { select: { invoices: true, purchaseOrders: true } },
      },
    });
    if (!supplier) throw new AppError('Supplier not found', 404);

    // Financial summary
    const [totalPurchases, totalPaid, outstanding] = await Promise.all([
      prisma.supplierInvoice.aggregate({ _sum: { totalAmount: true }, where: { supplierId: id } }),
      prisma.supplierPayment.aggregate({ _sum: { amount: true }, where: { supplierId: id, status: 'CONFIRMED' } }),
      prisma.supplierInvoice.aggregate({ _sum: { outstandingBalance: true }, where: { supplierId: id, status: { in: ['SUBMITTED', 'APPROVED', 'PARTIALLY_PAID', 'OVERDUE'] } } }),
    ]);

    return {
      ...supplier,
      financialSummary: {
        totalPurchases: totalPurchases._sum.totalAmount || 0,
        totalPaid: totalPaid._sum.amount || 0,
        outstanding: outstanding._sum.outstandingBalance || 0,
      },
    };
  }

  async createSupplier(data: {
    name: string; companyName?: string; type?: string; category?: string;
    registrationNumber?: string; taxId?: string; country?: string; province?: string;
    district?: string; address?: string; contactPerson?: string; phone?: string;
    email?: string; website?: string; bankName?: string; bankAccount?: string;
    accountName?: string; paymentMethod?: string; paymentTerms?: number;
    creditLimit?: number; currency?: string; notes?: string; createdBy?: string;
  }) {
    return prisma.supplier.create({
      data: {
        ...data,
        supplierCode: generateCode('SUP'),
        status: 'PENDING_APPROVAL',
        type: (data.type as any) || 'GENERAL',
      },
    });
  }

  async updateSupplier(id: string, data: Partial<{
    name: string; companyName: string; category: string; status: SupplierStatus;
    contactPerson: string; phone: string; email: string; address: string;
    paymentTerms: number; creditLimit: number; notes: string;
  }>) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new AppError('Supplier not found', 404);
    return prisma.supplier.update({ where: { id }, data });
  }

  async approveSupplier(id: string, approvedBy: string) {
    return prisma.supplier.update({
      where: { id },
      data: { status: 'ACTIVE', approvedBy, approvedAt: new Date() },
    });
  }

  async getSupplierDashboard() {
    const [total, active, inactive, pendingApproval, totalPayables, overduePayables, pendingInvoices] = await Promise.all([
      prisma.supplier.count(),
      prisma.supplier.count({ where: { status: 'ACTIVE' } }),
      prisma.supplier.count({ where: { status: 'INACTIVE' } }),
      prisma.supplier.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.supplierInvoice.aggregate({ _sum: { outstandingBalance: true }, where: { status: { in: ['APPROVED', 'PARTIALLY_PAID', 'OVERDUE'] } } }),
      prisma.supplierInvoice.aggregate({ _sum: { outstandingBalance: true }, where: { status: 'OVERDUE' } }),
      prisma.supplierInvoice.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    ]);

    const topSuppliers = await prisma.supplier.findMany({
      take: 5, where: { status: 'ACTIVE' },
      include: { _count: { select: { invoices: true } } },
    });

    return { total, active, inactive, pendingApproval, totalPayables: totalPayables._sum.outstandingBalance || 0, overduePayables: overduePayables._sum.outstandingBalance || 0, pendingInvoices, topSuppliers };
  }

  // ── SUPPLIER INVOICES ──────────────────────────────────────────────────────

  async getSupplierInvoices(page = 1, limit = 20, filters: { supplierId?: string; status?: SupplierInvoiceStatus } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.status) where.status = filters.status;

    const [invoices, total] = await Promise.all([
      prisma.supplierInvoice.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { supplier: { select: { name: true, supplierCode: true } } } }),
      prisma.supplierInvoice.count({ where }),
    ]);
    return { invoices, total };
  }

  async createSupplierInvoice(data: {
    supplierId: string; purchaseOrderId?: string; description?: string;
    subtotal: number; tax?: number; discount?: number; dueDate?: Date; notes?: string;
  }) {
    const totalAmount = (data.subtotal - (data.discount || 0)) + (data.tax || 0);
    return prisma.supplierInvoice.create({
      data: {
        invoiceNumber: generateCode('SINV'),
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId,
        description: data.description,
        subtotal: data.subtotal,
        tax: data.tax || 0,
        discount: data.discount || 0,
        totalAmount,
        outstandingBalance: totalAmount,
        dueDate: data.dueDate,
        notes: data.notes,
      },
    });
  }

  async approveSupplierInvoice(id: string, approvedBy: string) {
    return prisma.supplierInvoice.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy },
    });
  }

  // ── PURCHASE ORDERS ────────────────────────────────────────────────────────

  async getPurchaseOrders(page = 1, limit = 20, filters: { supplierId?: string; status?: POStatus } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.status) where.status = filters.status;

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { supplier: { select: { name: true } }, items: true } }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return { orders, total };
  }

  async createPurchaseOrder(data: {
    supplierId: string; description?: string; expectedDate?: Date;
    items: Array<{ description: string; quantity: number; unitPrice: number; tax?: number; discount?: number }>;
    createdBy?: string;
  }) {
    const itemsWithTotals = data.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      tax: item.tax || 0,
      discount: item.discount || 0,
      totalPrice: (item.quantity * item.unitPrice * (1 + (item.tax || 0) / 100)) - (item.discount || 0),
      receivedQty: 0,
    }));

    const subtotal = itemsWithTotals.reduce((s, i) => s + i.totalPrice, 0);

    return prisma.purchaseOrder.create({
      data: {
        poNumber: generateCode('PO'),
        supplierId: data.supplierId,
        description: data.description,
        expectedDate: data.expectedDate,
        subtotal,
        totalAmount: subtotal,
        createdBy: data.createdBy,
        items: { create: itemsWithTotals },
      },
      include: { items: true },
    });
  }

  async updatePOStatus(id: string, status: POStatus, userId?: string) {
    const data: Record<string, unknown> = { status };
    if (status === 'APPROVED') { data.approvedBy = userId; data.approvedAt = new Date(); }
    if (status === 'SENT') data.sentAt = new Date();
    if (status === 'RECEIVED') data.receivedAt = new Date();
    return prisma.purchaseOrder.update({ where: { id }, data });
  }

  // ── SUPPLIER PAYMENTS ──────────────────────────────────────────────────────

  async createSupplierPayment(data: {
    supplierId: string; invoiceId?: string; amount: number; method: PaymentMethod;
    reference?: string; accountId?: string; notes?: string; approvedBy?: string;
  }) {
    const payment = await prisma.supplierPayment.create({
      data: {
        paymentNumber: generateCode('SPAY'),
        supplierId: data.supplierId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        accountId: data.accountId,
        notes: data.notes,
        approvedBy: data.approvedBy,
        status: 'PENDING',
      },
    });

    // Update invoice balance if linked
    if (data.invoiceId) {
      const invoice = await prisma.supplierInvoice.findUnique({ where: { id: data.invoiceId } });
      if (invoice) {
        const newPaid = Number(invoice.paidAmount) + data.amount;
        const newOutstanding = Number(invoice.totalAmount) - newPaid;
        const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIALLY_PAID';
        await prisma.supplierInvoice.update({
          where: { id: data.invoiceId },
          data: { paidAmount: newPaid, outstandingBalance: Math.max(0, newOutstanding), status: newStatus },
        });
      }
    }

    return payment;
  }

  async confirmSupplierPayment(id: string, processedBy: string) {
    return prisma.supplierPayment.update({
      where: { id },
      data: { status: 'CONFIRMED', processedBy, processedAt: new Date() },
    });
  }

  // ── ACCOUNTS PAYABLE ──────────────────────────────────────────────────────

  async getAccountsPayable() {
    const invoices = await prisma.supplierInvoice.findMany({
      where: { status: { in: ['APPROVED', 'PARTIALLY_PAID', 'OVERDUE'] } },
      include: { supplier: { select: { name: true, supplierCode: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const total = invoices.reduce((s, i) => s + Number(i.outstandingBalance), 0);
    const dueThisWeek = invoices.filter(i => i.dueDate && i.dueDate <= weekFromNow).reduce((s, i) => s + Number(i.outstandingBalance), 0);
    const dueThisMonth = invoices.filter(i => i.dueDate && i.dueDate <= monthFromNow).reduce((s, i) => s + Number(i.outstandingBalance), 0);
    const overdue = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + Number(i.outstandingBalance), 0);

    return { invoices, summary: { total, dueThisWeek, dueThisMonth, overdue } };
  }

  async getAgingReport() {
    const invoices = await prisma.supplierInvoice.findMany({
      where: { outstandingBalance: { gt: 0 } },
      include: { supplier: { select: { name: true } } },
    });

    const now = new Date();
    const grouped: Record<string, { current: number; days30: number; days60: number; days90: number; total: number }> = {};

    for (const inv of invoices) {
      const supplierId = inv.supplierId;
      if (!grouped[supplierId]) grouped[supplierId] = { current: 0, days30: 0, days60: 0, days90: 0, total: 0 };
      const balance = Number(inv.outstandingBalance);
      const daysDue = inv.dueDate ? Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      grouped[supplierId].total += balance;
      if (daysDue <= 0) grouped[supplierId].current += balance;
      else if (daysDue <= 30) grouped[supplierId].days30 += balance;
      else if (daysDue <= 60) grouped[supplierId].days60 += balance;
      else grouped[supplierId].days90 += balance;
    }

    return Object.entries(grouped).map(([supplierId, data]) => {
      const inv = invoices.find(i => i.supplierId === supplierId);
      return { supplierId, supplierName: inv?.supplier?.name || 'Unknown', ...data };
    });
  }

  // ── SUPPLIER CONTRACTS ────────────────────────────────────────────────────

  async getSupplierContracts(supplierId?: string) {
    const where: Record<string, unknown> = {};
    if (supplierId) where.supplierId = supplierId;
    return prisma.supplierContract.findMany({ where, orderBy: { createdAt: 'desc' }, include: { supplier: { select: { name: true } } } });
  }

  async createSupplierContract(data: {
    supplierId: string; title: string; description?: string; value?: number;
    startDate: Date; endDate?: Date; renewalDate?: Date; paymentTerms?: string; fileUrl?: string;
  }) {
    return prisma.supplierContract.create({ data });
  }

  // ── EVALUATIONS ───────────────────────────────────────────────────────────

  async createEvaluation(data: {
    supplierId: string; qualityScore?: number; priceScore?: number; deliveryScore?: number;
    reliabilityScore?: number; serviceScore?: number; comments?: string; evaluatedBy?: string;
  }) {
    const scores = [data.qualityScore, data.priceScore, data.deliveryScore, data.reliabilityScore, data.serviceScore].filter(Boolean) as number[];
    const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    return prisma.supplierEvaluation.create({
      data: { ...data, overallScore },
    });
  }
}

export default new SupplierService();
