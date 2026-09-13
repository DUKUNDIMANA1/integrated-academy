import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Filter } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const ALL_ROLES = [
  'SUPER_ADMIN','GENERAL_MANAGER','ACADEMY_MANAGER','ELEARNING_MANAGER',
  'FINANCE_OFFICER','INSTRUCTOR','CONSULTANT','STUDENT','HR_OFFICER',
  'SALES_ADMISSIONS','SUPPORT_OFFICER','AUDITOR',
];

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All Roles' },
  ...ALL_ROLES.map(r => ({ value: r, label: r.replace(/_/g, ' ') })),
];

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', password: '', role: 'STUDENT' };

export const AdminUsers: React.FC = () => {
  const { user: me } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = ['SUPER_ADMIN', 'GENERAL_MANAGER'].includes(me?.role || '');

  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const limit = 20;

  // Create / Edit modal
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<any>(null);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({ ...emptyForm });

  // Confirm dialogs
  const [deletingUser,   setDeletingUser]   = useState<any>(null);
  const [togglingUser,   setTogglingUser]   = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await authApi.getUsers({ page, limit, search: search || undefined, role: roleFilter || undefined });
      setUsers(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, roleFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || '', password: '', role: u.role });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.email) { toast.error('First name and email are required'); return; }
    if (!editing && !form.password) { toast.error('Password is required for new users'); return; }
    setSaving(true);
    try {
      if (editing) {
        const payload: any = { firstName: form.firstName, lastName: form.lastName, phone: form.phone, role: form.role };
        if (form.password) payload.password = form.password;
        await authApi.updateUser(editing.id, payload);
        toast.success('User updated');
      } else {
        await authApi.createUser(form);
        toast.success('User created');
      }
      setShowModal(false);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async () => {
    if (!togglingUser) return;
    try {
      await authApi.toggleUserActive(togglingUser.id, !togglingUser.isActive);
      toast.success(togglingUser.isActive ? 'User deactivated' : 'User activated');
      setTogglingUser(null);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await authApi.deleteUser(deletingUser.id);
      toast.success('User deleted');
      setDeletingUser(null);
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete — user may have related records'); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const roleBadgeColor: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    GENERAL_MANAGER: 'bg-purple-100 text-purple-700',
    ACADEMY_MANAGER: 'bg-blue-100 text-blue-700',
    ELEARNING_MANAGER: 'bg-cyan-100 text-cyan-700',
    FINANCE_OFFICER: 'bg-green-100 text-green-700',
    INSTRUCTOR: 'bg-indigo-100 text-indigo-700',
    STUDENT: 'bg-gray-100 text-gray-700',
    HR_OFFICER: 'bg-yellow-100 text-yellow-700',
    CONSULTANT: 'bg-orange-100 text-orange-700',
    SALES_ADMISSIONS: 'bg-pink-100 text-pink-700',
    SUPPORT_OFFICER: 'bg-teal-100 text-teal-700',
    AUDITOR: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="text-sm text-gray-500">{total} total users</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openNew}>New User</Button>
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
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            options={ROLE_FILTER_OPTIONS}
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={!u.isActive ? 'opacity-60' : ''}>
                    <td className="font-medium">{u.firstName} {u.lastName}</td>
                    <td className="text-gray-500 text-sm">{u.email}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColor[u.role] || 'bg-gray-100 text-gray-700'}`}>
                        {u.role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {u.isActive
                        ? <Badge variant="green">Active</Badge>
                        : <Badge variant="red">Inactive</Badge>}
                    </td>
                    <td className="text-xs text-gray-400">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                    <td className="text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <Button
                          size="sm" variant="ghost"
                          icon={<Edit className="w-3.5 h-3.5" />}
                          onClick={() => openEdit(u)}
                        />
                        {/* Activate / Deactivate — not self */}
                        {u.id !== me?.id && (
                          <Button
                            size="sm" variant="ghost"
                            icon={u.isActive
                              ? <UserX className="w-3.5 h-3.5 text-amber-500" />
                              : <UserCheck className="w-3.5 h-3.5 text-green-500" />}
                            onClick={() => setTogglingUser(u)}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                          />
                        )}
                        {/* Delete — super admin only, not self */}
                        {isSuperAdmin && u.id !== me?.id && (
                          <Button
                            size="sm" variant="ghost"
                            icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                            onClick={() => setDeletingUser(u)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-12">No users found</td></tr>
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
        title={editing ? `Edit — ${editing.firstName} ${editing.lastName}` : 'Create User'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Save Changes' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name *" value={form.firstName} onChange={f('firstName')} />
            <Input label="Last Name" value={form.lastName} onChange={f('lastName')} />
          </div>
          <Input label="Email *" type="email" value={form.email} onChange={f('email')} disabled={!!editing} />
          <PhoneInput label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
          <Input
            label={editing ? 'New Password (leave blank to keep)' : 'Password *'}
            type="password"
            value={form.password}
            onChange={f('password')}
            placeholder={editing ? '••••••••' : ''}
          />
          <Select
            label="Role *"
            value={form.role}
            onChange={f('role')}
            options={ALL_ROLES.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))}
          />
        </div>
      </Modal>

      {/* Toggle active confirmation */}
      <ConfirmDialog
        isOpen={!!togglingUser}
        onClose={() => setTogglingUser(null)}
        onConfirm={handleToggleActive}
        title={togglingUser?.isActive ? 'Deactivate User' : 'Activate User'}
        message={
          togglingUser?.isActive
            ? `Deactivate ${togglingUser?.firstName} ${togglingUser?.lastName}? They won't be able to log in.`
            : `Activate ${togglingUser?.firstName} ${togglingUser?.lastName}? They will be able to log in again.`
        }
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Permanently delete ${deletingUser?.firstName} ${deletingUser?.lastName}? This cannot be undone. Users with enrollments or financial records cannot be deleted — deactivate them instead.`}
      />
    </div>
  );
};
