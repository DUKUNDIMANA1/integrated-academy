import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// ── Public ────────────────────────────────────────────────────────────────────
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { CoursesPage } from '../pages/public/CoursesPage';
import { CertificateVerificationPage } from '../pages/public/CertificateVerificationPage';
import { NotFoundPage, UnauthorizedPage } from '../pages/public/NotFoundPage';

// ── Student ───────────────────────────────────────────────────────────────────
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentApplications } from '../pages/student/StudentApplications';
import { StudentCourses } from '../pages/student/StudentCourses';
import { StudentLearning } from '../pages/student/StudentLearning';
import { StudentInvoices } from '../pages/student/StudentInvoices';
import { StudentGrades } from '../pages/student/StudentGrades';
import { StudentAttendance } from '../pages/student/StudentAttendance';
import { StudentCertificates } from '../pages/student/StudentCertificates';
import { StudentSupport } from '../pages/student/StudentSupport';
import { TakeAssessmentPage } from '../pages/student/TakeAssessmentPage';

// ── Admin ─────────────────────────────────────────────────────────────────────
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminApplications } from '../pages/admin/AdminApplications';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminAuditLog } from '../pages/admin/AdminAuditLog';
import { AdminSettings } from '../pages/admin/AdminSettings';

// ── Finance ───────────────────────────────────────────────────────────────────
import { FinanceDashboard } from '../pages/finance/FinanceDashboard';
import { IncomeManagement } from '../pages/finance/IncomeManagement';
import { ExpenseManagement } from '../pages/finance/ExpenseManagement';
import { InvoiceManagement } from '../pages/finance/InvoiceManagement';
import { PaymentManagement } from '../pages/finance/PaymentManagement';
import { AccountsManagement } from '../pages/finance/AccountsManagement';
import { TransferManagement } from '../pages/finance/TransferManagement';
import { BudgetManagement } from '../pages/finance/BudgetManagement';
import { ReconciliationManagement } from '../pages/finance/ReconciliationManagement';
import { FinancialReports } from '../pages/finance/FinancialReports';
import { PayrollManagement } from '../pages/finance/PayrollManagement';
import { GeneralLedger } from '../pages/finance/GeneralLedger';
import { TaxManagement } from '../pages/finance/TaxManagement';

// ── Suppliers ─────────────────────────────────────────────────────────────────
import { SupplierDashboard } from '../pages/supplier/SupplierDashboard';
import { SupplierList } from '../pages/supplier/SupplierList';
import { SupplierInvoices } from '../pages/supplier/SupplierInvoices';
import { PurchaseOrders } from '../pages/supplier/PurchaseOrders';
import { AccountsPayable } from '../pages/supplier/AccountsPayable';

// ── Academy ───────────────────────────────────────────────────────────────────
import { CoursesManagement } from '../pages/academy/CoursesManagement';
import { CohortsManagement } from '../pages/academy/CohortsManagement';
import { AttendanceManagement } from '../pages/academy/AttendanceManagement';
import { TrainerDashboard } from '../pages/academy/TrainerDashboard';
import { CourseContentPage } from '../pages/academy/CourseContentPage';
import { ELearningContentPage } from '../pages/academy/ELearningContentPage';

import { CertificatesManagement } from '../pages/academy/CertificatesManagement';

// ── HR ────────────────────────────────────────────────────────────────────────
import { HRDashboard } from '../pages/hr/HRDashboard';
import { EmployeesManagement } from '../pages/hr/EmployeesManagement';
import { DepartmentsManagement } from '../pages/hr/DepartmentsManagement';
import { LeaveManagement } from '../pages/hr/LeaveManagement';

// ── Consultancy ───────────────────────────────────────────────────────────────
import { ConsultancyDashboard } from '../pages/consultancy/ConsultancyDashboard';
import { ProjectsManagement } from '../pages/consultancy/ProjectsManagement';
import { ClientsManagement } from '../pages/consultancy/ClientsManagement';

// ── Support ───────────────────────────────────────────────────────────────────
import { SupportTickets } from '../pages/support/SupportTickets';

// ── Communication ─────────────────────────────────────────────────────────────
import { AnnouncementsPage } from '../pages/communication/AnnouncementsPage';

// ── Settings ──────────────────────────────────────────────────────────────────
import { ProfileSettings } from '../pages/settings/ProfileSettings';

