import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, Search, Filter } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Application } from '../../types';
import toast from 'react-hot-toast';

export const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Application | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.getApplications({ page, limit, search: search || undefined, status: statusFilter || undefined });
      setApplications(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  const handleConfirm = async (id: string) => {
    setProcessing(true);
    try {
      await adminApi.confirmApplication(id);
      toast.success('Application confirmed and invoice generated!');
      await load();
      setShowDetail(false);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to confirm'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    if (!selected) return;
    setProcessing(true);
    try {
      await adminApi.rejectApplication(selected.id, rejectReason);
      toast.success('Application rejected');
      setShowReject(false);
      setRejectReason('');
      await load();
      setShowDetail(false);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to reject'); }
    finally { setProcessing(false); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Applications</h1><p className="text-sm text-gray-500">Manage student course applications</p></div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
          </div>
          <Select
            placeholder="All Statuses"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            options={['PENDING','CONFIRMED','REJECTED','ENROLLED','FULLY_PAID','PARTIALLY_PAID'].map(s => ({ value: s, label: s.replace('_',' ') }))}
            className="w-48"
          />
          <Button type="submit" icon={<Search className="w-4 h-4" />}>Search</Button>
        </form>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th><th>Course</th><th>Status</th><th>Applied</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <p className="font-medium">{app.student?.user?.firstName} {app.student?.user?.lastName}</p>
                      <p className="text-xs text-gray-400">{app.student?.user?.email}</p>
                    </td>
                    <td>
                      <p className="font-medium">{app.course?.title}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(app.course?.fee, app.course?.currency)}</p>
                    </td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td className="text-xs text-gray-400">{formatDate(app.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => { setSelected(app); setShowDetail(true); }}>View</Button>
                        {app.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}
                              loading={processing} onClick={() => handleConfirm(app.id)}>Confirm</Button>
                            <Button size="sm" variant="danger" icon={<XCircle className="w-3.5 h-3.5" />}
                              onClick={() => { setSelected(app); setShowReject(true); }}>Reject</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-10">No applications found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Application Details" size="lg"
        footer={
          selected?.status === 'PENDING' ? (
            <>
              <Button variant="secondary" onClick={() => setShowDetail(false)}>Close</Button>
              <Button variant="danger" onClick={() => { setShowReject(true); }}>Reject</Button>
              <Button variant="success" loading={processing} onClick={() => selected && handleConfirm(selected.id)}>Confirm & Generate Invoice</Button>
            </>
          ) : <Button variant="secondary" onClick={() => setShowDetail(false)}>Close</Button>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400">Student</p><p className="font-medium">{selected.student?.user?.firstName} {selected.student?.user?.lastName}</p></div>
              <div><p className="text-gray-400">Email</p><p className="font-medium">{selected.student?.user?.email}</p></div>
              <div><p className="text-gray-400">Course</p><p className="font-medium">{selected.course?.title}</p></div>
              <div><p className="text-gray-400">Fee</p><p className="font-medium">{formatCurrency(selected.course?.fee, selected.course?.currency)}</p></div>
              <div><p className="text-gray-400">Status</p>{getStatusBadge(selected.status)}</div>
              <div><p className="text-gray-400">Applied</p><p className="font-medium">{formatDate(selected.createdAt)}</p></div>
            </div>
            {selected.motivation && <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Motivation</p><p className="text-sm">{selected.motivation}</p></div>}
            {selected.educationBackground && <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Education</p><p className="text-sm">{selected.educationBackground}</p></div>}
            {selected.rejectionReason && <div className="p-3 bg-red-50 rounded-lg border border-red-100"><p className="text-xs text-red-500 mb-1">Rejection Reason</p><p className="text-sm text-red-700">{selected.rejectionReason}</p></div>}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showReject} onClose={() => { setShowReject(false); setRejectReason(''); }} title="Reject Application" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReject(false)}>Cancel</Button>
            <Button variant="danger" loading={processing} onClick={handleReject}>Reject Application</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Please provide a reason for rejecting this application. The student will be notified.</p>
          <Textarea label="Rejection Reason *" placeholder="e.g. Prerequisites not met..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
        </div>
      </Modal>
    </div>
  );
};
