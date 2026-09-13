import React, { useEffect, useState } from 'react';
import { Search, Plus, Eye } from 'lucide-react';
import { financeApi } from '../../api/finance.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Invoice } from '../../types';
import toast from 'react-hot-toast';

export const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await financeApi.getInvoices({ page, limit, status: status || undefined });
      setInvoices(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, status]);

  const openDetail = async (id: string) => {
    const r = await financeApi.getInvoice(id);
    setSelected(r.data.data);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Invoices</h1><p className="text-sm text-gray-500">Manage all invoices</p></div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <Select placeholder="All Statuses" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          options={['UNPAID','PARTIALLY_PAID','FULLY_PAID','OVERDUE','CANCELLED','REFUNDED'].map(s => ({ value: s, label: s.replace(/_/g,' ') }))}
          className="w-48" />
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Invoice #</th><th>Student</th><th>Course</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="font-mono font-medium">{inv.invoiceNumber}</td>
                    <td>{inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : '—'}</td>
                    <td>{inv.course?.title || '—'}</td>
                    <td>{formatCurrency(inv.totalAmount, inv.currency)}</td>
                    <td className="text-green-700">{formatCurrency(inv.paidAmount, inv.currency)}</td>
                    <td className={Number(inv.outstandingBalance) > 0 ? 'text-red-700 font-semibold' : ''}>
                      {formatCurrency(inv.outstandingBalance, inv.currency)}
                    </td>
                    <td>{getStatusBadge(inv.status)}</td>
                    <td className="text-xs text-gray-400">{formatDate(inv.issueDate)}</td>
                    <td>
                      <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => openDetail(inv.id)}>View</Button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-gray-400 py-10">No invoices found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Invoice Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400">Invoice #</p><p className="font-mono font-bold text-lg">{selected.invoiceNumber}</p></div>
              <div><p className="text-gray-400">Status</p>{getStatusBadge(selected.status)}</div>
              <div><p className="text-gray-400">Issue Date</p><p>{formatDate(selected.issueDate)}</p></div>
              {selected.dueDate && <div><p className="text-gray-400">Due Date</p><p>{formatDate(selected.dueDate)}</p></div>}
            </div>
            <div className="border-t pt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-400 text-xs">Total Amount</p>
                <p className="font-bold text-lg">{formatCurrency(selected.totalAmount, selected.currency)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-gray-400 text-xs">Paid</p>
                <p className="font-bold text-lg text-green-700">{formatCurrency(selected.paidAmount, selected.currency)}</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${Number(selected.outstandingBalance) > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className="text-gray-400 text-xs">Outstanding</p>
                <p className={`font-bold text-lg ${Number(selected.outstandingBalance) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {formatCurrency(selected.outstandingBalance, selected.currency)}
                </p>
              </div>
            </div>
            {selected.payments && selected.payments.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">Payment History</p>
                <div className="space-y-2">
                  {selected.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                      <span>{p.paymentNumber} — {p.method.replace(/_/g,' ')}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatCurrency(p.amount, selected.currency)}</span>
                        {getStatusBadge(p.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
