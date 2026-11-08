import React, { useState } from 'react';
import {
  BrainCircuit,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Info
} from 'lucide-react';
import { bankoraApi } from '../services/api.ts';
import { PredictionFormInput, PredictionResultResponse } from '../types/bankora.ts';

interface PredictCustomerPageProps {
  onPredictionCreated: () => void;
}

const DEFAULT_FORM: PredictionFormInput = {
  age: 41,
  job: 'management',
  marital: 'married',
  education: 'tertiary',
  default: 'no',
  balance: 2850,
  housing: 'no',
  loan: 'no',
  contact: 'cellular',
  day: 14,
  month: 'oct',
  duration: 265,
  campaign: 1,
  pdays: 92,
  previous: 2,
  poutcome: 'success',
  modelMode: 'pre_call',
  selectedModelId: 'gradient_boosting'
};

const PRESET_PROFILES: Array<{ label: string; subtitle: string; values: Partial<PredictionFormInput> }> = [
  {
    label: 'High-Propensity Retiree',
    subtitle: '64yo retired · €6,400 balance · Prior success',
    values: {
      age: 64,
      job: 'retired',
      marital: 'married',
      education: 'tertiary',
      default: 'no',
      balance: 6400,
      housing: 'no',
      loan: 'no',
      contact: 'cellular',
      day: 12,
      month: 'sep',
      duration: 340,
      campaign: 1,
      pdays: 65,
      previous: 2,
      poutcome: 'success'
    }
  },
  {
    label: 'Mid-Career Tech Specialist',
    subtitle: '34yo technician · €1,950 balance · 1st contact',
    values: {
      age: 34,
      job: 'technician',
      marital: 'single',
      education: 'tertiary',
      default: 'no',
      balance: 1950,
      housing: 'no',
      loan: 'no',
      contact: 'cellular',
      day: 18,
      month: 'mar',
      duration: 240,
      campaign: 1,
      pdays: -1,
      previous: 0,
      poutcome: 'unknown'
    }
  },
  {
    label: 'Over-Contacted Mortgage Holder',
    subtitle: '46yo blue-collar · €120 balance · 6 calls',
    values: {
      age: 46,
      job: 'blue-collar',
      marital: 'married',
      education: 'primary',
      default: 'no',
      balance: 120,
      housing: 'yes',
      loan: 'yes',
      contact: 'unknown',
      day: 22,
      month: 'may',
      duration: 85,
      campaign: 6,
      pdays: -1,
      previous: 0,
      poutcome: 'unknown'
    }
  }
];

