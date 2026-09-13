import React, { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { consultancyApi } from '../../api/consultancy.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Client, Project } from '../../types';
import toast from 'react-hot-toast';

export const ProjectsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clientId: '', title: '', description: '', budget: '', startDate: '', endDate: '' });
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const [projRes, clientRes] = await Promise.all([consultancyApi.getProjects({ page, limit }), consultancyApi.getClients({ limit: 200 })]);
      setProjects(projRes.data.data || []);
      setTotal(projRes.data.meta?.total || 0);
      setClients(clientRes.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleSave = async () => {
    if (!form.clientId || !form.title || !form.startDate) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await consultancyApi.createProject({ ...form, budget: form.budget ? parseFloat(form.budget) : undefined });
      toast.success('Project created');
      setShowModal(false);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Projects</h1><p className="text-sm text-gray-500">{total} total projects</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Project</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Title</th><th>Client</th><th>Budget</th><th>Start Date</th><th>Status</th><th>Milestones</th><th>Tasks</th><th></th></tr></thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.title}</td>
                    <td>{p.client?.name}</td>
                    <td>{p.budget ? formatCurrency(p.budget, p.currency) : '—'}</td>
                    <td className="text-xs text-gray-400">{formatDate(p.startDate)}</td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td>{(p as any)._count?.milestones || 0}</td>
                    <td>{(p as any)._count?.tasks || 0}</td>
                    <td>
                      <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/consultancy/projects/${p.id}`)}>View</Button>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-10">No projects</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Project" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Create</Button></>}
      >
        <div className="space-y-4">
          <Select label="Client *" value={form.clientId} onChange={f('clientId')} placeholder="Select client..."
            options={clients.map(c => ({ value: c.id, label: c.name }))} />
          <Input label="Project Title *" value={form.title} onChange={f('title')} />
          <Textarea label="Description" value={form.description} onChange={f('description')} rows={2} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Budget (RWF)" type="number" value={form.budget} onChange={f('budget')} />
            <Input label="Start Date *" type="date" value={form.startDate} onChange={f('startDate')} />
            <Input label="End Date" type="date" value={form.endDate} onChange={f('endDate')} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
