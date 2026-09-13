import React, { useEffect, useState } from 'react';
import { CheckCircle, Plus } from 'lucide-react';
import { financeApi } from '../../api/finance.api';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Payment } from '../../types';
import toast from 'react-hot-toast';

export const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await financeApi.getPayments({ page, limit, status: statusFilter || undefined });
      setPayments(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleConfirm = async (id: string) => {
    setConfirming(id);
    try {
      await financeApi.confirmPayment(id);
      toast.success('Payment confirmed');
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setConfirming(null); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Payments</h1><p className="text-sm text-gray-500">All payment transactions</p></div>
      </div>

      <div className="card p-4">
        <Select placeholder="All Statuses" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          options={['PENDING','CONFIRMED','FAILED','REFUNDED'].map(s => ({ value: s, label: s }))}
          className="w-48" />
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Payment #</th><th>Student</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.paymentNumber}</td>
                    <td>{p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : '—'}</td>
                    <td className="font-mono text-xs">{p.invoice?.invoiceNumber}</td>
                    <td className="font-semibold">{formatCurrency(p.amount, p.currency)}</td>
                    <td><span className="text-xs">{p.method.replace(/_/g,' ')}</span></td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td className="text-xs text-gray-400">{formatDate(p.createdAt)}</td>
                    <td>
                      {p.status === 'PENDING' && (
                        <Button size="sm" variant="success"
                          loading={confirming === p.id}
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                          onClick={() => handleConfirm(p.id)}>Confirm</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-10">No payments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}
    </div>
  );
};
