import React, { useState } from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const LogoutConfirmModal: React.FC = () => {
  const { logoutModalOpen, closeLogoutModal, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!logoutModalOpen) return null;

  const handleConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1024] p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={closeLogoutModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h2 id="logout-title" className="text-base font-display font-bold text-slate-900 dark:text-white">
            Confirm Workspace Sign Out
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Are you sure you want to log out of BANKORA? Your current session tokens will be revoked and sensitive data cleared.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeLogoutModal}
            disabled={loggingOut}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loggingOut}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-rose-600/25 disabled:opacity-60"
          >
            {loggingOut ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
