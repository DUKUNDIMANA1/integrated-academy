import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { academyApi } from '../../api/academy.api';
import { uploadsApi } from '../../api/uploads.api';
import { Button } from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { Course } from '../../types';
import toast from 'react-hot-toast';

const emptyForm = { code: '', title: '', description: '', category: '', type: 'CLASSROOM', durationDays: '30', partialPaymentLockDays: '15', fee: '', currency: 'RWF', capacity: '', status: 'DRAFT' };

export const CoursesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [thumbUrl, setThumbUrl] = useState<string>('');
  const [pendingThumb, setPendingThumb] = useState<File | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await academyApi.getCourses({ page, limit });
      setCourses(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setThumbUrl(''); setPendingThumb(null); setShowModal(true); };
  const openEdit = (c: Course) => {
    setEditing(c);
    setThumbUrl((c as any).thumbnail || '');
    setPendingThumb(null);
    setForm({ code: c.code, title: c.title, description: c.description || '', category: c.category || '', type: c.type, durationDays: String(c.durationDays), partialPaymentLockDays: String(c.partialPaymentLockDays), fee: String(c.fee), currency: c.currency, capacity: String(c.capacity || ''), status: c.status });
    setShowModal(true);
  };

  const handleThumb = async (file: File) => {
    // New course has no id yet — keep the file, upload right after create.
    if (!editing) {
      setPendingThumb(file);
      setThumbUrl(URL.createObjectURL(file));
      return;
    }
    setUploadingThumb(true);
    try {
      const r = await uploadsApi.uploadCourseThumbnail(editing.id, file);
      setThumbUrl(r.data.data.thumbnail as string);
      toast.success('Thumbnail uploaded');
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploadingThumb(false); }
  };

  const handleSave = async () => {
    if (!form.code || !form.title || !form.fee) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const payload = { ...form, durationDays: parseInt(form.durationDays), partialPaymentLockDays: parseInt(form.partialPaymentLockDays), fee: parseFloat(form.fee), capacity: form.capacity ? parseInt(form.capacity) : undefined };
      if (editing) {
        await academyApi.updateCourse(editing.id, payload);
      } else {
        const created = await academyApi.createCourse(payload);
        const newId = created.data?.data?.id as string | undefined;
        if (newId && pendingThumb) {
          try { await uploadsApi.uploadCourseThumbnail(newId, pendingThumb); }
          catch { toast.error('Course created but thumbnail upload failed'); }
        }
      }
      toast.success(editing ? 'Course updated' : 'Course created');
      setShowModal(false);
      setPendingThumb(null);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try { await academyApi.deleteCourse(deleting.id); toast.success('Course deleted'); setDeleting(null); await load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete'); setDeleting(null); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Courses</h1><p className="text-sm text-gray-500">Manage course catalogue</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openNew}>New Course</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Code</th><th>Title</th><th>Type</th><th>Duration</th><th>Fee</th><th>Lock Days</th><th>Status</th><th>Enrollments</th><th>Actions</th></tr></thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td className="font-mono font-medium text-xs">{c.code}</td>
                    <td><p className="font-medium">{c.title}</p>{c.category && <p className="text-xs text-gray-400">{c.category}</p>}</td>
                    <td><span className="badge badge-blue">{c.type}</span></td>
                    <td>{c.durationDays}d</td>
                    <td>{formatCurrency(c.fee, c.currency)}</td>
                    <td className="text-sm">{c.partialPaymentLockDays}d</td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>{c._count?.enrollments || 0}</td>
                    <td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" icon={<BookOpen className="w-3.5 h-3.5 text-primary-600" />} onClick={() => navigate(`/academy/courses/${c.id}/content`)} />
                        <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openEdit(c)} />
                        <Button size="sm" variant="ghost" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => setDeleting(c)} />
                      </div>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && <tr><td colSpan={9} className="text-center text-gray-400 py-10">No courses found</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Course' : 'New Course'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button></>}
      >
        <div className="space-y-4">
          <ImageUpload
            label="Course Thumbnail"
            hint="JPG or PNG, max 5MB. Shown on the public courses page."
            shape="banner"
            value={thumbUrl}
            uploading={uploadingThumb}
            onSelect={handleThumb}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Course Code *" placeholder="WD-101" value={form.code} onChange={f('code')} disabled={!!editing} />
            <Select label="Status" value={form.status} onChange={f('status')} options={[{value:'DRAFT',label:'Draft'},{value:'PUBLISHED',label:'Published'},{value:'ARCHIVED',label:'Archived'}]} />
          </div>
          <Input label="Title *" placeholder="Course title" value={form.title} onChange={f('title')} />
          <Textarea label="Description" value={form.description} onChange={f('description')} rows={2} />
          <div className="grid grid-cols-3 gap-3">
            <Select label="Type" value={form.type} onChange={f('type')} options={[{value:'CLASSROOM',label:'Classroom'},{value:'ONLINE',label:'Online'},{value:'HYBRID',label:'Hybrid'}]} />
            <Input label="Duration (days) *" type="number" value={form.durationDays} onChange={f('durationDays')} />
            <Input label="Payment Lock Day *" type="number" value={form.partialPaymentLockDays} onChange={f('partialPaymentLockDays')} hint="e.g. 15 for 30-day course" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Fee (RWF) *" type="number" value={form.fee} onChange={f('fee')} />
            <Input label="Capacity" type="number" value={form.capacity} onChange={f('capacity')} />
            <Input label="Category" placeholder="Technology" value={form.category} onChange={f('category')} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete}
        title="Delete Course" message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`} />
    </div>
  );
};
