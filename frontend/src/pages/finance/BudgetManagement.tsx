import React, { useEffect, useState } from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import { financeApi } from '../../api/finance.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const BudgetManagement: React.FC = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', period: 'MONTHLY', startDate: '', endDate: '', totalAmount: '', currency: 'RWF', department: '', category: '' });
  const [items, setItems] = useState([{ category: '', description: '', allocatedAmount: '' }]);

  const load = async () => {
    setLoading(true);
    try { const r = await financeApi.getBudgets(); setBudgets(r.data.data || []); }
    catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate || !form.totalAmount) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await financeApi.createBudget({
        ...form,
        totalAmount: parseFloat(form.totalAmount),
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        items: items.filter(i => i.category && i.allocatedAmount).map(i => ({
          category: i.category,
          description: i.description,
          allocatedAmount: parseFloat(i.allocatedAmount),
        })),
      });
      toast.success('Budget created');
      setShowModal(false);
      setForm({ name: '', period: 'MONTHLY', startDate: '', endDate: '', totalAmount: '', currency: 'RWF', department: '', category: '' });
      setItems([{ category: '', description: '', allocatedAmount: '' }]);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const addItem = () => setItems(p => [...p, { category: '', description: '', allocatedAmount: '' }]);
  const updateItem = (i: number, field: string, value: string) =>
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Budget Management</h1><p className="text-sm text-gray-500">Plan and monitor organizational budgets</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Budget</Button>
      </div>

      {budgets.length === 0 ? (
        <div className="card text-center py-16">
          <BarChart3 className="w-14 h-14 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">No budgets created yet</p>
          <Button className="mt-4" onClick={() => setShowModal(true)}>Create Budget</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b: any) => {
            const totalAllocated = b.items?.reduce((s: number, i: any) => s + Number(i.allocatedAmount), 0) || 0;
            const totalActual = b.items?.reduce((s: number, i: any) => s + Number(i.actualAmount), 0) || 0;
            const utilization = totalAllocated > 0 ? (totalActual / totalAllocated) * 100 : 0;
            return (
              <div key={b.id} className="card cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedBudget(selectedBudget?.id === b.id ? null : b)}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{b.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{b.period} · {b.department || 'General'}</p>
                  </div>
                  {getStatusBadge(b.status)}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Budget Utilization</span>
                    <span className={`font-semibold ${utilization > 90 ? 'text-red-600' : utilization > 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {utilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${utilization > 90 ? 'bg-red-500' : utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, utilization)}%` }} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Total Budget</p>
                    <p className="font-semibold">{formatCurrency(b.totalAmount, b.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Period</p>
                    <p className="font-medium">{formatDate(b.startDate)} – {formatDate(b.endDate)}</p>
                  </div>
                </div>

                {/* Expanded items */}
                {selectedBudget?.id === b.id && b.items?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">BUDGET ITEMS</p>
                    <div className="space-y-2">
                      {b.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{item.category}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <span>Budget: {formatCurrency(item.allocatedAmount)}</span>
                            <span className={Number(item.actualAmount) > Number(item.allocatedAmount) ? 'text-red-600' : 'text-green-600'}>
                              Actual: {formatCurrency(item.actualAmount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Budget" size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Create</Button></>}
      >
        <div className="space-y-4">
          <Input label="Budget Name *" placeholder="e.g. Q4 2026 Operations Budget" value={form.name} onChange={f('name')} />
          <div className="grid grid-cols-3 gap-3">
            <Select label="Period *" value={form.period} onChange={f('period')}
              options={['MONTHLY','QUARTERLY','ANNUAL'].map(p => ({ value: p, label: p }))} />
            <Input label="Start Date *" type="date" value={form.startDate} onChange={f('startDate')} />
            <Input label="End Date *" type="date" value={form.endDate} onChange={f('endDate')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Amount (RWF) *" type="number" value={form.totalAmount} onChange={f('totalAmount')} />
            <Input label="Department" placeholder="e.g. Technology" value={form.department} onChange={f('department')} />
          </div>

          {/* Budget Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Budget Line Items</label>
              <Button size="sm" variant="ghost" onClick={addItem}>+ Add Item</Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                  <div className="col-span-4">
                    <Input placeholder="Category" value={item.category} onChange={e => updateItem(i, 'category', e.target.value)} />
                  </div>
                  <div className="col-span-4">
                    <Input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <Input placeholder="Amount" type="number" value={item.allocatedAmount} onChange={e => updateItem(i, 'allocatedAmount', e.target.value)} />
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
