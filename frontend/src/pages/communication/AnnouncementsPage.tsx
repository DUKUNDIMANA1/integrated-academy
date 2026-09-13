import React, { useEffect, useState } from 'react';
import { Plus, Pin, Bell } from 'lucide-react';
import { communicationApi } from '../../api/communication.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import { timeAgo } from '../../utils/formatDate';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

const ANNOUNCEMENT_TYPES = ['GENERAL','COURSE','FINANCE','ACADEMIC','URGENT'];

export const AnnouncementsPage: React.FC = () => {
  const { isAdmin, isAcademy } = usePermissions();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'GENERAL', isPinned: false, expiresAt: '' });

  const load = async () => {
    try { const r = await communicationApi.getAnnouncements(); setAnnouncements(r.data.data || []); }
    catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.content) { toast.error('Title and content required'); return; }
    setSaving(true);
    try {
      await communicationApi.createAnnouncement({ ...form, expiresAt: form.expiresAt || undefined });
      toast.success('Announcement posted');
      setShowModal(false);
      setForm({ title: '', content: '', type: 'GENERAL', isPinned: false, expiresAt: '' });
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const typeColors: Record<string, string> = {
    URGENT: 'border-l-4 border-red-500 bg-red-50',
    FINANCE: 'border-l-4 border-green-500 bg-green-50',
    ACADEMIC: 'border-l-4 border-blue-500 bg-blue-50',
    COURSE: 'border-l-4 border-purple-500 bg-purple-50',
    GENERAL: 'border-l-4 border-gray-300',
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Announcements</h1><p className="text-sm text-gray-500">System-wide communications</p></div>
        {(isAdmin || isAcademy) && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Post Announcement</Button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="card text-center py-16">
          <Bell className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a: any) => (
            <div key={a.id} className={`card ${typeColors[a.type] || typeColors.GENERAL}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.isPinned && <Pin className="w-3.5 h-3.5 text-gray-400" />}
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <span className={`badge text-xs ${a.type === 'URGENT' ? 'badge-red' : a.type === 'FINANCE' ? 'badge-green' : a.type === 'ACADEMIC' ? 'badge-blue' : 'badge-gray'}`}>
                      {a.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{timeAgo(a.publishedAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Announcement" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Post</Button></>}
      >
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Content *" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={4} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              options={ANNOUNCEMENT_TYPES.map(t => ({ value: t, label: t }))} />
            <Input label="Expires At" type="date" value={form.expiresAt}
              onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))} />
            <span className="text-sm">Pin this announcement</span>
          </label>
        </div>
      </Modal>
    </div>
  );
};
