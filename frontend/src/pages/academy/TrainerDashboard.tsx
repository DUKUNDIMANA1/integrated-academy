import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, Calendar, ClipboardList, Award,
  AlertTriangle, TrendingUp, Clock
} from 'lucide-react';
import { academyApi } from '../../api/academy.api';
import { StatCard } from '../../components/ui/Card';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const TrainerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      academyApi.getCourses({ limit: 50 }),
      academyApi.getCohorts(),
    ]).then(([coursesRes, cohortsRes]) => {
      setCourses(coursesRes.data.data || []);
      setCohorts(cohortsRes.data.data || []);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const activeCohorts = cohorts.filter((c: any) => c.status === 'ACTIVE');
  const upcomingCohorts = cohorts.filter((c: any) => c.status === 'UPCOMING');
  const publishedCourses = courses.filter((c: any) => c.status === 'PUBLISHED');

  return (
    <div className="space-y-6">
      <div>
        <h1>Trainer Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.firstName}. Here's your teaching overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Courses" value={publishedCourses.length}
          icon={<BookOpen className="w-5 h-5 text-primary-600" />} iconBg="bg-primary-100"
          onClick={() => navigate('/academy/courses')} />
        <StatCard title="Active Cohorts" value={activeCohorts.length}
          icon={<Users className="w-5 h-5 text-green-600" />} iconBg="bg-green-100"
          onClick={() => navigate('/academy/cohorts')} />
        <StatCard title="Upcoming Cohorts" value={upcomingCohorts.length}
          icon={<Calendar className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" />
        <StatCard title="Total Cohorts" value={cohorts.length}
          icon={<ClipboardList className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-100" />
      </div>

      {/* Active Cohorts */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">Active Cohorts</h3>
          <button onClick={() => navigate('/academy/cohorts')} className="text-sm text-primary-600 hover:underline">View all</button>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Cohort</th><th>Course</th><th>Students</th><th>Start Date</th><th>End Date</th><th>Status</th></tr></thead>
            <tbody>
              {activeCohorts.map((c: any) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.course?.title}</td>
                  <td>{c._count?.enrollments || 0}</td>
                  <td className="text-sm">{formatDate(c.startDate)}</td>
                  <td className="text-sm">{formatDate(c.endDate)}</td>
                  <td>{getStatusBadge(c.status)}</td>
                </tr>
              ))}
              {activeCohorts.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">No active cohorts</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Courses */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">Course Catalogue</h3>
          <button onClick={() => navigate('/academy/courses')} className="text-sm text-primary-600 hover:underline">Manage courses</button>
        </div>
        <div className="divide-y divide-gray-50">
          {publishedCourses.slice(0, 5).map((c: any) => (
            <div key={c.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-gray-500">{c.code} · {c.type} · {c.durationDays} days</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{c._count?.enrollments || 0} enrolled</span>
                {getStatusBadge(c.status)}
              </div>
            </div>
          ))}
          {publishedCourses.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">No published courses</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Record Attendance', path: '/academy/attendance', icon: <Calendar className="w-5 h-5" /> },
          { label: 'Grade Submissions', path: '/academy/assessments', icon: <Award className="w-5 h-5" /> },
          { label: 'Manage Cohorts', path: '/academy/cohorts', icon: <Users className="w-5 h-5" /> },
          { label: 'Create Course', path: '/academy/courses', icon: <BookOpen className="w-5 h-5" /> },
        ].map(action => (
          <button key={action.path} onClick={() => navigate(action.path)}
            className="card flex flex-col items-center gap-2 py-5 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors cursor-pointer text-center">
            <div className="text-primary-500">{action.icon}</div>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};
