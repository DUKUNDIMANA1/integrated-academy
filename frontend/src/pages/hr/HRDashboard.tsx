import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Calendar, TrendingUp } from 'lucide-react';
import { hrApi } from '../../api/hr.api';
import { StatCard } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrApi.getSummary().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load HR data')).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div><h1>HR Dashboard</h1><p className="text-sm text-gray-500">Human resources overview</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Employees" value={data.totalEmployees} icon={<Users className="w-6 h-6 text-primary-600" />} iconBg="bg-primary-100" onClick={() => navigate('/hr/employees')} />
        <StatCard title="Departments" value={data.byDepartment?.length || 0} icon={<Building2 className="w-6 h-6 text-green-600" />} iconBg="bg-green-100" onClick={() => navigate('/hr/departments')} />
        <StatCard title="Pending Leaves" value={data.pendingLeaves} icon={<Calendar className="w-6 h-6 text-yellow-600" />} iconBg="bg-yellow-100" onClick={() => navigate('/hr/leave')} />
        <StatCard title="Employment Types" value={data.byEmploymentType?.length || 0} icon={<TrendingUp className="w-6 h-6 text-purple-600" />} iconBg="bg-purple-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Staff by Employment Type</h3>
          <div className="space-y-3">
            {data.byEmploymentType?.map((item: any) => (
              <div key={item.employmentType} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.employmentType?.replace(/_/g, ' ')}</span>
                <span className="font-semibold">{item._count?.id || 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Add Employee', path: '/hr/employees' },
              { label: 'Manage Departments', path: '/hr/departments' },
              { label: 'Review Leave Requests', path: '/hr/leave' },
            ].map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                className="w-full text-left px-4 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
