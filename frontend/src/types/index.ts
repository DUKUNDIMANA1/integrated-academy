export type Role =
  | 'SUPER_ADMIN' | 'GENERAL_MANAGER' | 'ACADEMY_MANAGER' | 'ELEARNING_MANAGER'
  | 'FINANCE_OFFICER' | 'INSTRUCTOR' | 'CONSULTANT' | 'STUDENT'
  | 'CLIENT_ROLE' | 'HR_OFFICER' | 'SALES_ADMISSIONS' | 'SUPPORT_OFFICER' | 'AUDITOR';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  avatarUrl?: string | null;
  isActive: boolean;
  studentId?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface Student {
  id: string;
  userId: string;
  studentCode: string;
  user: User;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  address?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string;
  category?: string;
  type: 'CLASSROOM' | 'ONLINE' | 'HYBRID';
  durationDays: number;
  partialPaymentLockDays: number;
  fee: number;
  currency: string;
  capacity?: number;
  thumbnail?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  _count?: { enrollments: number; applications: number; cohorts: number };
}

export interface Application {
  id: string;
  studentId: string;
  student: { user: { firstName: string; lastName: string; email: string; phone?: string } };
  courseId: string;
  course: { title: string; code: string; fee: number; currency: string };
  cohort?: { name: string; startDate: string };
  status: ApplicationStatus;
  educationBackground?: string;
  workExperience?: string;
  motivation?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  submittedAt?: string;
  createdAt: string;
  invoice?: Invoice;
}

export type ApplicationStatus =
  | 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'REJECTED'
  | 'PAYMENT_PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID'
  | 'ENROLLED' | 'ACTIVE' | 'COMPLETED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId?: string;
  student?: { user: { firstName: string; lastName: string; email: string } };
  course?: { title: string; code: string };
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  currency: string;
  issueDate: string;
  dueDate?: string;
  status: InvoiceStatus;
  payments?: Payment[];
  installments?: PaymentInstallment[];
}

export type InvoiceStatus =
  | 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'FULLY_PAID'
  | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoice?: { invoiceNumber: string; totalAmount: number };
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
  createdAt: string;
  student?: { user: { firstName: string; lastName: string } };
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CARD' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface PaymentInstallment {
  id: string;
  installmentNumber: number;
  amountDue: number;
  amountPaid: number;
  remainingBalance: number;
  dueDate: string;
  checkpointDate?: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  course: Course;
  cohort?: { name: string; startDate: string; endDate: string };
  applicationId?: string;
  accessStatus: 'ACTIVE' | 'LOCKED' | 'COMPLETED' | 'CANCELLED';
  enrolledAt: string;
  completedAt?: string;
  accessLockedAt?: string;
  progressPercent: number;
  invoice?: {
    id: string;
    status: InvoiceStatus;
    totalAmount: number;
    paidAmount: number;
    outstandingBalance: number;
  };
  checkpointDate?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'MOBILE_MONEY' | 'OTHER';
  currency: string;
  openingBalance: number;
  currentBalance: number;
  accountNumber?: string;
  bankName?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  position?: string;
  employmentType: string;
  salary?: number;
  hireDate: string;
  status: string;
  user: { firstName: string; lastName: string; email: string; phone?: string; role: Role };
  department?: { name: string };
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  _count?: { employees: number };
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  contactPerson?: string;
  _count?: { projects: number; invoices: number };
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  client: { name: string };
  status: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  currency: string;
  _count?: { milestones: number; tasks: number };
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  student?: { user: { firstName: string; lastName: string; email: string } };
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  responderId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: object;
  after?: object;
  ipAddress?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    totalAmount?: number;
  };
}
