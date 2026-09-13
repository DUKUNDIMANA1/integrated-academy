import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { authApi } from '../../api/auth.api';
import { uploadsApi } from '../../api/uploads.api';
import { updateUser } from '../../store/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const r = await authApi.updateProfile(form);
      dispatch(updateUser(r.data.data));
      toast.success('Profile updated');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingProfile(false); }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingPw(false); }
  };

  const f = (setter: any, field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setter((p: any) => ({ ...p, [field]: e.target.value }));

  const handleAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const r = await uploadsApi.uploadAvatar(file);
      dispatch(updateUser(r.data.data));
      toast.success('Profile photo updated');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploadingAvatar(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1>Settings</h1><p className="text-sm text-gray-500">Manage your account</p></div>

      <Card title="Profile Information">
        <form onSubmit={handleProfile} className="space-y-4">
          <ImageUpload
            label="Profile Photo"
            hint="JPG or PNG, max 3MB."
            shape="circle"
            value={user?.avatarUrl || ''}
            uploading={uploadingAvatar}
            onSelect={handleAvatar}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.firstName} onChange={f(setForm, 'firstName')} />
            <Input label="Last Name" value={form.lastName} onChange={f(setForm, 'lastName')} />
          </div>
          <PhoneInput label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
          <Input label="Email" value={user?.email || ''} disabled hint="Email cannot be changed" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Role:</span>
            <span className="badge badge-blue">{user?.role?.replace(/_/g, ' ')}</span>
          </div>
          <Button type="submit" loading={savingProfile}>Save Profile</Button>
        </form>
      </Card>

      <Card title="Change Password">
        <form onSubmit={handlePassword} className="space-y-4">
          <Input label="Current Password" type="password" value={pwForm.currentPassword} onChange={f(setPwForm, 'currentPassword')} />
          <Input label="New Password" type="password" value={pwForm.newPassword} onChange={f(setPwForm, 'newPassword')} hint="At least 8 characters" />
          <Input label="Confirm New Password" type="password" value={pwForm.confirmPassword} onChange={f(setPwForm, 'confirmPassword')} />
          <Button type="submit" loading={savingPw}>Change Password</Button>
        </form>
      </Card>
    </div>
  );
};
