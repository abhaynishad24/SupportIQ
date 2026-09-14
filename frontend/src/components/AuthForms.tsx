import { useState, FormEvent } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Shield, 
  ArrowRight
} from 'lucide-react';

const API_BASE = apiUrl('/api/auth');

type ViewMode = 'login' | 'register' | 'forgot';

export default function AuthForms() {
  const { login } = useAuth();
  const [mode, setMode] = useState<ViewMode>('login');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await axios.post(`${API_BASE}/login`, { email, password });
        login(res.data.token, res.data.user);
      } else if (mode === 'register') {
        await axios.post(`${API_BASE}/register`, { name, email, password });
        setSuccess('Account created successfully! Please log in.');
        setMode('login');
      } else if (mode === 'forgot') {
        const res = await axios.post(`${API_BASE}/forgot-password`, { email });
        setSuccess(res.data.message || 'Reset link sent to your email.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-4 font-[Helvetica,Arial,sans-serif] text-slate-800">
      
      {/* Centered Enterprise Card Container */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/80 rounded-2xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08),0_8px_10px_-6px_rgba(15,23,42,0.04)] p-7 sm:p-8 space-y-6">
        
        {/* Top Section: Branding & Header */}
        <div className="text-center space-y-2">
          
          {/* SupportIQ Badge Logo */}
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-base tracking-tight shadow-md mb-2 border border-slate-800">
            Support<span className="text-sky-400">IQ</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            {mode === 'login' && 'Please enter your details to sign in.'}
            {mode === 'register' && 'Enter your credentials to join SupportIQ platform.'}
            {mode === 'forgot' && 'Enter your registered email address to continue.'}
          </p>
        </div>

        {/* Status Feedback Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Address */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
              />
            </div>
          </div>

          {/* Password Field */}
          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me & Forgot Password (Login Mode Only) */}
          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Remember for 30 days</span>
              </label>

              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-all"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </span>
            {!loading && <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </form>

        {/* Secondary Options: SSO Buttons */}
        {mode === 'login' && (
          <div className="space-y-4 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-slate-400 absolute">or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 py-2 rounded-xl text-xs font-medium text-slate-700 transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 py-2 rounded-xl text-xs font-medium text-slate-700 transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                <span>Microsoft</span>
              </button>
            </div>
          </div>
        )}

        {/* Toggle Mode Footer */}
        <div className="text-center text-xs text-slate-500 pt-1">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all cursor-pointer"
              >
                Sign up
              </button>
            </p>
          ) : mode === 'register' ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all cursor-pointer"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Remember your password?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all cursor-pointer"
              >
                Back to Sign in
              </button>
            </p>
          )}
        </div>

        {/* Trust Badge */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>256-bit SSL Encrypted & Secure Connection</span>
        </div>

      </div>
    </div>
  );
}