// Wrapper that forces remount when navigating to the same route
const Remount: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  return React.cloneElement(children, { key: location.pathname });
};
const Placeholder = ({ title }: { title: string }) => (
  <div className="card text-center py-20">
    <h2 className="text-gray-400 text-xl">{title}</h2>
    <p className="text-sm text-gray-300 mt-2">This section is coming soon.</p>
  </div>
);

// Role shorthand arrays
const ADMIN   = ['SUPER_ADMIN','GENERAL_MANAGER'] as const;
const FINANCE = ['SUPER_ADMIN','GENERAL_MANAGER','FINANCE_OFFICER'] as const;
const FINANCE_READ = ['SUPER_ADMIN','GENERAL_MANAGER','FINANCE_OFFICER','AUDITOR'] as const;
const ACADEMY = ['SUPER_ADMIN','GENERAL_MANAGER','ACADEMY_MANAGER','ELEARNING_MANAGER','INSTRUCTOR'] as const;
const ACADEMY_MANAGE = ['SUPER_ADMIN','GENERAL_MANAGER','ACADEMY_MANAGER','ELEARNING_MANAGER'] as const;
const ADMISSIONS = ['SUPER_ADMIN','GENERAL_MANAGER','ACADEMY_MANAGER','SALES_ADMISSIONS'] as const;
const HR      = ['SUPER_ADMIN','GENERAL_MANAGER','HR_OFFICER'] as const;
const HR_READ = ['SUPER_ADMIN','GENERAL_MANAGER','HR_OFFICER','AUDITOR'] as const;
const CONSULT = ['SUPER_ADMIN','GENERAL_MANAGER','CONSULTANT','SALES_ADMISSIONS'] as const;
const SUPPORT = ['SUPER_ADMIN','GENERAL_MANAGER','SUPPORT_OFFICER'] as const;
const ALL_STAFF = ['SUPER_ADMIN','GENERAL_MANAGER','ACADEMY_MANAGER','ELEARNING_MANAGER','FINANCE_OFFICER','INSTRUCTOR','CONSULTANT','HR_OFFICER','SALES_ADMISSIONS','SUPPORT_OFFICER','AUDITOR'] as const;

const P = (roles: readonly string[], el: React.ReactElement) => (
  <ProtectedRoute allowedRoles={roles as any}>{el}</ProtectedRoute>
);

