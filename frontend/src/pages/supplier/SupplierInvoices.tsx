import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import { supplierApi } from '../../api/supplier.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const SupplierInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [form, setForm] = useState({ supplierId: '', description: '', subtotal: '', tax: '', discount: '', dueDate: '', notes: '' });
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const [invRes, supRes] = await Promise.all([
        supplierApi.getInvoices({ page, limit }),
        supplierApi.getSuppliers({ limit: 200, status: 'ACTIVE' }),
      ]);
      setInvoices(invRes.data.data || []);
      setTotal(invRes.data.meta?.total || 0);
      setSuppliers(supRes.data.data || []);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleSave = async () => {
    if (!form.supplierId || !form.subtotal) { toast.error('Supplier and amount required'); return; }
    setSaving(true);
    try {
      await supplierApi.createInvoice({
        ...form,
        subtotal: parseFloat(form.subtotal),
        tax: form.tax ? parseFloat(form.tax) : 0,
        discount: form.discount ? parseFloat(form.discount) : 0,
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      });
      toast.success('Invoice created');
      setShowModal(false);
      setForm({ supplierId: '', description: '', subtotal: '', tax: '', discount: '', dueDate: '', notes: '' });
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id: string) => {
    setApproving(id);
    try { await supplierApi.approveInvoice(id); toast.success('Invoice approved'); await load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setApproving(null); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Supplier Invoices</h1><p className="text-sm text-gray-500">Manage incoming supplier invoices</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add Invoice</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Invoice #</th><th>Supplier</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                    <td>{inv.supplier?.name}</td>
                    <td>{formatCurrency(inv.totalAmount)}</td>
                    <td className="text-green-700">{formatCurrency(inv.paidAmount)}</td>
                    <td className={Number(inv.outstandingBalance) > 0 ? 'text-red-700 font-semibold' : ''}>
                      {formatCurrency(inv.outstandingBalance)}
                    </td>
                    <td className="text-xs text-gray-400">{formatDate(inv.dueDate)}</td>
                    <td>{getStatusBadge(inv.status)}</td>
                    <td>
                      {['SUBMITTED', 'UNDER_REVIEW'].includes(inv.status) && (
                        <Button size="sm" variant="success" loading={approving === inv.id}
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                          onClick={() => handleApprove(inv.id)}>Approve</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-10">No invoices found</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Supplier Invoice" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Create</Button></>}
      >
        <div className="space-y-4">
          <Select label="Supplier *" value={form.supplierId} onChange={f('supplierId')} placeholder="Select supplier..."
            options={suppliers.map(s => ({ value: s.id, label: s.name }))} />
          <Textarea label="Description" value={form.description} onChange={f('description')} rows={2} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Subtotal (RWF) *" type="number" value={form.subtotal} onChange={f('subtotal')} />
            <Input label="Tax (RWF)" type="number" value={form.tax} onChange={f('tax')} />
            <Input label="Discount (RWF)" type="number" value={form.discount} onChange={f('discount')} />
          </div>
          <Input label="Due Date" type="date" value={form.dueDate} onChange={f('dueDate')} />
          <Textarea label="Notes" value={form.notes} onChange={f('notes')} rows={2} />
        </div>
      </Modal>
    </div>
  );
};
