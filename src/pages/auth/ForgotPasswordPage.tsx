import React, { useState } from 'react';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { BankoraLogo } from '../../components/BankoraLogo.tsx';
import { bankoraApi } from '../../services/api.ts';

interface ForgotPasswordPageProps {
  onNavigateLogin: () => void;
  onNavigateResetPasswordWithToken: (token: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateLogin,
  onNavigateResetPasswordWithToken
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid account email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await bankoraApi.forgotPassword(email.trim().toLowerCase());
      setMessage(res.message);
      if (res.developmentResetToken) {
        setDevResetToken(res.developmentResetToken);
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password recovery request failed.');
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
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <BankoraLogo isDark={true} />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Password Recovery
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Enter your corporate email to generate a single-use cryptographic reset token
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Account Email Address
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
                <p className="text-[11px] text-slate-400">
                  Recovery instructions will only be generated for registered accounts.
                </p>
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
                    <span>Generating Security Token...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Recovery Token</span>
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
                  <span>Security Token Generated</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Development Simulation Notice & Direct Reset Link */}
              {devResetToken && (
                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-2.5 text-left">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                    <KeyRound className="w-4 h-4" />
                    <span>Local Test Link (SMTP Simulation)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    No external email server is configured in this local container environment. You can test the password reset flow immediately with this generated token:
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateResetPasswordWithToken(devResetToken)}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Proceed to Reset Password with Token</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                  setDevResetToken(null);
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Try another email address
              </button>
            </div>
          )}

          {/* Back to Sign In */}
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

          <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 border-t border-slate-800/40">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Cryptographic Single-Use Token · 60-Minute Expiration</span>
          </div>
        </div>
      </div>
    </div>
  );
};
