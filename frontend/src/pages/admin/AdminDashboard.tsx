import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, DollarSign, ClipboardList, TrendingUp, Lock, AlertCircle } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { StatCard } from '../../components/ui/Card';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (!data) return null;

  const { stats, recentApplications } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1>Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">System overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} icon={<Users className="w-6 h-6 text-blue-600" />} iconBg="bg-blue-100" onClick={() => navigate('/admin/users')} />
        <StatCard title="Published Courses" value={stats.totalCourses} icon={<BookOpen className="w-6 h-6 text-green-600" />} iconBg="bg-green-100" onClick={() => navigate('/academy/courses')} />
        <StatCard title="Pending Applications" value={stats.pendingApplications} icon={<ClipboardList className="w-6 h-6 text-yellow-600" />} iconBg="bg-yellow-100" onClick={() => navigate('/admin/applications')} />
        <StatCard title="Active Enrollments" value={stats.activeEnrollments} icon={<TrendingUp className="w-6 h-6 text-primary-600" />} iconBg="bg-primary-100" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Monthly Income" value={formatCurrency(stats.monthlyIncome)} icon={<DollarSign className="w-6 h-6 text-green-600" />} iconBg="bg-green-100" onClick={() => navigate('/finance/income')} />
        <StatCard title="Monthly Expenses" value={formatCurrency(stats.monthlyExpense)} icon={<DollarSign className="w-6 h-6 text-red-600" />} iconBg="bg-red-100" onClick={() => navigate('/finance/expenses')} />
        <StatCard title="Outstanding Balance" value={formatCurrency(stats.outstandingBalance)} icon={<AlertCircle className="w-6 h-6 text-orange-600" />} iconBg="bg-orange-100" onClick={() => navigate('/finance/invoices')} />
      </div>

      {stats.lockedEnrollments > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">{stats.lockedEnrollments} Locked Enrollment{stats.lockedEnrollments > 1 ? 's' : ''}</p>
              <p className="text-sm text-red-700">Students with access locked due to unpaid balances</p>
            </div>
          </div>
          <Button size="sm" variant="danger" onClick={() => navigate('/finance/invoices?status=OVERDUE')}>View</Button>
        </div>
      )}

      {/* Recent Applications */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold">Recent Applications</h3>
          <Button size="sm" variant="ghost" onClick={() => navigate('/admin/applications')}>View all</Button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((app: any) => (
                <tr key={app.id}>
                  <td>
                    <p className="font-medium">{app.student?.user?.firstName} {app.student?.user?.lastName}</p>
                    <p className="text-xs text-gray-400">{app.student?.user?.email}</p>
                  </td>
                  <td>{app.course?.title}</td>
                  <td>{getStatusBadge(app.status)}</td>
                  <td className="text-gray-400 text-xs">{formatDate(app.createdAt)}</td>
                  <td>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/applications/${app.id}`)}>View</Button>
                  </td>
                </tr>
              ))}
              {recentApplications.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">No applications yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
