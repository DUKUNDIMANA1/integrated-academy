import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { financeApi } from '../../api/finance.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Account } from '../../types';
import toast from 'react-hot-toast';

export const TransferManagement: React.FC = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', reference: '', description: '' });
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        financeApi.getTransfers({ page, limit }),
        financeApi.getAccounts(),
      ]);
      setTransfers(tRes.data.data || []);
      setTotal(tRes.data.meta?.total || 0);
      setAccounts(aRes.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleSave = async () => {
    if (!form.fromAccountId || !form.toAccountId || !form.amount) { toast.error('Fill required fields'); return; }
    if (form.fromAccountId === form.toAccountId) { toast.error('Cannot transfer to the same account'); return; }
    setSaving(true);
    try {
      await financeApi.createTransfer({ ...form, amount: parseFloat(form.amount) });
      toast.success('Transfer completed successfully');
      setShowModal(false);
      setForm({ fromAccountId: '', toAccountId: '', amount: '', reference: '', description: '' });
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const accountOptions = accounts.map(a => ({
    value: a.id,
    label: `${a.name} (${formatCurrency(a.currentBalance, a.currency)})`
  }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>Transfers</h1>
          <p className="text-sm text-gray-500">Internal account transfers — not counted as income or expense</p>
        </div>
        <Button icon={<ArrowLeftRight className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Transfer</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>From Account</th><th>To Account</th><th>Amount</th><th>Reference</th><th>Description</th><th>Date</th></tr></thead>
              <tbody>
                {transfers.map((t: any) => (
                  <tr key={t.id}>
                    <td>
                      <p className="font-medium">{t.fromAccount?.name}</p>
                      <p className="text-xs text-gray-400">{t.fromAccount?.type}</p>
                    </td>
                    <td>
                      <p className="font-medium">{t.toAccount?.name}</p>
                      <p className="text-xs text-gray-400">{t.toAccount?.type}</p>
                    </td>
                    <td className="font-semibold text-primary-700">{formatCurrency(t.amount, t.currency)}</td>
                    <td className="font-mono text-xs">{t.reference || '—'}</td>
                    <td className="text-gray-500 text-sm">{t.description || '—'}</td>
                    <td className="text-xs text-gray-400">{formatDate(t.transferDate)}</td>
                  </tr>
                ))}
                {transfers.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">No transfers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Transfer" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Transfer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠ Internal transfers do not affect total income or expenses — only account balances.
          </div>
          <Select label="From Account *" value={form.fromAccountId} onChange={f('fromAccountId')}
            placeholder="Select source account..." options={accountOptions} />
          <Select label="To Account *" value={form.toAccountId} onChange={f('toAccountId')}
            placeholder="Select destination account..." options={accountOptions} />
          <Input label="Amount (RWF) *" type="number" placeholder="0" value={form.amount} onChange={f('amount')} />
          <Input label="Reference" placeholder="Transfer reference" value={form.reference} onChange={f('reference')} />
          <Textarea label="Description" placeholder="Reason for transfer..." value={form.description} onChange={f('description')} rows={2} />
        </div>
      </Modal>
    </div>
  );
};
