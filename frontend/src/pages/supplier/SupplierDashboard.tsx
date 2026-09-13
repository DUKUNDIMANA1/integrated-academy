import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, CreditCard, AlertCircle, TrendingDown, CheckCircle } from 'lucide-react';
import { supplierApi } from '../../api/supplier.api';
import { StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const SupplierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierApi.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>Supplier Dashboard</h1>
          <p className="text-sm text-gray-500">Procurement and payables overview</p>
        </div>
        <Button onClick={() => navigate('/suppliers/new')}>+ Add Supplier</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Suppliers" value={data.total}
          icon={<Users className="w-5 h-5 text-primary-600" />} iconBg="bg-primary-100"
          onClick={() => navigate('/suppliers/list')} />
        <StatCard title="Active Suppliers" value={data.active}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Pending Approval" value={data.pendingApproval}
          icon={<AlertCircle className="w-5 h-5 text-yellow-600" />} iconBg="bg-yellow-100" />
        <StatCard title="Pending Invoices" value={data.pendingInvoices}
          icon={<FileText className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100"
          onClick={() => navigate('/suppliers/invoices')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Payables" value={formatCurrency(data.totalPayables)}
          subtitle="Outstanding to suppliers"
          icon={<TrendingDown className="w-5 h-5 text-red-600" />} iconBg="bg-red-100"
          onClick={() => navigate('/suppliers/accounts-payable')} />
        <StatCard title="Overdue Payables" value={formatCurrency(data.overduePayables)}
          subtitle="Past due date"
          icon={<AlertCircle className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-100" />
      </div>

      {/* Top Suppliers */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">Top Suppliers</h3>
          <Button size="sm" variant="ghost" onClick={() => navigate('/suppliers/list')}>View all</Button>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Supplier</th><th>Code</th><th>Category</th><th>Invoices</th><th>Status</th></tr></thead>
            <tbody>
              {data.topSuppliers?.map((s: any) => (
                <tr key={s.id} className="cursor-pointer" onClick={() => navigate(`/suppliers/${s.id}`)}>
                  <td><p className="font-medium">{s.name}</p><p className="text-xs text-gray-400">{s.email}</p></td>
                  <td className="font-mono text-xs">{s.supplierCode}</td>
                  <td>{s.category || s.type}</td>
                  <td>{s._count?.invoices || 0}</td>
                  <td>{getStatusBadge(s.status)}</td>
                </tr>
              ))}
              {(!data.topSuppliers || data.topSuppliers.length === 0) && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">No suppliers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'All Suppliers', path: '/suppliers/list' },
          { label: 'Purchase Orders', path: '/suppliers/purchase-orders' },
          { label: 'Supplier Invoices', path: '/suppliers/invoices' },
          { label: 'Accounts Payable', path: '/suppliers/accounts-payable' },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className="card text-center py-4 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors cursor-pointer">
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};
