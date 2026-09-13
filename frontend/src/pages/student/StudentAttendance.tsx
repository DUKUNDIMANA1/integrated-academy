import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const StudentAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getAttendance()
      .then(r => setAttendance(r.data.data || []))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const present = attendance.filter(a => a.status === 'PRESENT').length;
  const absent = attendance.filter(a => a.status === 'ABSENT').length;
  const late = attendance.filter(a => a.status === 'LATE').length;
  const excused = attendance.filter(a => a.status === 'EXCUSED').length;
  const total = attendance.length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div><h1>My Attendance</h1><p className="text-sm text-gray-500">Your class attendance record</p></div>

      {total > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Attendance Rate', value: `${rate}%`, color: rate >= 70 ? 'text-green-700' : 'text-red-700', bg: rate >= 70 ? 'bg-green-50' : 'bg-red-50' },
              { label: 'Present', value: present, color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Absent', value: absent, color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'Late', value: late, color: 'text-yellow-700', bg: 'bg-yellow-50' },
              { label: 'Excused', value: excused, color: 'text-blue-700', bg: 'bg-blue-50' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-4 text-center ${item.bg}`}>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="card">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Overall Attendance</span>
              <span className={`font-bold ${rate >= 70 ? 'text-green-600' : 'text-red-600'}`}>{rate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${rate >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${rate}%` }} />
            </div>
            {rate < 70 && (
              <p className="text-xs text-red-600 mt-2">⚠ Your attendance is below the required 70% minimum.</p>
            )}
          </div>
        </>
      )}

      {/* Attendance Records */}
      {attendance.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="w-14 h-14 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No attendance records yet</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>Cohort</th><th>Status</th><th>Notes</th></tr></thead>
              <tbody>
                {attendance.map((a: any) => (
                  <tr key={a.id}>
                    <td className="font-medium">{formatDate(a.date)}</td>
                    <td>{a.cohort?.name || '—'}</td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td className="text-sm text-gray-500">{a.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
