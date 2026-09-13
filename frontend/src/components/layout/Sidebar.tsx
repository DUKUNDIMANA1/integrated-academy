import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, DollarSign, Briefcase,
  UserCheck, Headphones, BarChart3, Settings, LogOut, ChevronDown, ChevronRight,
  FileText, CreditCard, Building2, ClipboardList, Award, Bell, Shield,
  TrendingUp, Wallet, Receipt, PieChart, FolderOpen, Calendar, X,
  Package, ArrowLeftRight, BookMarked, Scale, Layers, Megaphone
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBranding } from '../../hooks/useBranding';
import { ORG } from '../../config/organization';

interface NavItem {
  label: string;
  to?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const buildNav = (role: string): NavItem[] => {
  const items: NavItem[] = [];

  // ── STUDENT ──────────────────────────────────────────────────────────────
  if (role === 'STUDENT') {
    items.push(
      { label: 'Dashboard',     to: '/student/dashboard',    icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'My Courses',    to: '/student/courses',      icon: <BookOpen className="w-4 h-4" /> },
      { label: 'Learning',      to: '/student/courses',      icon: <Layers className="w-4 h-4" /> },
      { label: 'Applications',  to: '/student/applications', icon: <ClipboardList className="w-4 h-4" /> },
      { label: 'Attendance',    to: '/student/attendance',   icon: <Calendar className="w-4 h-4" /> },
      { label: 'Grades',        to: '/student/grades',       icon: <Award className="w-4 h-4" /> },
      { label: 'Certificates',  to: '/student/certificates', icon: <Award className="w-4 h-4" /> },
      {
        label: 'Finance', icon: <DollarSign className="w-4 h-4" />,
        children: [
          { label: 'Invoices', to: '/student/invoices',  icon: <FileText className="w-4 h-4" /> },
          { label: 'Payments', to: '/student/payments',  icon: <CreditCard className="w-4 h-4" /> },
        ]
      },
      { label: 'Announcements', to: '/communication/announcements', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Support',       to: '/student/support',      icon: <Headphones className="w-4 h-4" /> },
    );
    return items;
  }

  // ── ADMIN / MANAGEMENT ────────────────────────────────────────────────────
  if (['SUPER_ADMIN','GENERAL_MANAGER','ACADEMY_MANAGER','SALES_ADMISSIONS'].includes(role)) {
    items.push(
      { label: 'Dashboard',    to: '/admin/dashboard',    icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Applications', to: '/admin/applications', icon: <ClipboardList className="w-4 h-4" /> },
    );
  }

  // ── ACADEMY ───────────────────────────────────────────────────────────────
  if (['SUPER_ADMIN','GENERAL_MANAGER','ACADEMY_MANAGER','ELEARNING_MANAGER','INSTRUCTOR'].includes(role)) {
    items.push({
      label: 'Academy', icon: <GraduationCap className="w-4 h-4" />,
      children: [
        { label: 'Dashboard',    to: '/academy/dashboard',   icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Courses',      to: '/academy/courses',     icon: <BookOpen className="w-4 h-4" /> },
        { label: 'Cohorts',      to: '/academy/cohorts',     icon: <Users className="w-4 h-4" /> },
        { label: 'Attendance',   to: '/academy/attendance',  icon: <Calendar className="w-4 h-4" /> },
        { label: 'Assessments',  to: '/academy/assessments', icon: <FileText className="w-4 h-4" /> },
        { label: 'Certificates', to: '/academy/certificates',icon: <Award className="w-4 h-4" /> },
        { label: 'E-Learning',   to: '/academy/elearning',   icon: <Layers className="w-4 h-4" /> },
      ]
    });
  }

  // ── FINANCE ───────────────────────────────────────────────────────────────
  if (['SUPER_ADMIN','GENERAL_MANAGER','FINANCE_OFFICER','AUDITOR'].includes(role)) {
    items.push({
      label: 'Finance', icon: <DollarSign className="w-4 h-4" />,
      children: [
        { label: 'Dashboard',      to: '/finance/dashboard',      icon: <PieChart className="w-4 h-4" /> },
        { label: 'Accounts',       to: '/finance/accounts',       icon: <Wallet className="w-4 h-4" /> },
        { label: 'Income',         to: '/finance/income',         icon: <TrendingUp className="w-4 h-4" /> },
        { label: 'Expenses',       to: '/finance/expenses',       icon: <Receipt className="w-4 h-4" /> },
        { label: 'Invoices',       to: '/finance/invoices',       icon: <FileText className="w-4 h-4" /> },
        { label: 'Payments',       to: '/finance/payments',       icon: <CreditCard className="w-4 h-4" /> },
        { label: 'Transfers',      to: '/finance/transfers',      icon: <ArrowLeftRight className="w-4 h-4" /> },
        { label: 'Payroll',        to: '/finance/payroll',        icon: <Users className="w-4 h-4" /> },
        { label: 'General Ledger', to: '/finance/ledger',         icon: <BookMarked className="w-4 h-4" /> },
        { label: 'Tax',            to: '/finance/tax',            icon: <Scale className="w-4 h-4" /> },
        { label: 'Budgets',        to: '/finance/budgets',        icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Reconciliation', to: '/finance/reconciliation', icon: <Shield className="w-4 h-4" /> },
        { label: 'Reports',        to: '/finance/reports',        icon: <BarChart3 className="w-4 h-4" /> },
      ]
    });
  }

  // ── SUPPLIERS ─────────────────────────────────────────────────────────────
  if (['SUPER_ADMIN','GENERAL_MANAGER','FINANCE_OFFICER','AUDITOR'].includes(role)) {
    items.push({
      label: 'Suppliers', icon: <Package className="w-4 h-4" />,
      children: [
        { label: 'Dashboard',       to: '/suppliers/dashboard',       icon: <PieChart className="w-4 h-4" /> },
        { label: 'All Suppliers',   to: '/suppliers/list',            icon: <Users className="w-4 h-4" /> },
        { label: 'Purchase Orders', to: '/suppliers/purchase-orders', icon: <FileText className="w-4 h-4" /> },
        { label: 'Invoices',        to: '/suppliers/invoices',        icon: <Receipt className="w-4 h-4" /> },
        { label: 'Accounts Payable',to: '/suppliers/accounts-payable',icon: <CreditCard className="w-4 h-4" /> },
      ]
    });
  }

  // ── CONSULTANCY ───────────────────────────────────────────────────────────
  if (['SUPER_ADMIN','GENERAL_MANAGER','CONSULTANT','SALES_ADMISSIONS'].includes(role)) {
    items.push({
      label: 'Consultancy', icon: <Briefcase className="w-4 h-4" />,
      children: [
        { label: 'Dashboard', to: '/consultancy/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Leads',     to: '/consultancy/leads',     icon: <TrendingUp className="w-4 h-4" /> },
        { label: 'Clients',   to: '/consultancy/clients',   icon: <Building2 className="w-4 h-4" /> },
        { label: 'Proposals', to: '/consultancy/proposals', icon: <FileText className="w-4 h-4" /> },
        { label: 'Contracts', to: '/consultancy/contracts', icon: <FolderOpen className="w-4 h-4" /> },
        { label: 'Projects',  to: '/consultancy/projects',  icon: <Briefcase className="w-4 h-4" /> },
      ]
    });
  }

  // ── HR ────────────────────────────────────────────────────────────────────
  if (['SUPER_ADMIN','GENERAL_MANAGER','HR_OFFICER'].includes(role)) {
    items.push({
      label: 'HR', icon: <UserCheck className="w-4 h-4" />,
      children: [
        { label: 'Dashboard',   to: '/hr/dashboard',   icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Employees',   to: '/hr/employees',   icon: <Users className="w-4 h-4" /> },
        { label: 'Departments', to: '/hr/departments', icon: <Building2 className="w-4 h-4" /> },
        { label: 'Leave',       to: '/hr/leave',       icon: <Calendar className="w-4 h-4" /> },
      ]
    });
  }

  // ── SUPPORT ───────────────────────────────────────────────────────────────
  if (['SUPER_ADMIN','GENERAL_MANAGER','SUPPORT_OFFICER'].includes(role)) {
    items.push({ label: 'Support', to: '/support/tickets', icon: <Headphones className="w-4 h-4" /> });
  }

  // ── ADMIN TOOLS ───────────────────────────────────────────────────────────
  if (['SUPER_ADMIN','GENERAL_MANAGER'].includes(role)) {
    items.push(
      { label: 'Users',       to: '/admin/users',    icon: <Users className="w-4 h-4" /> },
      { label: 'Audit Logs',  to: '/admin/audit',    icon: <Shield className="w-4 h-4" /> },
      { label: 'Settings',    to: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
    );
  }

  // ── COMMON ────────────────────────────────────────────────────────────────
  items.push({ label: 'Announcements', to: '/communication/announcements', icon: <Megaphone className="w-4 h-4" /> });
  items.push({ label: 'Settings',      to: '/settings/profile',            icon: <Settings className="w-4 h-4" /> });

  return items;
};

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleGroup = (label: string) =>
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const navItems = buildNav(user?.role || '');

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  const renderItem = (item: NavItem) => {
    if (item.children) {
      const isExp = expanded.includes(item.label);
      return (
        <div key={item.label}>
          <button onClick={() => toggleGroup(item.label)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm gap-2">
            <span className="flex items-center gap-2.5 min-w-0">{item.icon}<span className="truncate">{item.label}</span></span>
            {isExp ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
          </button>
          {isExp && (
            <div className="ml-3 mt-0.5 border-l border-gray-700/50 pl-3 space-y-0.5">
              {item.children.map(child => (
                <NavLink key={child.to} to={child.to!} onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                  }>
                  {child.icon}<span>{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <NavLink key={item.to} to={item.to!} onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
        }>
        {item.icon}<span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-30 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            {branding.logo ? (
              <img src={branding.logo} alt="Academy logo"
                className="w-9 h-9 rounded-xl object-cover bg-white flex-shrink-0 shadow-lg shadow-blue-500/20" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate text-white">{ORG.logoText}</p>
              <p className="text-xs text-blue-400 truncate">Academy System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 sidebar-scroll">
          {navItems.map(renderItem)}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-700/50">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-900/50 hover:text-red-400 transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
