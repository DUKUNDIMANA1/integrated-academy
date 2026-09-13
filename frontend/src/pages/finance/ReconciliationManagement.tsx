import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { financeApi } from '../../api/finance.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Account } from '../../types';
import toast from 'react-hot-toast';

export const ReconciliationManagement: React.FC = () => {
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ accountId: '', period: '', externalBalance: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [recRes, accRes] = await Promise.all([
        financeApi.getReconciliations(),
        financeApi.getAccounts(),
      ]);
      setReconciliations(recRes.data.data || []);
      setAccounts(accRes.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.accountId || !form.period || !form.externalBalance) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      await financeApi.createReconciliation({ ...form, externalBalance: parseFloat(form.externalBalance) });
      toast.success('Reconciliation completed');
      setShowModal(false);
      setForm({ accountId: '', period: '', externalBalance: '' });
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Reconciliation</h1><p className="text-sm text-gray-500">Compare system records with bank/external statements</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Reconciliation</Button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th>Account</th><th>Period</th><th>System Balance</th><th>External Balance</th><th>Difference</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {reconciliations.map((r: any) => {
                const diff = Number(r.difference);
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{r.accountId?.substring(0, 8)}…</td>
                    <td>{r.period}</td>
                    <td>{formatCurrency(r.systemBalance)}</td>
                    <td>{formatCurrency(r.externalBalance)}</td>
                    <td className={`font-semibold ${Math.abs(diff) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      <div className="flex items-center gap-1">
                        {Math.abs(diff) < 0.01
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        {formatCurrency(Math.abs(diff))}
                      </div>
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td className="text-xs text-gray-400">{formatDate(r.createdAt)}</td>
                  </tr>
                );
              })}
              {reconciliations.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-10">No reconciliations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Reconciliation" size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Reconcile</Button></>}
      >
        <div className="space-y-4">
          <Select label="Account *" value={form.accountId} onChange={f('accountId')}
            placeholder="Select account..." options={accounts.map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.currentBalance)})` }))} />
          <Input label="Period *" placeholder="e.g. Sep-2026 or Q3-2026" value={form.period} onChange={f('period')} />
          <Input label="External/Bank Balance (RWF) *" type="number" placeholder="Enter balance from bank statement"
            value={form.externalBalance} onChange={f('externalBalance')} />
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            The system will compare your entered balance with the system balance and flag any discrepancy.
          </div>
        </div>
      </Modal>
    </div>
  );
};
