import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBranding } from '../../hooks/useBranding';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ORG } from '../../config/organization';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { branding } = useBranding();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Always start with a blank form (clears browser back-cache / remount reuse
  // so a logout never shows the previous user's email & password).
  useEffect(() => {
    setForm({ email: '', password: '' });
  }, []);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || null;

  const getDashboard = (role: string) => {
    if (role === 'STUDENT') return '/student/dashboard';
    if (['SUPER_ADMIN','GENERAL_MANAGER','ACADEMY_MANAGER','SALES_ADMISSIONS'].includes(role)) return '/admin/dashboard';
    if (role === 'FINANCE_OFFICER') return '/finance/dashboard';
    if (role === 'INSTRUCTOR') return '/academy/dashboard';
    if (role === 'HR_OFFICER') return '/hr/dashboard';
    if (role === 'CONSULTANT') return '/consultancy/dashboard';
    if (role === 'SUPPORT_OFFICER') return '/support/tickets';
    return '/admin/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      setForm({ email: '', password: '' });
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(from || getDashboard(user.role), { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0f172a] p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-500 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-indigo-500 rounded-full blur-2xl" />
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,179,237,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            {branding.logo ? (
              <img src={branding.logo} alt="Academy logo"
                className="w-12 h-12 rounded-xl object-cover bg-white shadow-lg shadow-blue-500/30" />
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-white font-bold text-xl">{ORG.logoText}</h1>
              <p className="text-blue-400 text-xs">Academy Management System</p>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Cybersecurity<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Excellence
            </span>
            <br />Built for Africa
          </h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Empowering governments, enterprises and communities with research, innovation,
            world-class training, cyber defense and strategic consultancy.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Courses', value: ORG.stats.courses },
              { label: 'Students', value: ORG.stats.students },
              { label: 'Research', value: ORG.stats.research },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-2">
            {ORG.services.slice(0, 4).map(s => (
              <div key={s} className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-gray-500">
          <p>{ORG.email}</p>
          <p>{ORG.phone} · {ORG.supportHours}</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{ORG.name}</p>
              <p className="text-xs text-gray-400">{ORG.tagline}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-6">Sign in to your academy account</p>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@trusterlabsacademy.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="off"
                name="login-email"
              />
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="input pl-10 pr-10"
                    autoComplete="new-password"
                    name="login-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
              </div>

              <Button type="submit" className="w-full !bg-blue-600 hover:!bg-blue-700" size="lg" loading={loading}>
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
