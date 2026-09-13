import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Search, CheckCircle } from 'lucide-react';
import { supplierApi } from '../../api/supplier.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const SUPPLIER_TYPES = ['TECHNOLOGY','OFFICE_SUPPLIES','INTERNET','SOFTWARE','EQUIPMENT','TRAINING','FURNITURE','MAINTENANCE','TRANSPORT','CLEANING','SECURITY','CONSULTANCY','GENERAL','OTHER'];

const emptyForm = {
  name: '', companyName: '', type: 'GENERAL', category: '', registrationNumber: '', taxId: '',
  country: 'Rwanda', province: '', district: '', address: '', contactPerson: '',
  phone: '', email: '', website: '', bankName: '', bankAccount: '', accountName: '',
  paymentTerms: '30', creditLimit: '', notes: '',
};

export const SupplierList: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'financial'>('basic');
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await supplierApi.getSuppliers({ page, limit, search: search || undefined, status: statusFilter || undefined });
      setSuppliers(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      await supplierApi.createSupplier({ ...form, paymentTerms: parseInt(form.paymentTerms), creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : undefined });
      toast.success('Supplier created — pending approval');
      setShowModal(false);
      setForm({ ...emptyForm });
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id: string) => {
    setApproving(id);
    try { await supplierApi.approveSupplier(id); toast.success('Supplier approved'); await load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setApproving(null); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Suppliers</h1><p className="text-sm text-gray-500">{total} total suppliers</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add Supplier</Button>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <Input placeholder="Search name, email, code..." value={search} onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />} className="flex-1 min-w-[200px]" />
          <Select placeholder="All Statuses" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            options={['ACTIVE','INACTIVE','PENDING_APPROVAL','SUSPENDED','BLACKLISTED'].map(s => ({ value: s, label: s.replace(/_/g,' ') }))}
            className="w-48" />
          <Button type="submit">Search</Button>
        </form>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Supplier</th><th>Code</th><th>Type</th><th>Contact</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <p className="font-medium">{s.name}</p>
                      {s.companyName && <p className="text-xs text-gray-400">{s.companyName}</p>}
                    </td>
                    <td className="font-mono text-xs">{s.supplierCode}</td>
                    <td><span className="text-xs">{s.type?.replace(/_/g,' ')}</span></td>
                    <td>
                      <p className="text-xs">{s.contactPerson || s.email}</p>
                      <p className="text-xs text-gray-400">{s.phone}</p>
                    </td>
                    <td>{getStatusBadge(s.status)}</td>
                    <td className="text-xs text-gray-400">{formatDate(s.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/suppliers/${s.id}`)}>View</Button>
                        {s.status === 'PENDING_APPROVAL' && (
                          <Button size="sm" variant="success" loading={approving === s.id}
                            icon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleApprove(s.id)}>Approve</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-10">No suppliers found</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Supplier" size="xl"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Create Supplier</Button></>}
      >
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4 -mt-2">
          {(['basic', 'contact', 'financial'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'basic' ? 'Basic Info' : tab === 'contact' ? 'Contact' : 'Financial'}
            </button>
          ))}
        </div>

        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Supplier Name *" value={form.name} onChange={f('name')} />
              <Input label="Company Name" value={form.companyName} onChange={f('companyName')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Supplier Type" value={form.type} onChange={f('type')}
                options={SUPPLIER_TYPES.map(t => ({ value: t, label: t.replace(/_/g,' ') }))} />
              <Input label="Category" placeholder="e.g. Networking Equipment" value={form.category} onChange={f('category')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Registration Number" value={form.registrationNumber} onChange={f('registrationNumber')} />
              <Input label="Tax ID (TIN)" value={form.taxId} onChange={f('taxId')} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Country" value={form.country} onChange={f('country')} />
              <Input label="Province" value={form.province} onChange={f('province')} />
              <Input label="District" value={form.district} onChange={f('district')} />
            </div>
            <Input label="Address" value={form.address} onChange={f('address')} />
            <Textarea label="Notes" value={form.notes} onChange={f('notes')} rows={2} />
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-4">
            <Input label="Contact Person" value={form.contactPerson} onChange={f('contactPerson')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email *" type="email" value={form.email} onChange={f('email')} />
              <PhoneInput label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
            </div>
            <Input label="Website" value={form.website} onChange={f('website')} />
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Bank Name" value={form.bankName} onChange={f('bankName')} />
              <Input label="Account Number" value={form.bankAccount} onChange={f('bankAccount')} />
            </div>
            <Input label="Account Name" value={form.accountName} onChange={f('accountName')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Payment Terms (days)" type="number" value={form.paymentTerms} onChange={f('paymentTerms')} />
              <Input label="Credit Limit (RWF)" type="number" value={form.creditLimit} onChange={f('creditLimit')} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
