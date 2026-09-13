import React, { useEffect, useState } from 'react';
import { Plus, Edit } from 'lucide-react';
import { hrApi } from '../../api/hr.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import { Department } from '../../types';
import toast from 'react-hot-toast';

export const DepartmentsManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = async () => {
    setLoading(true);
    try { const r = await hrApi.getDepartments(); setDepartments(r.data.data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (d: Department) => { setEditing(d); setForm({ name: d.name, description: d.description || '' }); setShowModal(true); };
  const openNew = () => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      editing ? await hrApi.updateDepartment(editing.id, form) : await hrApi.createDepartment(form);
      toast.success(editing ? 'Department updated' : 'Department created');
      setShowModal(false);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Departments</h1><p className="text-sm text-gray-500">{departments.length} departments</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openNew}>New Department</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(d => (
          <div key={d.id} className="card flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{d.name}</h3>
              {d.description && <p className="text-sm text-gray-500 mt-1">{d.description}</p>}
              <p className="text-xs text-gray-400 mt-2">{d._count?.employees || 0} employees</p>
            </div>
            <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openEdit(d)} />
          </div>
        ))}
        {departments.length === 0 && <div className="card text-center py-10 text-gray-400 col-span-3">No departments</div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Department' : 'New Department'} size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save</Button></>}
      >
        <div className="space-y-4">
          <Input label="Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
        </div>
      </Modal>
    </div>
  );
};
