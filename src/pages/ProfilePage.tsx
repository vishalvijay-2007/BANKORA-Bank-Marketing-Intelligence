import React, { useState, useMemo } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { bankoraApi } from '../services/api.ts';

interface ProfilePageProps {
  onNavigateChangePassword?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateChangePassword }) => {
  const { user, updateProfile, requestLogoutConfirmation } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Change Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [updatingPw, setUpdatingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const passwordCriteria = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)
    };
  }, [newPassword]);

  const strengthScore = useMemo(() => {
    const passed = Object.values(passwordCriteria).filter(Boolean).length;
    if (newPassword.length === 0) return 0;
    if (passed <= 2) return 1;
    if (passed <= 3) return 2;
    if (passed <= 4) return 3;
    return 4;
  }, [passwordCriteria, newPassword.length]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!currentPassword) {
      setPwError('Please enter your current account password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    if (strengthScore < 3) {
      setPwError('Please choose a password meeting all complexity criteria.');
      return;
    }

    setUpdatingPw(true);
    try {
      const res = await bankoraApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setPwSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordForm(false), 3500);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setUpdatingPw(false);
    }
  };

  if (!user) {
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile(fullName.trim(), phoneNumber.trim() || undefined);
      setSuccess('Your profile details were updated successfully.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Active Session';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
          Analyst Profile & Security
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your authenticated identity, contact details, and workspace credentials.
        </p>
      </div>

      {/* Main Profile Overview Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0B1024] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 text-white text-xl font-display font-bold flex items-center justify-center shadow-lg shadow-blue-500/20">
              {user.fullName
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                  {user.fullName}
                </h2>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                    user.role === 'admin'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {user.role === 'admin' ? 'System Administrator' : 'Analyst / User'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Account Created: {formattedDate}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={requestLogoutConfirmation}
            className="px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Full Legal / Corporate Name
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
                  required
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => {
                    setPhoneNumber(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Email Address (Read-only for security) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Verified Email Address</span>
                <span className="text-[10px] text-slate-400">Locked (Audit Protocol)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                To change your email address, contact workspace compliance administration.
              </p>
            </div>

            {/* Role (Read-only for security) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Assigned RBAC Role</span>
                <span className="text-[10px] text-slate-400">Immutable</span>
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={user.role === 'admin' ? 'Admin (Full Pipeline & Governance Control)' : 'User (Standard Intelligence Analyst)'}
                  disabled
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed select-none font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Role elevation is enforced strictly on backend database records.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/20 disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & Authentication Policies Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0B1024] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
            <Lock className="w-4 h-4 text-blue-500" />
            <span>Security & Credential Management</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowPasswordForm(prev => !prev);
              setPwError(null);
              setPwSuccess(null);
            }}
            className="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{showPasswordForm ? 'Close Password Form' : 'Update Account Password'}</span>
          </button>
        </div>

        {/* Change Password Form (Expandable) */}
        {showPasswordForm && (
          <div className="p-4 sm:p-5 rounded-xl border border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-500" />
                Change Password for {user.email}
              </h3>
              <span className="text-[10px] text-slate-400">Argon2 / Bcrypt Salting</span>
            </div>

            {pwSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            {pwError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Current Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(prev => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(prev => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Password criteria chips */}
              {newPassword.length > 0 && (
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${passwordCriteria.length ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {passwordCriteria.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ chars
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${passwordCriteria.upper ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {passwordCriteria.upper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${passwordCriteria.lower ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {passwordCriteria.lower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Lowercase
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${passwordCriteria.number ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {passwordCriteria.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Number
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${passwordCriteria.special ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {passwordCriteria.special ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Symbol
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPw}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20 disabled:opacity-60"
                >
                  <Lock className="w-3 h-3" />
                  <span>{updatingPw ? 'Updating Password...' : 'Save New Password'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-500" />
              <span>Password Security & Invalidation</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Passwords are cryptographically salted and hashed using Bcrypt (12 rounds). Changing your password immediately invalidates all other active refresh sessions.
            </p>
            {onNavigateChangePassword && (
              <button
                type="button"
                onClick={onNavigateChangePassword}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1 inline-block cursor-pointer"
              >
                Forgot your current password? Initiate recovery flow →
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Session & Rate-Limiting Protection</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Access tokens are held strictly in memory with automatic 14-minute background refresh. Brute-force protection limits failed login attempts to 5 per 15 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
