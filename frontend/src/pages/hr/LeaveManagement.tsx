import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Plus } from 'lucide-react';
import { hrApi } from '../../api/hr.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const LeaveManagement: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [processing, setProcessing] = useState<string | null>(null);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await hrApi.getLeaveRequests({ page, limit });
      setLeaves(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleStatus = async (id: string, status: string) => {
    setProcessing(id);
    try {
      await hrApi.updateLeaveStatus(id, status);
      toast.success(`Leave ${status.toLowerCase()}`);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Leave Requests</h1><p className="text-sm text-gray-500">{total} requests</p></div>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {leaves.map((l: any) => (
                  <tr key={l.id}>
                    <td>
                      <p className="font-medium">{l.employee?.user?.firstName} {l.employee?.user?.lastName}</p>
                      <p className="text-xs text-gray-400">{l.employee?.employeeCode}</p>
                    </td>
                    <td><span className="badge badge-blue text-xs">{l.type}</span></td>
                    <td className="text-sm">{formatDate(l.startDate)}</td>
                    <td className="text-sm">{formatDate(l.endDate)}</td>
                    <td className="text-sm text-gray-500 max-w-[150px] truncate">{l.reason || '—'}</td>
                    <td>{getStatusBadge(l.status)}</td>
                    <td>
                      {l.status === 'PENDING' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="success" loading={processing === l.id}
                            icon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleStatus(l.id, 'APPROVED')}>Approve</Button>
                          <Button size="sm" variant="danger" loading={processing === l.id}
                            icon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleStatus(l.id, 'REJECTED')}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-10">No leave requests</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}
    </div>
  );
};
