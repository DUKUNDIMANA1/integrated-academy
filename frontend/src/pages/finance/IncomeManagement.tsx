import React, { useEffect, useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
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

const INCOME_CATEGORIES = ['COURSE_FEE','REGISTRATION_FEE','EXAM_FEE','CERTIFICATION_FEE','ELEARNING_FEE','CONSULTANCY_PAYMENT','PROJECT_PAYMENT','OTHER'];
const PAYMENT_METHODS = ['CASH','BANK_TRANSFER','MOBILE_MONEY','CARD'];

export const IncomeManagement: React.FC = () => {
  const [income, setIncome] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: '', source: '', description: '', amount: '', method: 'CASH', accountId: '', reference: '' });
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const [incRes, accRes] = await Promise.all([
        financeApi.getIncome({ page, limit }),
        financeApi.getAccounts(),
      ]);
      setIncome(incRes.data.data || []);
      setTotal(incRes.data.meta?.total || 0);
      setTotalAmount(incRes.data.meta?.totalAmount || 0);
      setAccounts(accRes.data.data || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleSave = async () => {
    if (!form.category || !form.amount || !form.accountId) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    try {
      await financeApi.createIncome({ ...form, amount: parseFloat(form.amount) });
      toast.success('Income recorded');
      setShowModal(false);
      setForm({ category: '', source: '', description: '', amount: '', method: 'CASH', accountId: '', reference: '' });
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>Income</h1>
          <p className="text-sm text-gray-500">Total: <strong>{formatCurrency(totalAmount)}</strong></p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Record Income</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Source</th><th>Amount</th><th>Method</th><th>Account</th><th>Status</th></tr></thead>
              <tbody>
                {income.map((inc: any) => (
                  <tr key={inc.id}>
                    <td className="text-xs text-gray-500">{formatDate(inc.date)}</td>
                    <td><span className="text-xs font-medium">{inc.category.replace(/_/g,' ')}</span></td>
                    <td className="text-gray-500">{inc.source || '—'}</td>
                    <td className="font-semibold text-green-700">{formatCurrency(inc.amount, inc.currency)}</td>
                    <td><span className="text-xs">{inc.method.replace(/_/g,' ')}</span></td>
                    <td>{inc.account?.name || '—'}</td>
                    <td>{getStatusBadge(inc.status)}</td>
                  </tr>
                ))}
                {income.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-10">No income records</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Income" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save Income</Button></>}
      >
        <div className="space-y-4">
          <Select label="Category *" value={form.category} onChange={f('category')} placeholder="Select category..."
            options={INCOME_CATEGORIES.map(c => ({ value: c, label: c.replace(/_/g,' ') }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (RWF) *" type="number" placeholder="0" value={form.amount} onChange={f('amount')} />
            <Select label="Payment Method *" value={form.method} onChange={f('method')}
              options={PAYMENT_METHODS.map(m => ({ value: m, label: m.replace(/_/g,' ') }))} />
          </div>
          <Select label="Account *" value={form.accountId} onChange={f('accountId')} placeholder="Select account..."
            options={accounts.map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.currentBalance, a.currency)})` }))} />
          <Input label="Source" placeholder="e.g. Student Name / Reference" value={form.source} onChange={f('source')} />
          <Input label="Reference" placeholder="Transaction reference" value={form.reference} onChange={f('reference')} />
          <Textarea label="Description" placeholder="Details..." value={form.description} onChange={f('description')} rows={2} />
        </div>
      </Modal>
    </div>
  );
};