export const PredictCustomerPage: React.FC<PredictCustomerPageProps> = ({
  onPredictionCreated
}) => {
  const [form, setForm] = useState<PredictionFormInput>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResultResponse | null>(null);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (form.age < 18 || form.age > 100 || Number.isNaN(form.age)) {
      errs.age = 'Age must be between 18 and 100 years.';
    }
    if (form.balance < -25000 || form.balance > 250000 || Number.isNaN(form.balance)) {
      errs.balance = 'Balance must be between -€25,000 and €250,000.';
    }
    if (form.day < 1 || form.day > 31 || Number.isNaN(form.day)) {
      errs.day = 'Contact day must be between 1 and 31.';
    }
    if (form.campaign < 1 || form.campaign > 65 || Number.isNaN(form.campaign)) {
      errs.campaign = 'Campaign contacts must be between 1 and 65.';
    }
    if (form.pdays < -1 || form.pdays > 999 || Number.isNaN(form.pdays)) {
      errs.pdays = 'Days since previous contact must be -1 (never) or 0–999.';
    }
    if (form.previous < 0 || form.previous > 60 || Number.isNaN(form.previous)) {
      errs.previous = 'Previous contacts must be between 0 and 60.';
    }
    if (form.duration < 0 || form.duration > 5000 || Number.isNaN(form.duration)) {
      errs.duration = 'Duration must be between 0 and 5000 seconds.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setApiError(null);
    try {
      const res = await bankoraApi.predictCustomer(form);
      setResult(res);
      onPredictionCreated();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setForm({
      age: 35,
      job: 'admin.',
      marital: 'single',
      education: 'secondary',
      default: 'no',
      balance: 600,
      housing: 'yes',
      loan: 'no',
      contact: 'cellular',
      day: 15,
      month: 'may',
      duration: 180,
      campaign: 2,
      pdays: -1,
      previous: 0,
      poutcome: 'unknown',
      modelMode: form.modelMode,
      selectedModelId: form.selectedModelId
    });
    setErrors({});
    setResult(null);
    setApiError(null);
  };

  const updateField = <K extends keyof PredictionFormInput>(
    field: K,
    value: PredictionFormInput[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Profile Loader */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Customer Subscription Prediction Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time machine learning inference on customer demographic, financial, and campaign
            attributes. Target variable (<code className="font-mono">y</code>) is strictly excluded
            from inputs.
          </p>
        </div>

        {/* Preset Profile Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1 font-medium">Quick Profiles:</span>
          {PRESET_PROFILES.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setForm(prev => ({ ...prev, ...preset.values }));
                setErrors({});
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1024] hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
              title={preset.subtitle}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Prediction Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 16-Attribute UCI Prediction Form */}
        <form
          onSubmit={handleSubmit}
          className="fintech-card lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 sm:p-6 space-y-6 shadow-xs"
        >
          {/* Pipeline Mode & Classifier Selection */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>Inference Pipeline Mode & Algorithm</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Pre-Call mode excludes call duration to prevent post-call data leakage.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => updateField('modelMode', 'pre_call')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    form.modelMode === 'pre_call'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Pre-Call (Leakage-Free)
                </button>
                <button
                  type="button"
                  onClick={() => updateField('modelMode', 'post_call')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    form.modelMode === 'post_call'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Post-Call Benchmark
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Classification Algorithm
                </label>
                <select
                  value={form.selectedModelId || 'gradient_boosting'}
                  onChange={e => updateField('selectedModelId', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0D1326] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="gradient_boosting">Gradient Boosting (Champion Model)</option>
                  <option value="random_forest">Random Forest Classifier</option>
                  <option value="logistic">Logistic Regression (L2 Balanced)</option>
                  <option value="decision_tree">Decision Tree (CART)</option>
                  <option value="knn">K-Nearest Neighbors (KNN)</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {form.modelMode === 'pre_call'
                    ? 'Active: Pre-Call Model scores prospects before dialing (Call Duration ignored).'
                    : 'Active: Post-Call Model includes Call Duration after an agent finishes speaking.'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Customer Demographics */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-display font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              01. Customer Demographics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Customer Age
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Age in years (18 to 100)
                </p>
                <input
                  type="number"
                  value={form.age}
                  onChange={e => updateField('age', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                {errors.age && <p className="text-[11px] text-rose-500 mt-1">{errors.age}</p>}
              </div>

              {/* Job */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Occupation (Job)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Primary employment classification
                </p>
                <select
                  value={form.job}
                  onChange={e => updateField('job', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="management">management</option>
                  <option value="technician">technician</option>
                  <option value="blue-collar">blue-collar</option>
                  <option value="admin.">admin.</option>
                  <option value="services">services</option>
                  <option value="retired">retired</option>
                  <option value="self-employed">self-employed</option>
                  <option value="entrepreneur">entrepreneur</option>
                  <option value="unemployed">unemployed</option>
                  <option value="housemaid">housemaid</option>
                  <option value="student">student</option>
                  <option value="unknown">unknown</option>
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Marital Status
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Household civil status
                </p>
                <select
                  value={form.marital}
                  onChange={e => updateField('marital', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="married">married</option>
                  <option value="single">single</option>
                  <option value="divorced">divorced / widowed</option>
                </select>
              </div>

              {/* Education */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Education Level
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Highest completed academic tier
                </p>
                <select
                  value={form.education}
                  onChange={e => updateField('education', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="tertiary">tertiary (University / Degree)</option>
                  <option value="secondary">secondary (High School)</option>
                  <option value="primary">primary (Basic Education)</option>
                  <option value="unknown">unknown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financial & Credit Standing */}
          <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-display font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              02. Financial & Credit Standing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account Balance */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Average Yearly Account Balance (€)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Average annual balance in Euros
                </p>
                <input
                  type="number"
                  value={form.balance}
                  onChange={e => updateField('balance', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                {errors.balance && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.balance}</p>
                )}
              </div>

              {/* Credit Default */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Credit in Default
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Does customer have credit in default?
                </p>
                <select
                  value={form.default}
                  onChange={e => updateField('default', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="no">no</option>
                  <option value="yes">yes</option>
                </select>
              </div>

              {/* Housing Loan */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Housing Mortgage Loan
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Active residential mortgage obligation
                </p>
                <select
                  value={form.housing}
                  onChange={e => updateField('housing', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="no">no</option>
                  <option value="yes">yes</option>
                </select>
              </div>

              {/* Personal Loan */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Personal Loan
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Active personal consumer loan
                </p>
                <select
                  value={form.loan}
                  onChange={e => updateField('loan', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="no">no</option>
                  <option value="yes">yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Current & Historical Campaign Context */}
          <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-display font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              03. Campaign & Historical Contact Attributes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Contact Method */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Contact Method
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Outreach communication type
                </p>
                <select
                  value={form.contact}
                  onChange={e => updateField('contact', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="cellular">cellular</option>
                  <option value="telephone">telephone (landline)</option>
                  <option value="unknown">unknown</option>
                </select>
              </div>

              {/* Last Contact Month */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Contact Month
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Scheduled or last contact month
                </p>
                <select
                  value={form.month}
                  onChange={e => updateField('month', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map(
                    m => (
                      <option key={m} value={m}>
                        {m.toUpperCase()}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Last Contact Day */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Contact Day of Month
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Calendar day (1 to 31)
                </p>
                <input
                  type="number"
                  value={form.day}
                  onChange={e => updateField('day', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                {errors.day && <p className="text-[11px] text-rose-500 mt-1">{errors.day}</p>}
              </div>

              {/* Campaign Contacts */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Campaign Contacts
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Contacts in current campaign
                </p>
                <input
                  type="number"
                  value={form.campaign}
                  onChange={e => updateField('campaign', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                {errors.campaign && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.campaign}</p>
                )}
              </div>

              {/* Days Since Previous Contact */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Days Since Prior Contact (pdays)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  -1 if not previously contacted
                </p>
                <input
                  type="number"
                  value={form.pdays}
                  onChange={e => updateField('pdays', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                {errors.pdays && <p className="text-[11px] text-rose-500 mt-1">{errors.pdays}</p>}
              </div>

              {/* Previous Contacts */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Previous Contacts
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Calls before this campaign
                </p>
                <input
                  type="number"
                  value={form.previous}
                  onChange={e => updateField('previous', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                {errors.previous && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.previous}</p>
                )}
              </div>

              {/* Previous Campaign Outcome */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Previous Campaign Outcome (poutcome)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Result of prior marketing campaign
                </p>
                <select
                  value={form.poutcome}
                  onChange={e => updateField('poutcome', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="success">success (Subscribed previously)</option>
                  <option value="failure">failure (Declined previously)</option>
                  <option value="other">other</option>
                  <option value="unknown">unknown (No prior campaign outcome)</option>
                </select>
              </div>

              {/* Call Duration */}
              <div>
                <label className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                  Call Duration (sec)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  {form.modelMode === 'pre_call'
                    ? 'Ignored in Pre-Call mode'
                    : 'Used in Post-Call mode'}
                </p>
                <input
                  type="number"
                  value={form.duration}
                  disabled={form.modelMode === 'pre_call'}
                  onChange={e => updateField('duration', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white disabled:opacity-45"
                />
              </div>
            </div>
          </div>

          {apiError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Form Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClearForm}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Form
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executing Trained ML Model...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  <span>Predict Subscription Propensity</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Live ML Prediction Result Card */}
        <div className="lg:col-span-5 space-y-5">
          {!result ? (
            <div className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-8 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                Ready for Real-Time Model Inference
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                Configure customer attributes on the left or select one of the sample profiles above,
                then click <strong>Predict Subscription Propensity</strong> to run the trained classifier
                and generate a feature attribution breakdown.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-left text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Model Integrity Notice</span>
                </div>
                <p>
                  Probabilities are statistical estimates generated by the trained classifier on the
                  UCI Bank Marketing dataset, not deterministic guarantees.
                </p>
              </div>
            </div>
          ) : (
            <div className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-6 space-y-6 shadow-xs">
              {/* Verdict Header */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Prediction Result · {result.confidenceTier}
                  </div>
                  <div className="flex items-center gap-2.5">
                    {result.prediction === 'yes' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
                    )}
                    <h2
                      className={`text-xl font-display font-bold ${
                        result.prediction === 'yes'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {result.label}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                    Model: <strong className="text-slate-800 dark:text-slate-200">{result.modelName}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Subscription Probability</div>
                  <div className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {(result.probability * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Probability Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>0% (Unlikely)</span>
                  <span>Decision Threshold (48%)</span>
                  <span>100% (Likely)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      result.prediction === 'yes'
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                        : 'bg-gradient-to-r from-slate-500 to-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, result.probability * 100)}%` }}
                  />
                </div>
              </div>

              {/* Top Contributing Features */}
              <div className="space-y-3">
                <div className="text-xs font-display font-semibold text-slate-900 dark:text-white">
                  Key Contributing Features (Model Attribution)
                </div>
                <div className="space-y-2.5">
                  {result.topContributions.map(c => (
                    <div
                      key={c.feature}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {c.feature}: <code className="font-mono text-blue-500">{String(c.value)}</code>
                        </span>
                        <span
                          className={`font-mono font-semibold tabular-nums ${
                            c.direction === 'positive'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500'
                          }`}
                        >
                          {c.direction === 'positive' ? '+' : ''}
                          {c.impact.toFixed(2)} log-odds
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {c.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Marketing Action */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-violet-600/10 border border-blue-500/25 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-display font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Suggested Marketing Action
                  </span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                    {result.recommendedAction.priority}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Recommended Channel: </span>
                    <strong className="text-slate-900 dark:text-white">
                      {result.recommendedAction.channel}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Outreach Timing: </span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {result.recommendedAction.timing}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Campaign Strategy: </span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {result.recommendedAction.strategy}
                    </span>
                  </div>
                  <div className="pt-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    Expected Conversion Impact: {result.recommendedAction.expectedLift}
                  </div>
                </div>
              </div>

              {/* Statistical Disclaimer */}
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Note: Prediction probabilities represent statistical model estimates derived from
                historical UCI Bank Marketing patterns and are not guarantees of individual customer
                decisions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
