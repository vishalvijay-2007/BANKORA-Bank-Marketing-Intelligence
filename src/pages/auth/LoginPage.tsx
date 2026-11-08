import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { BankoraLogo } from '../../components/BankoraLogo.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface LoginPageProps {
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateRegister,
  onNavigateForgotPassword,
  onLoginSuccess
}) => {
  const { login, logoutMessage, clearLogoutMessage } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLogoutMessage();

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email.trim(), password, rememberMe);
      onLoginSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid email address or password. Please verify your credentials or create a new account.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#070B19] text-slate-100 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Gradients & Ambient Glow */}
      <div className="absolute top-1/4 -left-36 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-36 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl border border-slate-800/90 bg-[#0B1024]/90 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-black/60 space-y-7">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <BankoraLogo isDark={true} />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Sign in with your registered credentials to access your banking intelligence workspace
            </p>
          </div>

          {/* Logout Message Feedback */}
          {logoutMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{logoutMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-400">Remember this browser session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="pt-2 text-center border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors cursor-pointer ml-1"
              >
                Create New Account
              </button>
            </p>
          </div>

          {/* Security Protocol Badges */}
          <div className="pt-1 flex items-center justify-center gap-4 text-[10px] text-slate-400 border-t border-slate-800/40">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Argon2 / bcrypt Hashed</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>JWT Bearer Security</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
