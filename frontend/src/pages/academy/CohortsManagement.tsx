import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { academyApi } from '../../api/academy.api';
import { Button } from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CohortsManagement: React.FC = () => {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    courseId: '', name: '', startDate: '', endDate: '', capacity: '', status: 'UPCOMING',
  });

  // Schedule state
  const [schedulesCohort, setSchedulesCohort] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: '1', startTime: '08:00', endTime: '10:00', classroom: '' });
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cohortRes, courseRes] = await Promise.all([
        academyApi.getCohorts(),
        academyApi.getCourses({ status: 'PUBLISHED', limit: 200 }),
      ]);
      setCohorts(cohortRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ courseId: '', name: '', startDate: '', endDate: '', capacity: '', status: 'UPCOMING' });
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      courseId: c.courseId, name: c.name,
      startDate: c.startDate?.split('T')[0] || '',
      endDate: c.endDate?.split('T')[0] || '',
      capacity: String(c.capacity || ''),
      status: c.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.courseId || !form.name || !form.startDate || !form.endDate) {
      toast.error('Fill all required fields'); return;
    }
    setSaving(true);
    try {
      const payload = {
        courseId: form.courseId, name: form.name,
        startDate: new Date(form.startDate), endDate: new Date(form.endDate),
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        status: form.status,
      };
      editing
        ? await academyApi.updateCohort(editing.id, payload)
        : await academyApi.createCohort(payload);
      toast.success(editing ? 'Cohort updated' : 'Cohort created');
      setShowModal(false);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await academyApi.deleteCohort(deleting.id);
      toast.success('Cohort deleted');
      setDeleting(null);
      await load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to delete'); }
  };

  // ── Schedules ──────────────────────────────────────────────────────────────

  const openSchedules = async (cohort: any) => {
    setSchedulesCohort(cohort);
    setLoadingSchedules(true);
    setEditingSchedule(null);
    setScheduleForm({ dayOfWeek: '1', startTime: '08:00', endTime: '10:00', classroom: '' });
    try {
      const r = await academyApi.getSchedules(cohort.id);
      setSchedules(r.data.data || []);
    } catch { toast.error('Failed to load schedules'); }
    finally { setLoadingSchedules(false); }
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const payload = {
        dayOfWeek: parseInt(scheduleForm.dayOfWeek),
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        classroom: scheduleForm.classroom || undefined,
      };
      if (editingSchedule) {
        await academyApi.updateSchedule(editingSchedule.id, payload);
        toast.success('Schedule updated');
      } else {
        await academyApi.createSchedule(schedulesCohort.id, payload);
        toast.success('Schedule added');
      }
      setEditingSchedule(null);
      setScheduleForm({ dayOfWeek: '1', startTime: '08:00', endTime: '10:00', classroom: '' });
      const r = await academyApi.getSchedules(schedulesCohort.id);
      setSchedules(r.data.data || []);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSavingSchedule(false); }
  };

  const deleteSchedule = async () => {
    try {
      await academyApi.deleteSchedule(deletingSchedule.id);
      toast.success('Schedule removed');
      setDeletingSchedule(null);
      const r = await academyApi.getSchedules(schedulesCohort.id);
      setSchedules(r.data.data || []);
    } catch { toast.error('Failed'); }
  };

  const sf = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setScheduleForm(p => ({ ...p, [field]: e.target.value }));

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Cohorts</h1><p className="text-sm text-gray-500">{cohorts.length} total cohorts</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openNew}>New Cohort</Button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Course</th><th>Start</th><th>End</th>
                <th>Capacity</th><th>Students</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c: any) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.course?.title}</td>
                  <td className="text-sm">{formatDate(c.startDate)}</td>
                  <td className="text-sm">{formatDate(c.endDate)}</td>
                  <td>{c.capacity || '∞'}</td>
                  <td>{c._count?.enrollments || 0}</td>
                  <td>{getStatusBadge(c.status)}</td>
                  <td>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" icon={<Calendar className="w-3.5 h-3.5 text-blue-500" />} onClick={() => openSchedules(c)} />
                      <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openEdit(c)} />
                      <Button size="sm" variant="ghost" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => setDeleting(c)} />
                    </div>
                  </td>
                </tr>
              ))}
              {cohorts.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-10">No cohorts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cohort Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Cohort' : 'New Cohort'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Course *"
            value={form.courseId}
            onChange={f('courseId')}
            options={courses.map(c => ({ value: c.id, label: `${c.code} — ${c.title}` }))}
          />
          <Input label="Cohort Name *" placeholder="e.g. Web Dev Cohort 1 – Oct 2026" value={form.name} onChange={f('name')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date *" type="date" value={form.startDate} onChange={f('startDate')} />
            <Input label="End Date *" type="date" value={form.endDate} onChange={f('endDate')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Capacity" type="number" placeholder="Leave blank for unlimited" value={form.capacity} onChange={f('capacity')} />
            <Select
              label="Status"
              value={form.status}
              onChange={f('status')}
              options={['UPCOMING','ACTIVE','COMPLETED','CANCELLED'].map(s => ({ value: s, label: s }))}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Cohort */}
      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Cohort"
        message={`Delete cohort "${deleting?.name}"? This cannot be undone.`}
      />

      {/* Class Schedules Modal */}
      <Modal
        isOpen={!!schedulesCohort}
        onClose={() => setSchedulesCohort(null)}
        title={`Class Schedule — ${schedulesCohort?.name}`}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setSchedulesCohort(null)}>Close</Button>}
      >
        {loadingSchedules ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
        ) : (
          <div className="space-y-5">
            {/* Existing schedules */}
            <div className="space-y-2">
              {schedules.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-xl">
                  No schedule entries yet. Add one below.
                </p>
              )}
              {schedules.map(s => (
                <div key={s.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3">
                  <Clock className="w-4 h-4 text-primary-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{DAY_NAMES[s.dayOfWeek]}</p>
                    <p className="text-xs text-gray-400">
                      {s.startTime} – {s.endTime}
                      {s.classroom ? ` · ${s.classroom}` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    icon={<Edit className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setEditingSchedule(s);
                      setScheduleForm({
                        dayOfWeek: String(s.dayOfWeek),
                        startTime: s.startTime,
                        endTime: s.endTime,
                        classroom: s.classroom || '',
                      });
                    }}
                  />
                  <Button
                    size="sm" variant="ghost"
                    icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                    onClick={() => setDeletingSchedule(s)}
                  />
                </div>
              ))}
            </div>

            {/* Add / Edit schedule form */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-semibold">{editingSchedule ? 'Edit Entry' : 'Add Entry'}</h4>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Day *"
                  value={scheduleForm.dayOfWeek}
                  onChange={sf('dayOfWeek')}
                  options={DAY_NAMES.map((d, i) => ({ value: String(i), label: d }))}
                />
                <Input label="Classroom / Room" value={scheduleForm.classroom} onChange={sf('classroom')} placeholder="e.g. Room 3B" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start Time *" type="time" value={scheduleForm.startTime} onChange={sf('startTime')} />
                <Input label="End Time *" type="time" value={scheduleForm.endTime} onChange={sf('endTime')} />
              </div>
              <div className="flex justify-end gap-2">
                {editingSchedule && (
                  <Button variant="secondary" size="sm" onClick={() => { setEditingSchedule(null); setScheduleForm({ dayOfWeek: '1', startTime: '08:00', endTime: '10:00', classroom: '' }); }}>
                    Cancel
                  </Button>
                )}
                <Button size="sm" loading={savingSchedule} icon={<Plus className="w-4 h-4" />} onClick={saveSchedule}>
                  {editingSchedule ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingSchedule}
        onClose={() => setDeletingSchedule(null)}
        onConfirm={deleteSchedule}
        title="Remove Schedule"
        message="Remove this schedule entry?"
      />
    </div>
  );
};
