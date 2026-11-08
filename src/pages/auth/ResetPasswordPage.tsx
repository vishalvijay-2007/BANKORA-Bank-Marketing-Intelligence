import React, { useState, useMemo } from 'react';
import {
  Lock,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { BankoraLogo } from '../../components/BankoraLogo.tsx';
import { bankoraApi } from '../../services/api.ts';

interface ResetPasswordPageProps {
  initialToken?: string;
  onNavigateLogin: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  initialToken = '',
  onNavigateLogin
}) => {
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    };
  }, [password]);

  const strengthScore = useMemo(() => {
    const passed = Object.values(passwordCriteria).filter(Boolean).length;
    if (password.length === 0) return 0;
    if (passed <= 2) return 1;
    if (passed <= 3) return 2;
    if (passed <= 4) return 3;
    return 4;
  }, [passwordCriteria, password.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Please provide a valid password reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('New password and Confirm Password do not match.');
      return;
    }

    if (strengthScore < 3) {
      setError('Please choose a password meeting all complexity criteria.');
      return;
    }

    setLoading(true);

    try {
      const res = await bankoraApi.resetPassword({
        token: token.trim(),
        new_password: password,
        confirm_password: confirmPassword
      });
      setSuccessMessage(res.message);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed. The token may be expired or already used.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#070B19] text-slate-100 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-1/4 -left-36 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-36 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl border border-slate-800/90 bg-[#0B1024]/90 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-black/60 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <BankoraLogo isDark={true} />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Set New Password
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Create a strong replacement password for your analyst credentials
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reset Token Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Security Reset Token
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={token}
                    onChange={e => {
                      setToken(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Paste 64-char security token"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 font-mono rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Min. 8 characters"
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Confirm new password"
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password Requirements Checklist */}
              {password.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400">Password Requirements:</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400">
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.length ? 'text-emerald-400' : ''}`}>
                      {passwordCriteria.length ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.upper ? 'text-emerald-400' : ''}`}>
                      {passwordCriteria.upper ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                      <span>Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.number ? 'text-emerald-400' : ''}`}>
                      {passwordCriteria.number ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                      <span>Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.special ? 'text-emerald-400' : ''}`}>
                      {passwordCriteria.special ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                      <span>Special symbol</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Password Hash...</span>
                  </>
                ) : (
                  <>
                    <span>Reset & Invalidate Old Sessions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-left">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password Reset Complete</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {successMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/25"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Back to Sign In */}
          {!success && (
            <div className="pt-2 text-center border-t border-slate-800/80">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}

          <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 border-t border-slate-800/40">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Automatic Session Invalidation Upon Password Reset</span>
          </div>
        </div>
      </div>
    </div>
  );
};
