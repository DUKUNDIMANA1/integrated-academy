import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle, BarChart3,
  DollarSign, Clock, XCircle, BookOpen, CreditCard, Users
} from 'lucide-react';
import { financeApi } from '../../api/finance.api';
import { supplierApi } from '../../api/supplier.api';
import { StatCard } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

export const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [supplierData, setSupplierData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
    const end = now.toISOString();

    Promise.all([
      financeApi.getDashboard(),
      financeApi.getFinancialSummary({ startDate: yearStart, endDate: end }),
      supplierApi.getDashboard(),
    ]).then(([dash, report, supplier]) => {
      setSummary({ ...dash.data.data, ...report.data.data });
      setSupplierData(supplier.data.data);
    }).catch(() => toast.error('Failed to load finance data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (!summary) return null;

  const incomeCats = summary.incomeByCategory?.map((i: any, idx: number) => ({
    name: i.category?.replace(/_/g, ' '),
    value: Number(i._sum?.amount || 0),
    fill: COLORS[idx % COLORS.length],
  })) || [];

  const accountsData = summary.accounts?.map((a: any) => ({
    name: a.name.length > 14 ? a.name.substring(0, 14) + '…' : a.name,
    balance: Number(a.currentBalance),
  })) || [];

  // Mock monthly trend (replace with real endpoint in production)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyData = months.slice(0, new Date().getMonth() + 1).map((m, i) => ({
    month: m,
    income: Math.round((Number(summary.totalIncome || 0) / 12) * (0.7 + Math.random() * 0.6)),
    expenses: Math.round((Number(summary.totalExpense || 0) / 12) * (0.7 + Math.random() * 0.6)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1>Finance Dashboard</h1>
        <p className="text-sm text-gray-500">Complete financial overview — all figures in RWF</p>
      </div>

      {/* Row 1: Core KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(summary.totalIncome)}
          icon={<TrendingUp className="w-5 h-5 text-green-600" />} iconBg="bg-green-100"
          onClick={() => navigate('/finance/income')} />
        <StatCard title="Total Expenses" value={formatCurrency(summary.totalExpense)}
          icon={<TrendingDown className="w-5 h-5 text-red-600" />} iconBg="bg-red-100"
          onClick={() => navigate('/finance/expenses')} />
        <StatCard title="Net Profit" value={formatCurrency(summary.netResult)}
          subtitle={Number(summary.netResult) >= 0 ? '↑ Surplus' : '↓ Deficit'}
          icon={<BarChart3 className="w-5 h-5 text-primary-600" />} iconBg="bg-primary-100" />
        <StatCard title="Cash Balance" value={formatCurrency(summary.totalBalance)}
          icon={<Wallet className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100"
          onClick={() => navigate('/finance/accounts')} />
      </div>

      {/* Row 2: Receivable / Payable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Accounts Receivable" value={formatCurrency(summary.outstandingBalance)}
          subtitle="Student outstanding"
          icon={<AlertCircle className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-100"
          onClick={() => navigate('/finance/invoices')} />
        <StatCard title="Accounts Payable" value={formatCurrency(supplierData?.totalPayables || 0)}
          subtitle="Supplier outstanding"
          icon={<CreditCard className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-100"
          onClick={() => navigate('/suppliers/accounts-payable')} />
        <StatCard title="Pending Payments" value={formatCurrency(summary.monthIncome)}
          subtitle="This month income"
          icon={<Clock className="w-5 h-5 text-yellow-600" />} iconBg="bg-yellow-100"
          onClick={() => navigate('/finance/payments')} />
        <StatCard title="Overdue Invoices" value={formatCurrency(supplierData?.overduePayables || 0)}
          subtitle="Supplier overdue"
          icon={<XCircle className="w-5 h-5 text-red-600" />} iconBg="bg-red-100" />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="card">
          <h3 className="font-semibold mb-4">Revenue vs Expenses (Monthly)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="income" name="Revenue" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Income by Category */}
        <div className="card">
          <h3 className="font-semibold mb-4">Revenue by Category</h3>
          {incomeCats.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={incomeCats} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {incomeCats.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">No revenue data yet</p>}
        </div>
      </div>

      {/* Row 4: Cash flow + payment status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Balances Bar */}
        <div className="card">
          <h3 className="font-semibold mb-4">Account Balances</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={accountsData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="balance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Table */}
        <div className="card">
          <h3 className="font-semibold mb-4">Financial Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Revenue (YTD)', value: formatCurrency(summary.totalIncome), color: 'text-green-700' },
              { label: 'Total Expenses (YTD)', value: formatCurrency(summary.totalExpense), color: 'text-red-700' },
              { label: 'Net Profit / Loss', value: formatCurrency(summary.netResult), color: Number(summary.netResult) >= 0 ? 'text-green-700' : 'text-red-700' },
              { label: 'Outstanding Invoices', value: formatCurrency(summary.outstandingBalance), color: 'text-orange-700' },
              { label: 'Supplier Payables', value: formatCurrency(supplierData?.totalPayables || 0), color: 'text-purple-700' },
              { label: 'This Month Revenue', value: formatCurrency(summary.monthIncome), color: 'text-blue-700' },
              { label: 'This Month Expenses', value: formatCurrency(summary.monthExpense), color: 'text-gray-700' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 5: Accounts table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">Bank & Cash Accounts</h3>
          <button onClick={() => navigate('/finance/accounts')} className="text-sm text-primary-600 hover:underline">Manage accounts</button>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Account</th><th>Type</th><th>Bank</th><th>Opening Balance</th><th>Current Balance</th></tr></thead>
            <tbody>
              {summary.accounts?.map((a: any) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.name}</td>
                  <td><span className="badge badge-blue text-xs">{a.type.replace('_', ' ')}</span></td>
                  <td className="text-gray-500">{a.bankName || '—'}</td>
                  <td>{formatCurrency(a.openingBalance, a.currency)}</td>
                  <td className="font-semibold">{formatCurrency(a.currentBalance, a.currency)}</td>
                </tr>
              ))}
              {(!summary.accounts || summary.accounts.length === 0) && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">No accounts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
