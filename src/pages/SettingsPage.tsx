import React, { useState } from 'react';
import {
  User,
  Palette,
  Bell,
  Database,
  Save,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Trash2
} from 'lucide-react';
import { bankoraApi } from '../services/api.ts';

interface SettingsPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
  userProfile: {
    name: string;
    role: string;
    department: string;
  };
  onUpdateProfile: (profile: { name: string; role: string; department: string }) => void;
  onDatasetMutated: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDark,
  onToggleTheme,
  userProfile,
  onUpdateProfile,
  onDatasetMutated
}) => {
  const [name, setName] = useState(userProfile.name);
  const [role, setRole] = useState(userProfile.role);
  const [department, setDepartment] = useState(userProfile.department);

  const [defaultPipeline, setDefaultPipeline] = useState<'pre_call' | 'post_call'>('pre_call');
  const [compactTables, setCompactTables] = useState(true);
  const [notifyModelRetrain, setNotifyModelRetrain] = useState(true);
  const [notifyHighPropensity, setNotifyHighPropensity] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedToast(null);
    try {
      const updatedProfile = {
        name: name.trim() || userProfile.name || 'Analyst',
        role: role.trim() || userProfile.role || 'Intelligence Analyst',
        department: department.trim() || 'Retail Banking Decision Science'
      };

      onUpdateProfile(updatedProfile);
      await bankoraApi.saveSettings({
        profile: updatedProfile,
        defaultPipeline,
        compactTables,
        notifyModelRetrain,
        notifyHighPropensity
      });
      setSavedToast('Preferences saved to SQLite database and applied to workspace.');
    } finally {
      setSaving(false);
    }
  };

  const handleDataAction = async (action: 'clean' | 'reset' | 'clear') => {
    setSavedToast(null);
    if (action === 'clean') {
      const res = await bankoraApi.cleanDataset();
      setSavedToast(res.message);
    } else if (action === 'reset') {
      const res = await bankoraApi.resetDataset();
      setSavedToast(res.message);
    } else {
      const res = await bankoraApi.clearDataset();
      setSavedToast(res.message);
    }
    onDatasetMutated();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
          Workspace Settings & Data Governance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure analyst profile, theme appearance, machine learning pipeline defaults,
          notifications, and dataset maintenance.
        </p>
      </div>

      {savedToast && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedToast}</span>
          </div>
          <button onClick={() => setSavedToast(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Analyst Profile Settings */}
        <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
            <User className="w-4 h-4 text-blue-500" />
            <span>Profile Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Role Title
              </label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Division / Department
              </label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* 2. Theme & Dashboard Preferences */}
        <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
            <Palette className="w-4 h-4 text-violet-500" />
            <span>Theme & Dashboard Preferences</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  Interface Color Theme
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Current: {isDark ? 'Midnight Navy (Dark Mode)' : 'Executive Slate (Light Mode)'}
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer"
              >
                Switch to {isDark ? 'Light' : 'Dark'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  Default ML Prediction Mode
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Pre-Call prevents duration target leakage
                </div>
              </div>
              <select
                value={defaultPipeline}
                onChange={e => setDefaultPipeline(e.target.value as 'pre_call' | 'post_call')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0D1326] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="pre_call">Pre-Call (Recommended)</option>
                <option value="post_call">Post-Call Benchmark</option>
              </select>
            </div>
          </div>
        </section>

        {/* 3. Notification Preferences */}
        <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
            <Bell className="w-4 h-4 text-emerald-500" />
            <span>Notification Preferences</span>
          </div>

          <label className="flex items-center justify-between py-2 text-xs cursor-pointer">
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                Model Retraining Completion Alerts
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Notify when all 5 Scikit-learn classifiers finish stratified cross-evaluation
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyModelRetrain}
              onChange={e => setNotifyModelRetrain(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between py-2 text-xs cursor-pointer border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                High-Propensity Subscriber Flag (&gt;75% Probability)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Highlight priority advisor routing when a customer exceeds 75% conversion probability
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyHighPropensity}
              onChange={e => setNotifyHighPropensity(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
          </label>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Preferences...' : 'Save Workspace Settings'}
          </button>
        </div>
      </form>

      {/* 4. Data Management Options */}
      <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
          <Database className="w-4 h-4 text-amber-500" />
          <span>Data Management & Pipeline Maintenance</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleDataAction('clean')}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            Clean & Impute Active Dataset
          </button>

          <button
            type="button"
            onClick={() => handleDataAction('reset')}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            Restore Default UCI Dataset
          </button>

          <button
            type="button"
            onClick={() => handleDataAction('clear')}
            className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Unload Active Dataset
          </button>
        </div>
      </section>
    </div>
  );
};
