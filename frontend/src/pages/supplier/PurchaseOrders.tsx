import React, { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { supplierApi } from '../../api/supplier.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const PO_STATUSES = ['DRAFT','SUBMITTED','APPROVED','SENT','PARTIALLY_RECEIVED','RECEIVED','COMPLETED','CANCELLED'];

export const PurchaseOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplierId: '', description: '', expectedDate: '' });
  const [items, setItems] = useState([{ description: '', quantity: '1', unitPrice: '', tax: '0', discount: '0' }]);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const [poRes, supRes] = await Promise.all([
        supplierApi.getPurchaseOrders({ page, limit }),
        supplierApi.getSuppliers({ limit: 200, status: 'ACTIVE' }),
      ]);
      setOrders(poRes.data.data || []);
      setTotal(poRes.data.meta?.total || 0);
      setSuppliers(supRes.data.data || []);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const addItem = () => setItems(p => [...p, { description: '', quantity: '1', unitPrice: '', tax: '0', discount: '0' }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) =>
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleSave = async () => {
    if (!form.supplierId) { toast.error('Select a supplier'); return; }
    if (items.some(i => !i.description || !i.unitPrice)) { toast.error('Fill all item fields'); return; }
    setSaving(true);
    try {
      await supplierApi.createPurchaseOrder({
        supplierId: form.supplierId,
        description: form.description,
        expectedDate: form.expectedDate ? new Date(form.expectedDate) : undefined,
        items: items.map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
          tax: parseFloat(i.tax),
          discount: parseFloat(i.discount),
        })),
      });
      toast.success('Purchase order created');
      setShowModal(false);
      setForm({ supplierId: '', description: '', expectedDate: '' });
      setItems([{ description: '', quantity: '1', unitPrice: '', tax: '0', discount: '0' }]);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try { await supplierApi.updatePOStatus(id, status); toast.success('Status updated'); await load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const totalAmount = items.reduce((sum, i) => {
    const qty = parseFloat(i.quantity) || 0;
    const price = parseFloat(i.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Purchase Orders</h1><p className="text-sm text-gray-500">{total} total orders</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New PO</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Total</th><th>Expected Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map((po: any) => (
                  <tr key={po.id}>
                    <td className="font-mono text-xs font-medium">{po.poNumber}</td>
                    <td>{po.supplier?.name}</td>
                    <td className="font-semibold">{formatCurrency(po.totalAmount)}</td>
                    <td className="text-xs text-gray-400">{formatDate(po.expectedDate)}</td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td>
                      <Select
                        value={po.status}
                        onChange={e => handleStatusUpdate(po.id, e.target.value)}
                        options={PO_STATUSES.map(s => ({ value: s, label: s.replace(/_/g,' ') }))}
                        className="text-xs py-1"
                      />
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-10">No purchase orders</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Purchase Order" size="xl"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Create PO</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Supplier *" value={form.supplierId} onChange={e => setForm(p => ({ ...p, supplierId: e.target.value }))}
              placeholder="Select supplier..." options={suppliers.map(s => ({ value: s.id, label: s.name }))} />
            <Input label="Expected Delivery Date" type="date" value={form.expectedDate}
              onChange={e => setForm(p => ({ ...p, expectedDate: e.target.value }))} />
          </div>
          <Textarea label="Description" value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Items *</label>
              <Button size="sm" variant="ghost" onClick={addItem}>+ Add Item</Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-50 rounded-lg">
                  <div className="col-span-4">
                    <Input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Qty" type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <Input placeholder="Unit Price" type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Tax" type="number" value={item.tax} onChange={e => updateItem(i, 'tax', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-lg leading-none pb-2">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm font-semibold">
                Total: {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
