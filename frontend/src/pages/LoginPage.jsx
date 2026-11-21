import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, IndianRupee } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      return setError('Please enter both your email address and password.');
    }

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate('/dashboard');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Unable to connect to the server. Please check your backend URL and network connection.'
          : 'Invalid credentials. Please verify your email and password.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#F5F1E8] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient subtle gold radial glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[320px] bg-[#D4AF72]/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1E1E23] border border-[#302B25] text-[#D4AF72] mb-3 shadow-xs">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-[#F5F1E8] tracking-tight">FinTrack</h1>
            <span className="text-[10px] font-bold bg-[#D4AF72]/15 text-[#D4AF72] border border-[#D4AF72]/30 px-1.5 py-0.5 rounded">
              PRO
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A6A19A] font-medium">
            Smart Daily Expense Tracker · INR Edition
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#17171B] py-7 px-6 sm:px-8 rounded-2xl border border-[#302B25] shadow-2xl space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#F5F1E8]">Sign in to your account</h2>
            <p className="text-xs text-[#A6A19A] mt-0.5">Enter your email and password to access your dashboard</p>
          </div>

          {error && (
            <div className="p-3 bg-[#E05263]/15 border border-[#E05263]/30 text-[#E05263] text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#A6A19A] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B665F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:bg-[#17171B] focus:outline-none focus:border-[#D4AF72] focus:ring-1 focus:ring-[#D4AF72]/30 transition text-[#F5F1E8] placeholder:text-[#6B665F] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A6A19A] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B665F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:bg-[#17171B] focus:outline-none focus:border-[#D4AF72] focus:ring-1 focus:ring-[#D4AF72]/30 transition text-[#F5F1E8] placeholder:text-[#6B665F] font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#D4AF72] hover:bg-[#E0C28A] active:bg-[#B89455] text-[#0B0B0D] text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#302B25] text-center text-xs text-[#A6A19A]">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-bold text-[#D4AF72] hover:underline transition">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
