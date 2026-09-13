import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDateTime } from '../../utils/formatDate';
import { AuditLog } from '../../types';
import toast from 'react-hot-toast';

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.getAuditLogs({ page, limit });
      setLogs(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  return (
    <div className="space-y-6">
      <div><h1>Audit Log</h1><p className="text-sm text-gray-500">All system actions and changes</p></div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td>
                      {log.user ? (
                        <p className="text-sm">{log.user.firstName} {log.user.lastName}</p>
                      ) : <span className="text-gray-400">System</span>}
                    </td>
                    <td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{log.action}</span></td>
                    <td><span className="text-xs font-medium">{log.entity}</span></td>
                    <td className="font-mono text-xs text-gray-400">{log.entityId?.substring(0, 8)}...</td>
                    <td className="text-xs text-gray-400">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-10">No logs found</td></tr>}
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