const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────────────────
  { path: '/',            element: <CoursesPage /> },
  { path: '/courses',     element: <CoursesPage /> },
  { path: '/login',       element: <LoginPage /> },
  { path: '/register',    element: <RegisterPage /> },
  { path: '/verify/:code',   element: <CertificateVerificationPage /> },
  { path: '/unauthorized',element: <UnauthorizedPage /> },

  // ── Authenticated routes ───────────────────────────────────────────────────
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [

      // ── STUDENT ────────────────────────────────────────────────────────────
      { path: 'student/dashboard',              element: P(['STUDENT'], <StudentDashboard />) },
      { path: 'student/applications',           element: P(['STUDENT'], <StudentApplications />) },
      { path: 'student/courses',                element: P(['STUDENT'], <StudentCourses />) },
      { path: 'student/courses/:courseId/learn',element: P(['STUDENT'], <StudentLearning />) },
      { path: 'student/invoices',               element: P(['STUDENT'], <StudentInvoices />) },
      { path: 'student/payments',               element: P(['STUDENT'], <StudentInvoices />) },
      { path: 'student/grades',                 element: P(['STUDENT'], <StudentGrades />) },
      { path: 'student/attendance',             element: P(['STUDENT'], <StudentAttendance />) },
      { path: 'student/certificates',           element: P(['STUDENT'], <StudentCertificates />) },
      { path: 'student/support',                element: P(['STUDENT'], <StudentSupport />) },
      { path: 'student/assessments/:id',          element: P(['STUDENT'], <TakeAssessmentPage />) },

      // ── ADMIN ──────────────────────────────────────────────────────────────
      { path: 'admin/dashboard',   element: P(ADMISSIONS, <AdminDashboard />) },
      { path: 'admin/applications',element: P(ADMISSIONS, <AdminApplications />) },
      { path: 'admin/users',       element: P([...ADMIN, 'HR_OFFICER'], <AdminUsers />) },
      { path: 'admin/audit',       element: P([...ADMIN, 'AUDITOR'], <AdminAuditLog />) },
      { path: 'admin/settings',    element: P(ADMIN, <AdminSettings />) },

      // ── FINANCE ────────────────────────────────────────────────────────────
      { path: 'finance/dashboard',      element: P(FINANCE_READ, <FinanceDashboard />) },
      { path: 'finance/income',         element: P(FINANCE_READ, <IncomeManagement />) },
      { path: 'finance/expenses',       element: P(FINANCE_READ, <ExpenseManagement />) },
      { path: 'finance/invoices',       element: P(FINANCE_READ, <InvoiceManagement />) },
      { path: 'finance/payments',       element: P(FINANCE_READ, <PaymentManagement />) },
      { path: 'finance/accounts',       element: P(FINANCE_READ, <AccountsManagement />) },
      { path: 'finance/transfers',      element: P(FINANCE,      <TransferManagement />) },
      { path: 'finance/budgets',        element: P(FINANCE_READ, <BudgetManagement />) },
      { path: 'finance/reconciliation', element: P(FINANCE,      <ReconciliationManagement />) },
      { path: 'finance/reports',        element: P(FINANCE_READ, <FinancialReports />) },
      { path: 'finance/payroll',        element: P([...FINANCE,'HR_OFFICER'], <PayrollManagement />) },
      { path: 'finance/ledger',         element: P(FINANCE_READ, <GeneralLedger />) },
      { path: 'finance/tax',            element: P(FINANCE_READ, <TaxManagement />) },

      // ── SUPPLIERS ──────────────────────────────────────────────────────────
      { path: 'suppliers/dashboard',      element: P(FINANCE_READ, <SupplierDashboard />) },
      { path: 'suppliers/list',           element: P(FINANCE_READ, <SupplierList />) },
      { path: 'suppliers/invoices',       element: P(FINANCE_READ, <SupplierInvoices />) },
      { path: 'suppliers/purchase-orders',element: P(FINANCE,      <PurchaseOrders />) },
      { path: 'suppliers/accounts-payable',element: P(FINANCE_READ,<AccountsPayable />) },

      // ── ACADEMY ────────────────────────────────────────────────────────────
      { path: 'academy/dashboard',   element: P(ACADEMY,        <TrainerDashboard />) },
      { path: 'academy/courses',     element: P(ACADEMY,        <CoursesManagement />) },
      { path: 'academy/courses/:courseId/content', element: P(ACADEMY, <CourseContentPage />) },
      { path: 'academy/cohorts',     element: P(ACADEMY,        <CohortsManagement />) },
      { path: 'academy/attendance',  element: P(ACADEMY,        <AttendanceManagement />) },
      { path: 'academy/assessments', element: P(ACADEMY,        <Placeholder title="Assessments & Grading" />) },
      { path: 'academy/certificates',element: P(ACADEMY, <CertificatesManagement />) },
      { path: 'academy/elearning',   element: P(ACADEMY,        <ELearningContentPage />) },

      // ── HR ─────────────────────────────────────────────────────────────────
      { path: 'hr/dashboard',   element: P(HR_READ, <HRDashboard />) },
      { path: 'hr/employees',   element: P(HR_READ, <EmployeesManagement />) },
      { path: 'hr/departments', element: P(HR_READ, <DepartmentsManagement />) },
      { path: 'hr/leave',       element: P(HR,      <LeaveManagement />) },

      // ── CONSULTANCY ────────────────────────────────────────────────────────
      { path: 'consultancy/dashboard', element: P(CONSULT, <ConsultancyDashboard />) },
      { path: 'consultancy/clients',   element: P(CONSULT, <ClientsManagement />) },
      { path: 'consultancy/projects',  element: P(CONSULT, <ProjectsManagement />) },
      { path: 'consultancy/leads',     element: P(CONSULT, <Placeholder title="Leads" />) },
      { path: 'consultancy/proposals', element: P(CONSULT, <Placeholder title="Proposals" />) },
      { path: 'consultancy/contracts', element: P(CONSULT, <Placeholder title="Contracts" />) },

      // ── SUPPORT ────────────────────────────────────────────────────────────
      { path: 'support/tickets', element: P(SUPPORT, <SupportTickets />) },

      // ── COMMUNICATION ──────────────────────────────────────────────────────
      { path: 'communication/announcements', element: <AnnouncementsPage /> },

      // ── SETTINGS (all auth) ────────────────────────────────────────────────
      { path: 'settings/profile', element: <ProfileSettings /> },
      { path: 'settings/system',  element: P(ADMIN, <AdminSettings />) },

      // ── 404 ────────────────────────────────────────────────────────────────
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);

export const AppRouter: React.FC = () => <RouterProvider router={router} />;
