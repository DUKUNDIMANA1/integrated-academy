import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, AlertTriangle, CreditCard, Bell, CheckCircle, Lock, TrendingUp, Clock } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getDashboard().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (!data) return null;

  const { enrollments = [], lockedEnrollments = [], outstandingInvoices = [], recentNotifications = [], pendingApplications = 0 } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {data.student?.user?.firstName || 'Student'} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's an overview of your learning journey.</p>
      </div>

      {/* Locked course alert */}
      {lockedEnrollments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Course Access Locked</h3>
              <p className="text-sm text-red-700 mt-1">
                {lockedEnrollments.length} course{lockedEnrollments.length > 1 ? 's' : ''} locked due to unpaid balance.
                Pay now to restore access immediately.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {outstandingInvoices.map((inv: any) => (
                  <Button key={inv.id} size="sm" variant="danger"
                    icon={<CreditCard className="w-3.5 h-3.5" />}
                    onClick={() => navigate(`/student/invoices`)}>
                    Pay {formatCurrency(inv.outstandingBalance)} — Outstanding
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Courses"
          value={enrollments.filter((e: any) => e.accessStatus === 'ACTIVE').length}
          icon={<BookOpen className="w-6 h-6 text-primary-600" />}
          iconBg="bg-primary-100"
          onClick={() => navigate('/student/courses')}
        />
        <StatCard
          title="Pending Applications"
          value={pendingApplications}
          icon={<Clock className="w-6 h-6 text-yellow-600" />}
          iconBg="bg-yellow-100"
          onClick={() => navigate('/student/applications')}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(outstandingInvoices.reduce((s: number, i: any) => s + Number(i.outstandingBalance), 0))}
          icon={<CreditCard className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100"
          onClick={() => navigate('/student/invoices')}
        />
        <StatCard
          title="Unread Notifications"
          value={data.unreadNotifications || 0}
          icon={<Bell className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">My Courses</h3>
            <Button size="sm" variant="ghost" onClick={() => navigate('/student/courses')}>View all</Button>
          </div>
          <div className="divide-y divide-gray-50">
            {enrollments.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No enrollments yet. <span className="text-primary-600 cursor-pointer" onClick={() => navigate('/student/applications/new')}>Apply for a course</span></p>
              </div>
            ) : (
              enrollments.slice(0, 5).map((e: any) => (
                <div key={e.id} className="px-6 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${e.accessStatus === 'LOCKED' ? 'bg-red-100' : 'bg-primary-100'}`}>
                      {e.accessStatus === 'LOCKED' ? <Lock className="w-4 h-4 text-red-600" /> : <BookOpen className="w-4 h-4 text-primary-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.course?.title}</p>
                      <p className="text-xs text-gray-500">{e.course?.type} · {Number(e.progressPercent || 0).toFixed(0)}% complete</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(e.accessStatus)}
                    {e.accessStatus === 'LOCKED' && (
                      <Button size="sm" variant="danger" onClick={() => navigate('/student/invoices')}>Pay</Button>
                    )}
                    {e.accessStatus === 'ACTIVE' && (
                      <Button size="sm" onClick={() => navigate(`/student/courses/${e.courseId}/learn`)}>Continue</Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Notifications</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentNotifications.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              recentNotifications.map((n: any) => (
                <div key={n.id} className="px-6 py-3">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
