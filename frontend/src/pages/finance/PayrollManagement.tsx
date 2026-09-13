import React, { useEffect, useState } from 'react';
import { Plus, Play, CheckCircle, Users } from 'lucide-react';
import { payrollApi } from '../../api/payroll.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const PayrollManagement: React.FC = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showPayslips, setShowPayslips] = useState<string | null>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', payDate: '' });
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const [periodsRes, summaryRes] = await Promise.all([
        payrollApi.getPeriods({ page, limit }),
        payrollApi.getSummary(),
      ]);
      setPeriods(periodsRes.data.data || []);
      setTotal(periodsRes.data.meta?.total || 0);
      setSummary(summaryRes.data.data);
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await payrollApi.createPeriod({ ...form, payDate: form.payDate || undefined });
      toast.success('Payroll period created');
      setShowModal(false);
      setForm({ name: '', startDate: '', endDate: '', payDate: '' });
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleProcess = async (id: string) => {
    setProcessing(id);
    try {
      const r = await payrollApi.process(id);
      toast.success(`Payroll processed: ${r.data.data?.processed} payslips`);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  const handleApprove = async (id: string) => {
    try { await payrollApi.approve(id); toast.success('Payroll approved'); await load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const openPayslips = async (id: string) => {
    const r = await payrollApi.getPayslips(id);
    setPayslips(r.data.data || []);
    setShowPayslips(id);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Payroll</h1><p className="text-sm text-gray-500">Employee salary management</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Period</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Active Employees" value={summary.totalEmployees}
            icon={<Users className="w-5 h-5 text-primary-600" />} iconBg="bg-primary-100" />
          <StatCard title="Last Payroll Total" value={formatCurrency(summary.lastPayrollTotal)}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />} iconBg="bg-green-100" />
          <StatCard title="Last Period" value={summary.lastPeriod?.name || 'None'}
            subtitle={summary.lastPeriod ? getStatusBadge(summary.lastPeriod.status).props.children : ''}
            icon={<Play className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" />
        </div>
      )}

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th>Period</th><th>Start</th><th>End</th><th>Pay Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {periods.map((p: any) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.name}</td>
                    <td className="text-sm">{formatDate(p.startDate)}</td>
                    <td className="text-sm">{formatDate(p.endDate)}</td>
                    <td className="text-sm">{p.payDate ? formatDate(p.payDate) : '—'}</td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openPayslips(p.id)}>Payslips ({p._count?.payslips || 0})</Button>
                        {p.status === 'DRAFT' && (
                          <Button size="sm" variant="primary" loading={processing === p.id}
                            icon={<Play className="w-3.5 h-3.5" />}
                            onClick={() => handleProcess(p.id)}>Process</Button>
                        )}
                        {p.status === 'PROCESSING' && (
                          <Button size="sm" variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleApprove(p.id)}>Approve</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {periods.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-10">No payroll periods</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      {/* Create Period Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Payroll Period" size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleCreate}>Create</Button></>}
      >
        <div className="space-y-4">
          <Input label="Period Name *" placeholder="e.g. September 2026" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date *" type="date" value={form.startDate}
              onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            <Input label="End Date *" type="date" value={form.endDate}
              onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
          </div>
          <Input label="Pay Date" type="date" value={form.payDate}
            onChange={e => setForm(p => ({ ...p, payDate: e.target.value }))} />
        </div>
      </Modal>

      {/* Payslips Modal */}
      <Modal isOpen={!!showPayslips} onClose={() => setShowPayslips(null)} title="Payslips" size="xl">
        <div className="table-container">
          <table>
            <thead><tr><th>Employee</th><th>Basic</th><th>Gross</th><th>Tax</th><th>Pension</th><th>Net Salary</th><th>Status</th></tr></thead>
            <tbody>
              {payslips.map((ps: any) => (
                <tr key={ps.id}>
                  <td>{ps.employeeId?.substring(0, 8)}…</td>
                  <td>{formatCurrency(ps.basicSalary)}</td>
                  <td>{formatCurrency(ps.grossSalary)}</td>
                  <td className="text-red-600">-{formatCurrency(ps.taxDeduction)}</td>
                  <td className="text-red-600">-{formatCurrency(ps.pensionDeduction)}</td>
                  <td className="font-bold text-green-700">{formatCurrency(ps.netSalary)}</td>
                  <td>{getStatusBadge(ps.status)}</td>
                </tr>
              ))}
              {payslips.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-6">No payslips yet — process payroll first</td></tr>}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};
