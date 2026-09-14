import { useState, FormEvent } from 'react';
import axios from 'axios';
import { apiUrl } from '../config';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus({ type: 'error', message: 'Invalid or missing token.' });
      return;
    }
    if (newPassword.length < 8 || newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: newPassword.length < 8 ? 'Password must be at least 8 characters.' : 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await axios.post(apiUrl('/api/auth/reset-password'), {
        token,
        newPassword
      });
      setStatus({ type: 'success', message: res.data.message || 'Password updated successfully!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Password reset failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <KeyRound className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-slate-900">Set New Password</h2>
        </div>

        {status && (
          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{status.message}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}