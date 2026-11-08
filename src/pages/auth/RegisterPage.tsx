import React, { useState, useMemo } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { BankoraLogo } from '../../components/BankoraLogo.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface RegisterPageProps {
  onNavigateLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateLogin,
  onRegisterSuccess
}) => {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-time password criteria
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    };
  }, [password]);

  // Password strength calculation
  const strengthScore = useMemo(() => {
    const passed = Object.values(passwordCriteria).filter(Boolean).length;
    if (password.length === 0) return 0;
    if (passed <= 2) return 1; // Weak
    if (passed <= 3) return 2; // Fair
    if (passed <= 4) return 3; // Good
    return 4; // Strong
  }, [passwordCriteria, password.length]);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore];
  const strengthColor = [
    'bg-slate-700',
    'bg-rose-500',
    'bg-amber-500',
    'bg-blue-500',
    'bg-emerald-500'
  ][strengthScore];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid corporate or analyst email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (strengthScore < 3) {
      setError('Please choose a stronger password meeting all security requirements.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Banking Compliance & Terms of Service to proceed.');
      return;
    }

    setLoading(true);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phone.trim() || undefined,
        password,
        confirm_password: confirmPassword
      });
      onRegisterSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#070B19] text-slate-100 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-1/3 -left-36 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-36 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-lg relative z-10 my-4">
        <div className="rounded-3xl border border-slate-800/90 bg-[#0B1024]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <BankoraLogo isDark={true} />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Create Analyst Account
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Register a new analyst profile to access real-time ML deposit prediction algorithms
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => {
                      setFullName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g. Jane Doe"
                    required
                    autoComplete="name"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Phone Number <span className="text-slate-400 text-[10px]">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Email Address <span className="text-rose-400">*</span>
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

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password <span className="text-rose-400">*</span>
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
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Confirm Password <span className="text-rose-400">*</span>
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
                    placeholder="Confirm password"
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Password Strength:</span>
                  <span className="font-semibold text-white">{strengthLabel}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map(idx => (
                    <div
                      key={idx}
                      className={`h-full rounded-full transition-all ${
                        idx <= strengthScore ? strengthColor : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Password Criteria Checklist */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-1 text-slate-400">
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.length ? 'text-emerald-400' : ''}`}>
                    {passwordCriteria.length ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.upper ? 'text-emerald-400' : ''}`}>
                    {passwordCriteria.upper ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                    <span>Uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.number ? 'text-emerald-400' : ''}`}>
                    {passwordCriteria.number ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.special ? 'text-emerald-400' : ''}`}>
                    {passwordCriteria.special ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                    <span>Special symbol (!@#$)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-400 leading-snug">
                  I agree to the BANKORA Financial Data Ethics Guidelines, Model Governance Policy, and Workspace Terms of Service.
                </span>
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
                  <span>Provisioning Account & Generating Tokens...</span>
                </>
              ) : (
                <>
                  <span>Create Analyst Workspace Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-2 text-center border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Already have a registered account?{' '}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors cursor-pointer ml-1"
              >
                Sign In
              </button>
            </p>
          </div>

          {/* Security Notice */}
          <div className="pt-1 flex items-center justify-center gap-1 text-[10px] text-slate-400 border-t border-slate-800/40">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Role-Based Access: Default Analyst (User) role granted. Admin approval required for elevation.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
