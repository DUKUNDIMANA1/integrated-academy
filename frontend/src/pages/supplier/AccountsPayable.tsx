import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, TrendingDown } from 'lucide-react';
import { supplierApi } from '../../api/supplier.api';
import { StatCard } from '../../components/ui/Card';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const AccountsPayable: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [aging, setAging] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([supplierApi.getAccountsPayable(), supplierApi.getAgingReport()])
      .then(([apRes, agingRes]) => {
        setData(apRes.data.data);
        setAging(agingRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div><h1>Accounts Payable</h1><p className="text-sm text-gray-500">Money owed to suppliers</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Payables" value={formatCurrency(data.summary?.total)}
          icon={<TrendingDown className="w-5 h-5 text-red-600" />} iconBg="bg-red-100" />
        <StatCard title="Due This Week" value={formatCurrency(data.summary?.dueThisWeek)}
          icon={<Clock className="w-5 h-5 text-yellow-600" />} iconBg="bg-yellow-100" />
        <StatCard title="Due This Month" value={formatCurrency(data.summary?.dueThisMonth)}
          icon={<Clock className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-100" />
        <StatCard title="Overdue" value={formatCurrency(data.summary?.overdue)}
          icon={<AlertCircle className="w-5 h-5 text-red-600" />} iconBg="bg-red-100" />
      </div>

      {/* Outstanding Invoices */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold">Outstanding Supplier Invoices</h3>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Invoice #</th><th>Supplier</th><th>Total</th><th>Outstanding</th><th>Due Date</th><th>Status</th></tr></thead>
            <tbody>
              {data.invoices?.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="font-medium">{inv.supplier?.name}</td>
                  <td>{formatCurrency(inv.totalAmount)}</td>
                  <td className="font-semibold text-red-700">{formatCurrency(inv.outstandingBalance)}</td>
                  <td className={`text-sm ${inv.dueDate && new Date(inv.dueDate) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {formatDate(inv.dueDate)}
                  </td>
                  <td>{getStatusBadge(inv.status)}</td>
                </tr>
              ))}
              {(!data.invoices || data.invoices.length === 0) && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">No outstanding invoices</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aging Report */}
      {aging.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold">Supplier Aging Report</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Supplier</th><th>Current</th><th>1–30 Days</th><th>31–60 Days</th><th>61–90 Days</th><th>Total</th></tr>
              </thead>
              <tbody>
                {aging.map((row: any) => (
                  <tr key={row.supplierId}>
                    <td className="font-medium">{row.supplierName}</td>
                    <td>{formatCurrency(row.current)}</td>
                    <td className={row.days30 > 0 ? 'text-yellow-700' : ''}>{formatCurrency(row.days30)}</td>
                    <td className={row.days60 > 0 ? 'text-orange-700' : ''}>{formatCurrency(row.days60)}</td>
                    <td className={row.days90 > 0 ? 'text-red-700 font-semibold' : ''}>{formatCurrency(row.days90)}</td>
                    <td className="font-bold">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
