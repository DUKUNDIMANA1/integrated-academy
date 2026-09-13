import React, { useEffect, useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const CATEGORIES = ['TECHNICAL','PAYMENT','COURSE','ADMISSION','CERTIFICATE','OTHER'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];

export const StudentSupport: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'TECHNICAL', priority: 'MEDIUM' });

  const load = () =>
    studentApi.getTickets()
      .then(r => setTickets(r.data.data || []))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.subject || !form.description) { toast.error('Subject and description required'); return; }
    setSaving(true);
    try {
      await studentApi.createTicket(form);
      toast.success('Support ticket created');
      setShowModal(false);
      setForm({ subject: '', description: '', category: 'TECHNICAL', priority: 'MEDIUM' });
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Support</h1><p className="text-sm text-gray-500">Get help with any issues</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Ticket</Button>
      </div>

      {tickets.length === 0 ? (
        <div className="card text-center py-16">
          <MessageSquare className="w-14 h-14 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No support tickets</p>
          <p className="text-sm text-gray-400 mt-1">Submit a ticket if you need help</p>
          <Button className="mt-4" onClick={() => setShowModal(true)}>Create Ticket</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t: any) => (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold">{t.subject}</p>
                    {getStatusBadge(t.status)}
                    <span className={`badge text-xs ${t.priority === 'URGENT' || t.priority === 'HIGH' ? 'badge-red' : t.priority === 'MEDIUM' ? 'badge-yellow' : 'badge-gray'}`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{t.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>#{t.ticketNumber}</span>
                    <span>{t.category}</span>
                    <span>{timeAgo(t.createdAt)}</span>
                  </div>
                  {/* Responses */}
                  {t.responses?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {t.responses.filter((r: any) => !r.isInternal).map((r: any) => (
                        <div key={r.id} className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 font-medium mb-1">Support Response · {timeAgo(r.createdAt)}</p>
                          <p className="text-sm text-gray-700">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Support Ticket" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit}>Submit</Button></>}
      >
        <div className="space-y-4">
          <Input label="Subject *" placeholder="Brief description of your issue" value={form.subject} onChange={f('subject')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={f('category')}
              options={CATEGORIES.map(c => ({ value: c, label: c.replace(/_/g, ' ') }))} />
            <Select label="Priority" value={form.priority} onChange={f('priority')}
              options={PRIORITIES.map(p => ({ value: p, label: p }))} />
          </div>
          <Textarea label="Description *" placeholder="Describe your issue in detail..." value={form.description} onChange={f('description')} rows={4} />
        </div>
      </Modal>
    </div>
  );
};
