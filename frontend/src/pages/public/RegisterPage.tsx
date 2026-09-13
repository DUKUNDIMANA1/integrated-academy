import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { ORG } from '../../config/organization';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name required';
    if (!form.lastName.trim()) e.lastName = 'Last name required';
    if (!form.email.trim()) e.email = 'Email required';
    if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password });
      toast.success('Account created! Please complete your application.');
      navigate('/student/applications');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-[#0f172a] p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-cyan-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-600 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,179,237,0.12) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">{ORG.logoText}</p>
            <p className="text-blue-400 text-xs">Academy</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">Start Your<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Cybersecurity</span><br />Journey</h2>
          <p className="text-gray-400 text-sm leading-relaxed">Join 4,990+ students building careers in cybersecurity across Africa.</p>

          <div className="mt-6 space-y-3">
            {[
              { icon: '🎓', text: 'World-class cybersecurity curriculum' },
              { icon: '🛡️', text: 'Hands-on labs and real-world projects' },
              { icon: '🌍', text: 'Built for Africa, recognized globally' },
              { icon: '💼', text: 'Internship & career development' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-gray-300">
                <span className="text-lg">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-500">
          <p>{ORG.email}</p>
          <p>{ORG.phone}</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-gray-900">{ORG.name}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h2>
            <p className="text-sm text-gray-500 mb-6">Register to start your application</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name *" placeholder="Alice" value={form.firstName}
                  onChange={f('firstName')} error={errors.firstName} leftIcon={<User className="w-4 h-4" />} />
                <Input label="Last Name *" placeholder="Uwimana" value={form.lastName}
                  onChange={f('lastName')} error={errors.lastName} />
              </div>
              <Input label="Email *" type="email" placeholder="alice@example.com" value={form.email}
                onChange={f('email')} error={errors.email} leftIcon={<Mail className="w-4 h-4" />} />
              <PhoneInput label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
                    value={form.password} onChange={f('password')}
                    className={`input pl-10 pr-10 ${errors.password ? 'border-red-400' : ''}`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>
              <Input label="Confirm Password *" type={showPw ? 'text' : 'password'} placeholder="Repeat password"
                value={form.confirmPassword} onChange={f('confirmPassword')} error={errors.confirmPassword} />

              <Button type="submit" className="w-full !bg-blue-600 hover:!bg-blue-700 mt-2" size="lg" loading={loading}>
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
