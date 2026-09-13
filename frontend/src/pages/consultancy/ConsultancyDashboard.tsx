import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, FileText, TrendingUp } from 'lucide-react';
import { consultancyApi } from '../../api/consultancy.api';
import { StatCard } from '../../components/ui/Card';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const ConsultancyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      consultancyApi.getLeads({ limit: 5 }),
      consultancyApi.getClients({ limit: 5 }),
      consultancyApi.getProjects({ limit: 5 }),
    ]).then(([leads, clients, projects]) => {
      setStats({
        totalLeads: leads.data.meta?.total || 0,
        totalClients: clients.data.meta?.total || 0,
        totalProjects: projects.data.meta?.total || 0,
        activeProjects: (projects.data.data || []).filter((p: any) => p.status === 'ACTIVE').length,
      });
      setRecentProjects(projects.data.data || []);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div><h1>Consultancy Dashboard</h1><p className="text-sm text-gray-500">Pipeline and project overview</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={stats.totalLeads} icon={<TrendingUp className="w-6 h-6 text-primary-600" />} iconBg="bg-primary-100" onClick={() => navigate('/consultancy/leads')} />
        <StatCard title="Clients" value={stats.totalClients} icon={<Users className="w-6 h-6 text-green-600" />} iconBg="bg-green-100" onClick={() => navigate('/consultancy/clients')} />
        <StatCard title="Total Projects" value={stats.totalProjects} icon={<Briefcase className="w-6 h-6 text-blue-600" />} iconBg="bg-blue-100" onClick={() => navigate('/consultancy/projects')} />
        <StatCard title="Active Projects" value={stats.activeProjects} icon={<FileText className="w-6 h-6 text-orange-600" />} iconBg="bg-orange-100" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">Recent Projects</h3>
          <button onClick={() => navigate('/consultancy/projects')} className="text-sm text-primary-600 hover:underline">View all</button>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Project</th><th>Client</th><th>Start Date</th><th>Status</th></tr></thead>
            <tbody>
              {recentProjects.map((p: any) => (
                <tr key={p.id} className="cursor-pointer" onClick={() => navigate(`/consultancy/projects/${p.id}`)}>
                  <td><p className="font-medium">{p.title}</p></td>
                  <td>{p.client?.name}</td>
                  <td className="text-xs text-gray-400">{formatDate(p.startDate)}</td>
                  <td>{getStatusBadge(p.status)}</td>
                </tr>
              ))}
              {recentProjects.length === 0 && <tr><td colSpan={4} className="text-center text-gray-400 py-8">No projects yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
