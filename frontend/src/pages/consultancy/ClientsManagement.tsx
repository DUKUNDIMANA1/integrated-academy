import React, { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { consultancyApi } from '../../api/consultancy.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { Client } from '../../types';
import toast from 'react-hot-toast';

export const ClientsManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '', contactPerson: '' });
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try { const r = await consultancyApi.getClients({ page, limit }); setClients(r.data.data || []); setTotal(r.data.meta?.total || 0); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    setSaving(true);
    try { await consultancyApi.createClient(form); toast.success('Client created'); setShowModal(false); await load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Clients</h1><p className="text-sm text-gray-500">{total} clients</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Client</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Phone</th><th>Projects</th><th>Invoices</th></tr></thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td className="text-gray-500">{c.email}</td>
                    <td>{c.company || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c._count?.projects || 0}</td>
                    <td>{c._count?.invoices || 0}</td>
                  </tr>
                ))}
                {clients.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-10">No clients</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Client" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Create</Button></>}
      >
        <div className="space-y-4">
          <Input label="Name *" value={form.name} onChange={f('name')} />
          <Input label="Email *" type="email" value={form.email} onChange={f('email')} />
          <div className="grid grid-cols-2 gap-3">
            <PhoneInput label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
            <Input label="Company" value={form.company} onChange={f('company')} />
          </div>
          <Input label="Contact Person" value={form.contactPerson} onChange={f('contactPerson')} />
          <Input label="Address" value={form.address} onChange={f('address')} />
        </div>
      </Modal>
    </div>
  );
};
