import React, { useEffect, useState } from 'react';
import { CreditCard, Receipt, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Invoice } from '../../types';
import toast from 'react-hot-toast';

export const StudentInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<Invoice | null>(null);
  const [payForm, setPayForm] = useState({ method: 'CASH', reference: '' });
  const [paying, setPaying] = useState(false);

  const load = () =>
    studentApi.getInvoices().then(r => setInvoices(r.data.data || [])).catch(() => toast.error('Failed to load invoices'));

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const handlePay = async (invoice: Invoice, isRemaining = false) => {
    setPaying(true);
    try {
      if (isRemaining) {
        await studentApi.payRemainingBalance(invoice.id, { method: payForm.method, reference: payForm.reference || undefined });
        toast.success('Remaining balance paid! Course access restored.');
      } else {
        await studentApi.makePayment({ invoiceId: invoice.id, amount: Number(invoice.outstandingBalance), method: payForm.method, reference: payForm.reference || undefined });
        toast.success('Payment successful!');
      }
      setPayModal(null);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <PageSpinner />;

  const outstanding = invoices.filter(i => ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status));
  const paid = invoices.filter(i => i.status === 'FULLY_PAID');

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>My Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your payments and outstanding balances</p>
        </div>
      </div>

      {/* Outstanding summary */}
      {outstanding.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Outstanding Payments</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Total outstanding: <strong>{formatCurrency(outstanding.reduce((s, i) => s + Number(i.outstandingBalance), 0))}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoices list */}
      {invoices.length === 0 ? (
        <div className="card text-center py-16">
          <Receipt className="w-16 h-16 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map(inv => {
            const isOverdue = inv.status === 'OVERDUE';
            const hasBalance = Number(inv.outstandingBalance) > 0;
            return (
              <div key={inv.id} className={`card ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold">#{inv.invoiceNumber}</h3>
                      {getStatusBadge(inv.status)}
                    </div>
                    {inv.course && <p className="text-sm text-gray-500 mt-1">{inv.course.title}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">Issued: {formatDate(inv.issueDate)}{inv.dueDate ? ` · Due: ${formatDate(inv.dueDate)}` : ''}</p>

                    {/* Payment breakdown */}
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="font-semibold">{formatCurrency(inv.totalAmount, inv.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Paid</p>
                        <p className="font-semibold text-green-700">{formatCurrency(inv.paidAmount, inv.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Outstanding</p>
                        <p className={`font-semibold ${hasBalance ? 'text-red-700' : 'text-green-700'}`}>
                          {formatCurrency(inv.outstandingBalance, inv.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (Number(inv.paidAmount) / Number(inv.totalAmount)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {Math.round((Number(inv.paidAmount) / Number(inv.totalAmount)) * 100)}% paid
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    {hasBalance && (
                      <Button
                        variant={isOverdue ? 'danger' : 'primary'}
                        icon={<CreditCard className="w-4 h-4" />}
                        onClick={() => setPayModal(inv)}
                      >
                        {inv.status === 'PARTIALLY_PAID' || isOverdue ? 'Pay Remaining Balance' : 'Pay Invoice'}
                      </Button>
                    )}
                    {inv.status === 'FULLY_PAID' && (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" /> Paid in full
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pay modal */}
      <Modal
        isOpen={!!payModal} onClose={() => setPayModal(null)}
        title="Make Payment" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayModal(null)}>Cancel</Button>
            <Button loading={paying} onClick={() => payModal && handlePay(payModal, payModal.status === 'PARTIALLY_PAID' || payModal.status === 'OVERDUE')}>
              Confirm Payment
            </Button>
          </>
        }
      >
        {payModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Invoice</span><span className="font-medium">#{payModal.invoiceNumber}</span></div>
              <div className="flex justify-between mt-1"><span className="text-gray-500">Amount to Pay</span><span className="font-bold text-lg text-primary-700">{formatCurrency(payModal.outstandingBalance)}</span></div>
            </div>
            <Select
              label="Payment Method"
              value={payForm.method}
              onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'MOBILE_MONEY', label: 'Mobile Money (MTN/Airtel)' },
                { value: 'CARD', label: 'Card Payment' },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
