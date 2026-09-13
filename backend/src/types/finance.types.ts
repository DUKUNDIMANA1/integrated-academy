import {
  PaymentMethod,
  IncomeCategory,
  ExpenseCategory,
  AccountType,
  BudgetPeriod,
} from '@prisma/client';

export interface CreateInvoiceDto {
  studentId?: string;
  courseId?: string;
  applicationId?: string;
  consultancyProjectId?: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  currency?: string;
  dueDate?: string;
  notes?: string;
  installments?: {
    installmentNumber: number;
    amountDue: number;
    dueDate: string;
    checkpointDate?: string;
  }[];
}

export interface CreatePaymentDto {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  currency?: string;
  reference?: string;
  accountId?: string;
  notes?: string;
}

export interface ConfirmPaymentDto {
  paymentId: string;
  processedBy?: string;
  notes?: string;
}

export interface CreateIncomeDto {
  date?: string;
  category: IncomeCategory;
  source?: string;
  description?: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  accountId: string;
  reference?: string;
  studentId?: string;
  invoiceId?: string;
  receivedBy?: string;
}

export interface CreateExpenseDto {
  date?: string;
  category: ExpenseCategory;
  description?: string;
  amount: number;
  currency?: string;
  paidTo?: string;
  method: PaymentMethod;
  accountId: string;
  receipt?: string;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  currency?: string;
  openingBalance?: number;
  accountNumber?: string;
  bankName?: string;
}

export interface CreateTransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency?: string;
  reference?: string;
  description?: string;
}

export interface CreateBudgetDto {
  name: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  category?: string;
  department?: string;
  totalAmount: number;
  currency?: string;
  items?: {
    category: string;
    description?: string;
    allocatedAmount: number;
  }[];
}

export interface FinancialReportQuery {
  startDate: string;
  endDate: string;
  currency?: string;
  groupBy?: 'day' | 'week' | 'month';
}
