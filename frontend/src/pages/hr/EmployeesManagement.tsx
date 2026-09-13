import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Eye, Filter } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { hrApi } from '../../api/hr.api';
import { Button } from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const EMPLOYEE_ROLES = [
  'ACADEMY_MANAGER','ELEARNING_MANAGER','FINANCE_OFFICER','INSTRUCTOR',
  'CONSULTANT','HR_OFFICER','SALES_ADMISSIONS','SUPPORT_OFFICER','GENERAL_MANAGER','AUDITOR',
];
const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT',  label: 'Contract' },
  { value: 'INTERN',    label: 'Intern' },
];
const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'TERMINATED', label: 'Terminated' },
];

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  password: 'Employee@1234', role: 'INSTRUCTOR',
  departmentId: '', position: '', employmentType: 'FULL_TIME',
  salary: '', hireDate: '', notes: '',
};

export const EmployeesManagement: React.FC = () => {
  const { user: me } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = ['SUPER_ADMIN', 'GENERAL_MANAGER'].includes(me?.role || '');

  const [employees,   setEmployees]   = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('');
  const limit = 20;

  // Create / Edit modal
  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState<any>(null);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState({ ...emptyForm });

  // Detail drawer
  const [viewEmp,     setViewEmp]     = useState<any>(null);
  const [loadingView, setLoadingView] = useState(false);

  // Confirm dialogs
  const [deletingEmp, setDeletingEmp] = useState<any>(null);
  const [togglingEmp, setTogglingEmp] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        hrApi.getEmployees({ page, limit, search: search || undefined, status: statusFilter || undefined }),
        hrApi.getDepartments(),
      ]);
      setEmployees(empRes.data.data || []);
      setTotal(empRes.data.meta?.total || 0);
      setDepartments(deptRes.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (emp: any) => {
    setEditing(emp);
    setForm({
      firstName: emp.user?.firstName || '',
      lastName:  emp.user?.lastName  || '',
      email:     emp.user?.email     || '',
      phone:     emp.user?.phone     || '',
      password:  '',
      role:      emp.user?.role      || 'INSTRUCTOR',
      departmentId:   emp.departmentId   || '',
      position:       emp.position        || '',
      employmentType: emp.employmentType  || 'FULL_TIME',
      salary:         emp.salary ? String(emp.salary) : '',
      hireDate:       emp.hireDate ? emp.hireDate.split('T')[0] : '',
      notes:          '',
    });
    setShowModal(true);
  };

  const openView = async (emp: any) => {
    setLoadingView(true);
    setViewEmp(emp);
    try {
      const r = await hrApi.getEmployee(emp.id);
      setViewEmp(r.data.data);
    } catch { toast.error('Failed to load details'); }
    finally { setLoadingView(false); }
  };

  const handleSave = async () => {
    if (!form.firstName || !form.email) { toast.error('First name and email are required'); return; }
    if (!editing && !form.hireDate) { toast.error('Hire date is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        // Update employee fields
        await hrApi.updateEmployee(editing.id, {
          departmentId:   form.departmentId   || undefined,
          position:       form.position        || undefined,
          employmentType: form.employmentType,
          salary:         form.salary ? parseFloat(form.salary) : undefined,
        });
        toast.success('Employee updated');
      } else {
        await hrApi.createEmployee({
          ...form,
          salary:   form.salary   ? parseFloat(form.salary)  : undefined,
          hireDate: form.hireDate ? new Date(form.hireDate)  : undefined,
        });
        toast.success('Employee created');
      }
      setShowModal(false);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async () => {
    if (!togglingEmp) return;
    try {
      const isActive = togglingEmp.status === 'INACTIVE';
      await hrApi.toggleEmployeeActive(togglingEmp.id, isActive);
      toast.success(isActive ? 'Employee activated' : 'Employee deactivated');
      setTogglingEmp(null);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deletingEmp) return;
    try {
      await hrApi.deleteEmployee(deletingEmp.id);
      toast.success('Employee deleted');
      setDeletingEmp(null);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const statusBadge = (status: string) => {
    if (status === 'ACTIVE')      return <Badge variant="green">Active</Badge>;
    if (status === 'INACTIVE')    return <Badge variant="yellow">Inactive</Badge>;
    if (status === 'TERMINATED')  return <Badge variant="red">Terminated</Badge>;
    return <Badge variant="gray">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="text-sm text-gray-500">{total} total employees</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openNew}>Add Employee</Button>
      </div>

      {/* Search & Filter */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            options={STATUSES}
          />
          <Button type="submit" icon={<Filter className="w-4 h-4" />}>Search</Button>
        </form>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Type</th>
                  <th>Salary</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className={emp.status !== 'ACTIVE' ? 'opacity-60' : ''}>
                    <td>
                      <p className="font-medium">{emp.user?.firstName} {emp.user?.lastName}</p>
                      <p className="text-xs text-gray-400">{emp.user?.email}</p>
                    </td>
                    <td className="font-mono text-xs">{emp.employeeCode}</td>
                    <td className="text-sm">{emp.department?.name || '—'}</td>
                    <td className="text-sm">{emp.position || '—'}</td>
                    <td>
                      <span className="badge badge-blue text-xs">
                        {emp.employmentType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-sm">{emp.salary ? formatCurrency(emp.salary) : '—'}</td>
                    <td className="text-xs text-gray-400">{formatDate(emp.hireDate)}</td>
                    <td>{statusBadge(emp.status)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {/* View details */}
                        <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5 text-blue-500" />} onClick={() => openView(emp)} />
                        {/* Edit */}
                        <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openEdit(emp)} />
                        {/* Toggle active */}
                        <Button
                          size="sm" variant="ghost"
                          icon={emp.status === 'ACTIVE'
                            ? <UserX className="w-3.5 h-3.5 text-amber-500" />
                            : <UserCheck className="w-3.5 h-3.5 text-green-500" />}
                          onClick={() => setTogglingEmp(emp)}
                          title={emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        />
                        {/* Delete — super admin only */}
                        {isSuperAdmin && (
                          <Button
                            size="sm" variant="ghost"
                            icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                            onClick={() => setDeletingEmp(emp)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-gray-400 py-12">No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? `Edit — ${editing.user?.firstName} ${editing.user?.lastName}` : 'Add Employee'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Save Changes' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {!editing && (
            <>
              <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                A system account will be created for this employee.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name *" value={form.firstName} onChange={f('firstName')} />
                <Input label="Last Name"    value={form.lastName}  onChange={f('lastName')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Email *"  type="email" value={form.email} onChange={f('email')} />
                <PhoneInput label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="System Role *" value={form.role} onChange={f('role')}
                  options={EMPLOYEE_ROLES.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))} />
                <Input label="Temp Password *" type="password" value={form.password} onChange={f('password')} />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department"
              value={form.departmentId}
              onChange={f('departmentId')}
              options={[{ value: '', label: 'No department' }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
            />
            <Input label="Position / Job Title" value={form.position} onChange={f('position')} placeholder="e.g. Senior Instructor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Employment Type" value={form.employmentType} onChange={f('employmentType')} options={EMPLOYMENT_TYPES} />
            <Input label="Salary (RWF)" type="number" value={form.salary} onChange={f('salary')} />
          </div>
          {!editing && (
            <Input label="Hire Date *" type="date" value={form.hireDate} onChange={f('hireDate')} />
          )}
        </div>
      </Modal>

      {/* Employee Detail Modal */}
      <Modal
        isOpen={!!viewEmp}
        onClose={() => setViewEmp(null)}
        title={viewEmp ? `${viewEmp.user?.firstName} ${viewEmp.user?.lastName}` : ''}
        size="md"
        footer={<Button variant="secondary" onClick={() => setViewEmp(null)}>Close</Button>}
      >
        {loadingView ? <PageSpinner /> : viewEmp && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Employee Code', viewEmp.employeeCode],
                ['Email', viewEmp.user?.email],
                ['Phone', viewEmp.user?.phone || '—'],
                ['Role', viewEmp.user?.role?.replace(/_/g, ' ')],
                ['Department', viewEmp.department?.name || '—'],
                ['Position', viewEmp.position || '—'],
                ['Employment Type', viewEmp.employmentType?.replace(/_/g, ' ')],
                ['Salary', viewEmp.salary ? formatCurrency(viewEmp.salary) : '—'],
                ['Hire Date', formatDate(viewEmp.hireDate)],
                ['Status', viewEmp.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </div>

            {viewEmp.leaveRequests?.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Recent Leave Requests</p>
                <div className="space-y-1">
                  {viewEmp.leaveRequests.slice(0, 5).map((lr: any) => (
                    <div key={lr.id} className="flex items-center justify-between text-xs border rounded-lg px-3 py-2">
                      <span className="text-gray-600">{lr.type?.replace(/_/g, ' ')} · {formatDate(lr.startDate)} → {formatDate(lr.endDate)}</span>
                      <Badge variant={lr.status === 'APPROVED' ? 'green' : lr.status === 'PENDING' ? 'yellow' : 'red'}>
                        {lr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Toggle active confirmation */}
      <ConfirmDialog
        isOpen={!!togglingEmp}
        onClose={() => setTogglingEmp(null)}
        onConfirm={handleToggle}
        title={togglingEmp?.status === 'ACTIVE' ? 'Deactivate Employee' : 'Activate Employee'}
        message={
          togglingEmp?.status === 'ACTIVE'
            ? `Deactivate ${togglingEmp?.user?.firstName} ${togglingEmp?.user?.lastName}? They won't be able to log in.`
            : `Reactivate ${togglingEmp?.user?.firstName} ${togglingEmp?.user?.lastName}?`
        }
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingEmp}
        onClose={() => setDeletingEmp(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Permanently delete ${deletingEmp?.user?.firstName} ${deletingEmp?.user?.lastName} and their system account? This cannot be undone.`}
      />
    </div>
  );
};
