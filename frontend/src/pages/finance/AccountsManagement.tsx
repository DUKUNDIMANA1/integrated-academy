import React, { useEffect, useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { financeApi } from '../../api/finance.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { Account } from '../../types';
import toast from 'react-hot-toast';

export const AccountsManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'CASH', currency: 'RWF', openingBalance: '', accountNumber: '', bankName: '' });

  const load = async () => {
    setLoading(true);
    try { const r = await financeApi.getAccounts(); setAccounts(r.data.data || []); }
    catch { toast.error('Failed to load accounts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.type) { toast.error('Name and type are required'); return; }
    setSaving(true);
    try {
      await financeApi.createAccount({ ...form, openingBalance: form.openingBalance ? parseFloat(form.openingBalance) : 0 });
      toast.success('Account created');
      setShowModal(false);
      setForm({ name: '', type: 'CASH', currency: 'RWF', openingBalance: '', accountNumber: '', bankName: '' });
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>Accounts</h1>
          <p className="text-sm text-gray-500">Total Balance: <strong>{formatCurrency(totalBalance)}</strong></p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Account</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(a => (
          <div key={a.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.type.replace('_', ' ')}</p>
                  </div>
                </div>
                {a.bankName && <p className="text-xs text-gray-400 mt-2">{a.bankName}</p>}
                {a.accountNumber && <p className="text-xs text-gray-400">{a.accountNumber}</p>}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Current Balance</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(a.currentBalance, a.currency)}</p>
              <p className="text-xs text-gray-400 mt-1">Opening: {formatCurrency(a.openingBalance, a.currency)}</p>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="card text-center py-10 text-gray-400 col-span-3">
            No accounts configured. Create one to start tracking finances.
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Account" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Create</Button></>}
      >
        <div className="space-y-4">
          <Input label="Account Name *" placeholder="e.g. Office Cash, Bank of Kigali" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Account Type *" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              options={[{value:'CASH',label:'Cash'},{value:'BANK',label:'Bank'},{value:'MOBILE_MONEY',label:'Mobile Money'},{value:'OTHER',label:'Other'}]} />
            <Input label="Currency" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} />
          </div>
          <Input label="Opening Balance (RWF)" type="number" value={form.openingBalance}
            onChange={e => setForm(p => ({ ...p, openingBalance: e.target.value }))} />
          <Input label="Bank Name (if Bank)" value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} />
          <Input label="Account Number" value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
};
