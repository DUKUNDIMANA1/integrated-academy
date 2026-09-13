import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate, timeAgo } from '../../utils/formatDate';
import { SupportTicket } from '../../types';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [replying, setReplying] = useState(false);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/support/tickets', { params: { page, limit } });
      setTickets(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const openTicket = async (id: string) => {
    const r = await api.get(`/support/tickets/${id}`);
    setSelected(r.data.data);
  };

  const handleReply = async () => {
    if (!replyMsg.trim() || !selected) return;
    setReplying(true);
    try {
      await api.post(`/support/tickets/${selected.id}/respond`, { message: replyMsg });
      toast.success('Reply sent');
      setReplyMsg('');
      await openTicket(selected.id);
    } catch { toast.error('Failed'); }
    finally { setReplying(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/support/tickets/${id}/status`, { status });
    toast.success('Status updated');
    setSelected(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Support Tickets</h1><p className="text-sm text-gray-500">{total} tickets</p></div>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Ticket #</th><th>Subject</th><th>Student</th><th>Category</th><th>Priority</th><th>Status</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td className="font-mono text-xs">{t.ticketNumber}</td>
                    <td><p className="font-medium">{t.subject}</p></td>
                    <td>{t.student?.user ? `${t.student.user.firstName} ${t.student.user.lastName}` : '—'}</td>
                    <td><span className="text-xs">{t.category}</span></td>
                    <td>
                      <span className={`badge ${t.priority === 'HIGH' || t.priority === 'URGENT' ? 'badge-red' : t.priority === 'MEDIUM' ? 'badge-yellow' : 'badge-gray'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td className="text-xs text-gray-400">{timeAgo(t.createdAt)}</td>
                    <td><Button size="sm" variant="ghost" icon={<MessageSquare className="w-3.5 h-3.5" />} onClick={() => openTicket(t.id)}>Open</Button></td>
                  </tr>
                ))}
                {tickets.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-10">No tickets</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Ticket #${selected?.ticketNumber}`} size="lg"
        footer={
          <div className="flex gap-2 w-full">
            {selected?.status === 'OPEN' || selected?.status === 'IN_PROGRESS' ? (
              <Button size="sm" variant="success" onClick={() => selected && updateStatus(selected.id, 'RESOLVED')}>Mark Resolved</Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Close</Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400">Category</p><p>{selected.category}</p></div>
              <div><p className="text-gray-400">Priority</p><p>{selected.priority}</p></div>
              <div><p className="text-gray-400">Status</p>{getStatusBadge(selected.status)}</div>
              <div><p className="text-gray-400">Created</p><p>{formatDate(selected.createdAt)}</p></div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm">{selected.description}</p>
            </div>
            {/* Conversation */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selected.responses.map(r => (
                <div key={r.id} className={`p-3 rounded-lg text-sm ${r.isInternal ? 'bg-yellow-50 border border-yellow-100' : 'bg-blue-50'}`}>
                  <p className="text-xs text-gray-400 mb-1">{r.isInternal ? 'Internal note' : 'Reply'} · {timeAgo(r.createdAt)}</p>
                  <p>{r.message}</p>
                </div>
              ))}
            </div>
            {/* Reply box */}
            <div className="flex gap-2">
              <Textarea placeholder="Type a reply..." value={replyMsg} onChange={e => setReplyMsg(e.target.value)} rows={2} className="flex-1" />
              <Button loading={replying} onClick={handleReply} className="self-end">Send</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
