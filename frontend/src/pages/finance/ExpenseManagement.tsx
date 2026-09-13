import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { financeApi } from '../../api/finance.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Account } from '../../types';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = ['SALARY','RENT','ELECTRICITY','WATER','INTERNET','TRANSPORT','OFFICE_SUPPLIES','EQUIPMENT','SOFTWARE','MARKETING','MAINTENANCE','TRAINING','TAXES','BANK_CHARGES','OTHER'];

export const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: '', description: '', amount: '', method: 'CASH', accountId: '', paidTo: '' });
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const [expRes, accRes] = await Promise.all([financeApi.getExpenses({ page, limit }), financeApi.getAccounts()]);
      setExpenses(expRes.data.data || []);
      setTotal(expRes.data.meta?.total || 0);
      setAccounts(accRes.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleSave = async () => {
    if (!form.category || !form.amount || !form.accountId) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await financeApi.createExpense({ ...form, amount: parseFloat(form.amount) });
      toast.success('Expense recorded');
      setShowModal(false);
      setForm({ category: '', description: '', amount: '', method: 'CASH', accountId: '', paidTo: '' });
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id: string) => {
    try { await financeApi.approveExpense(id); toast.success('Expense approved'); await load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handlePay = async (id: string) => {
    try { await financeApi.payExpense(id); toast.success('Expense paid'); await load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Expenses</h1><p className="text-sm text-gray-500">Track and manage expenses</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Record Expense</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Paid To</th><th>Amount</th><th>Account</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {expenses.map((exp: any) => (
                  <tr key={exp.id}>
                    <td className="text-xs text-gray-500">{formatDate(exp.date)}</td>
                    <td><span className="text-xs font-medium">{exp.category.replace(/_/g,' ')}</span></td>
                    <td>{exp.paidTo || '—'}</td>
                    <td className="font-semibold text-red-700">{formatCurrency(exp.amount, exp.currency)}</td>
                    <td>{exp.account?.name || '—'}</td>
                    <td>{getStatusBadge(exp.status)}</td>
                    <td>
                      <div className="flex gap-1">
                        {exp.status === 'PENDING' && <Button size="sm" variant="success" onClick={() => handleApprove(exp.id)}>Approve</Button>}
                        {exp.status === 'APPROVED' && <Button size="sm" onClick={() => handlePay(exp.id)}>Pay</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-10">No expenses</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Expense" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save</Button></>}
      >
        <div className="space-y-4">
          <Select label="Category *" value={form.category} onChange={f('category')} placeholder="Select..."
            options={EXPENSE_CATEGORIES.map(c => ({ value: c, label: c.replace(/_/g,' ') }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (RWF) *" type="number" value={form.amount} onChange={f('amount')} />
            <Select label="Method *" value={form.method} onChange={f('method')}
              options={[{value:'CASH',label:'Cash'},{value:'BANK_TRANSFER',label:'Bank Transfer'},{value:'MOBILE_MONEY',label:'Mobile Money'}]} />
          </div>
          <Select label="Account *" value={form.accountId} onChange={f('accountId')} placeholder="Select account..."
            options={accounts.map(a => ({ value: a.id, label: a.name }))} />
          <Input label="Paid To" placeholder="Recipient name" value={form.paidTo} onChange={f('paidTo')} />
          <Textarea label="Description" value={form.description} onChange={f('description')} rows={2} />
        </div>
      </Modal>
    </div>
  );
};
