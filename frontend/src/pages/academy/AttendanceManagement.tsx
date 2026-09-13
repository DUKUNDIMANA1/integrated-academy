import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { academyApi } from '../../api/academy.api';
import { Button } from '../../components/ui/Button';
import { Select, Input } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['PRESENT','ABSENT','LATE','EXCUSED'];
const STATUS_ICONS: Record<string, React.ReactNode> = {
  PRESENT: <CheckCircle className="w-4 h-4 text-green-500" />,
  ABSENT: <XCircle className="w-4 h-4 text-red-500" />,
  LATE: <Clock className="w-4 h-4 text-yellow-500" />,
  EXCUSED: <CheckCircle className="w-4 h-4 text-blue-400" />,
};

export const AttendanceManagement: React.FC = () => {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'record' | 'report'>('record');
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    academyApi.getCohorts().then(r => setCohorts(r.data.data || [])).catch(() => {});
  }, []);

  const loadAttendance = async () => {
    if (!selectedCohort) { toast.error('Select a cohort first'); return; }
    setLoading(true);
    try {
      const r = await academyApi.getAttendance({ cohortId: selectedCohort, date: selectedDate });
      setAttendance(r.data.data || []);
      // Pre-populate statuses from existing records
      const existing: Record<string, string> = {};
      (r.data.data || []).forEach((a: any) => { existing[a.studentId] = a.status; });
      setStatuses(existing);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  const loadReport = async () => {
    if (!selectedCohort) { toast.error('Select a cohort first'); return; }
    setLoading(true);
    try {
      const r = await academyApi.getAttendanceReport(selectedCohort);
      setReport(r.data.data || []);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const saveAttendance = async () => {
    if (!selectedCohort || attendance.length === 0) { toast.error('Load attendance first'); return; }
    setSaving(true);
    try {
      const records = attendance.map((a: any) => ({
        enrollmentId: a.enrollmentId,
        studentId: a.studentId,
        cohortId: selectedCohort,
        date: new Date(selectedDate),
        status: statuses[a.studentId] || 'PRESENT',
      }));
      await academyApi.recordAttendance(records);
      toast.success(`Attendance saved for ${records.length} students`);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const cohortOptions = cohorts.map(c => ({ value: c.id, label: `${c.name} — ${c.course?.title || ''}` }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Attendance</h1><p className="text-sm text-gray-500">Record and view class attendance</p></div>
      </div>

      {/* Controls */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Select placeholder="Select cohort..." value={selectedCohort}
            onChange={e => setSelectedCohort(e.target.value)}
            options={cohortOptions} className="flex-1 min-w-[220px]" />
          <Input type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} className="w-44" />
          <div className="flex gap-2">
            <Button variant={view === 'record' ? 'primary' : 'secondary'} size="sm"
              onClick={() => { setView('record'); loadAttendance(); }}>Take Attendance</Button>
            <Button variant={view === 'report' ? 'primary' : 'secondary'} size="sm"
              onClick={() => { setView('report'); loadReport(); }}>View Report</Button>
          </div>
        </div>
      </div>

      {loading ? <PageSpinner /> : (
        <>
          {/* Record Attendance */}
          {view === 'record' && (
            <div className="card p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold">Attendance — {formatDate(selectedDate)}</h3>
                {attendance.length > 0 && (
                  <Button size="sm" variant="success" loading={saving} onClick={saveAttendance}>
                    Save All
                  </Button>
                )}
              </div>
              {attendance.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Select a cohort and click "Take Attendance" to begin</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {attendance.map((a: any) => (
                    <div key={a.studentId} className="px-6 py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
                          {a.student?.user?.firstName?.[0]}{a.student?.user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{a.student?.user?.firstName} {a.student?.user?.lastName}</p>
                          <p className="text-xs text-gray-400">{a.student?.studentCode}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map(s => (
                          <button key={s} onClick={() => setStatuses(p => ({ ...p, [a.studentId]: s }))}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                              statuses[a.studentId] === s || (!statuses[a.studentId] && s === 'PRESENT')
                                ? s === 'PRESENT' ? 'bg-green-100 border-green-400 text-green-700'
                                  : s === 'ABSENT' ? 'bg-red-100 border-red-400 text-red-700'
                                  : s === 'LATE' ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                                  : 'bg-blue-100 border-blue-400 text-blue-700'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                            }`}>
                            {STATUS_ICONS[s]} {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attendance Report */}
          {view === 'report' && (
            <div className="card p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold">Attendance Report</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Excused</th><th>Total</th><th>Rate</th></tr>
                  </thead>
                  <tbody>
                    {report.map((r: any) => (
                      <tr key={r.studentId}>
                        <td className="font-medium">{r.studentId?.substring(0, 8)}…</td>
                        <td className="text-green-600 font-medium">{r.present}</td>
                        <td className="text-red-600">{r.absent}</td>
                        <td className="text-yellow-600">{r.late}</td>
                        <td className="text-blue-600">{r.excused}</td>
                        <td>{r.total}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                              <div className={`h-full rounded-full ${r.attendanceRate >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${r.attendanceRate}%` }} />
                            </div>
                            <span className={`text-sm font-semibold ${r.attendanceRate >= 70 ? 'text-green-700' : 'text-red-700'}`}>
                              {r.attendanceRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {report.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-8">No attendance data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
