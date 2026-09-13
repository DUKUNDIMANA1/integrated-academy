import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ledgerApi } from '../../api/ledger.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const TAX_TYPES = ['VAT','INCOME_TAX','WITHHOLDING_TAX','PAYE','OTHER'];

export const TaxManagement: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'VAT', rate: '', amount: '', period: '', startDate: '', endDate: '', dueDate: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try { const r = await ledgerApi.getTaxRecords(); setRecords(r.data.data || []); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.type || !form.period) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await ledgerApi.createTaxRecord({
        ...form, rate: parseFloat(form.rate) || 0,
        amount: form.amount ? parseFloat(form.amount) : undefined,
      });
      toast.success('Tax record created');
      setShowModal(false);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await ledgerApi.updateTaxRecord(id, { status, paidAt: status === 'PAID' ? new Date().toISOString() : undefined });
      toast.success('Status updated');
      await load();
    } catch { toast.error('Failed'); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Tax Management</h1><p className="text-sm text-gray-500">Tax records, liabilities and payments</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add Tax Record</Button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Period</th><th>Rate</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.name}</td>
                  <td><span className="badge badge-blue text-xs">{r.type}</span></td>
                  <td>{r.period}</td>
                  <td>{(Number(r.rate) * 100).toFixed(1)}%</td>
                  <td className="font-semibold">{r.amount ? formatCurrency(r.amount) : '—'}</td>
                  <td className={r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'PAID' ? 'text-red-600 font-semibold text-sm' : 'text-sm text-gray-500'}>
                    {formatDate(r.dueDate)}
                  </td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td>
                    {r.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleUpdateStatus(r.id, 'FILED')}>File</Button>
                        <Button size="sm" variant="success" onClick={() => handleUpdateStatus(r.id, 'PAID')}>Mark Paid</Button>
                      </div>
                    )}
                    {r.status === 'FILED' && (
                      <Button size="sm" variant="success" onClick={() => handleUpdateStatus(r.id, 'PAID')}>Mark Paid</Button>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-10">No tax records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Tax Record" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tax Name *" placeholder="e.g. VAT Q3 2026" value={form.name} onChange={f('name')} />
            <Select label="Tax Type *" value={form.type} onChange={f('type')}
              options={TAX_TYPES.map(t => ({ value: t, label: t.replace(/_/g,' ') }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Period *" placeholder="e.g. Q3-2026" value={form.period} onChange={f('period')} />
            <Input label="Rate (%)" type="number" placeholder="18" value={form.rate} onChange={f('rate')} />
          </div>
          <Input label="Amount (RWF)" type="number" value={form.amount} onChange={f('amount')} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Start Date" type="date" value={form.startDate} onChange={f('startDate')} />
            <Input label="End Date" type="date" value={form.endDate} onChange={f('endDate')} />
            <Input label="Due Date" type="date" value={form.dueDate} onChange={f('dueDate')} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
