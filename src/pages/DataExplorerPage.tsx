import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  Download,
  Search,
  Sparkles,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { bankoraApi } from '../services/api.ts';
import { DatasetPreviewResponse, DatasetSummaryResponse } from '../types/bankora.ts';

interface DataExplorerPageProps {
  onDatasetMutated: () => void;
}

export const DataExplorerPage: React.FC<DataExplorerPageProps> = ({ onDatasetMutated }) => {
  const [summary, setSummary] = useState<DatasetSummaryResponse | null>(null);
  const [preview, setPreview] = useState<DatasetPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'preview' | 'schema' | 'stats'>('preview');

  // Table query states
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [maritalFilter, setMaritalFilter] = useState('all');
  const [educationFilter, setEducationFilter] = useState('all');
  const [yFilter, setYFilter] = useState('all');
  const [sortBy, setSortBy] = useState('age');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSummaryAndPreview = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, prevData] = await Promise.all([
        bankoraApi.getDatasetSummary(),
        bankoraApi.getDatasetPreview({
          page,
          limit: 20,
          search,
          job: jobFilter,
          marital: maritalFilter,
          education: educationFilter,
          y: yFilter,
          sortBy,
          sortDir
        })
      ]);
      setSummary(sumData);
      setPreview(prevData);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load dataset.'
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, jobFilter, maritalFilter, educationFilter, yFilter, sortBy, sortDir]);

  useEffect(() => {
    loadSummaryAndPreview();
  }, [loadSummaryAndPreview]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFeedback({
        type: 'error',
        text: 'Invalid file format. Please upload a valid .csv file following the UCI Bank Marketing schema.'
      });
      return;
    }

    setActionBusy(true);
    setFeedback(null);
    try {
      const text = await file.text();
      const res = await bankoraApi.uploadDataset(text, file.name);
      setSummary(res.summary);
      setPage(1);
      await loadSummaryAndPreview();
      onDatasetMutated();
      setFeedback({
        type: 'success',
        text: `${res.message} Best Pre-Call Model: ${res.bestPreCallModel} (ROC-AUC: ${res.bestPreCallRocAuc}%).`
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'CSV upload validation failed.'
      });
    } finally {
      setActionBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCleanDataset = async () => {
    setActionBusy(true);
    setFeedback(null);
    try {
      const res = await bankoraApi.cleanDataset();
      setSummary(res.summary);
      await loadSummaryAndPreview();
      onDatasetMutated();
      setFeedback({ type: 'success', text: res.message });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to clean dataset.'
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleResetDefault = async () => {
    setActionBusy(true);
    setFeedback(null);
    try {
      const res = await bankoraApi.resetDataset();
      setSummary(res.summary);
      setPage(1);
      await loadSummaryAndPreview();
      onDatasetMutated();
      setFeedback({ type: 'success', text: res.message });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to restore default dataset.'
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleClearDataset = async () => {
    setActionBusy(true);
    setFeedback(null);
    try {
      const res = await bankoraApi.clearDataset();
      setSummary(res.summary);
      await loadSummaryAndPreview();
      onDatasetMutated();
      setFeedback({ type: 'success', text: res.message });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to clear dataset.'
      });
    } finally {
      setActionBusy(false);
    }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Dataset Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Data Explorer & Schema Inspector
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload UCI Bank Marketing CSV files (comma or semicolon delimited), audit missing values,
            inspect statistical distributions, and export cleaned datasets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={actionBusy}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload CSV Dataset
          </button>

          <button
            onClick={handleCleanDataset}
            disabled={actionBusy || !summary?.hasDataset}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1326] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            Clean & Impute Unknowns
          </button>

          <a
            href="/api/reports/export?type=cleaned_dataset"
            download="bankora_cleaned_dataset.csv"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1326] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            Download Cleaned CSV
          </a>

          <button
            onClick={handleResetDefault}
            disabled={actionBusy}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1326] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            title="Restore default 1,500-row UCI Bank Marketing dataset"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restore UCI Default
          </button>

          {summary?.hasDataset && (
            <button
              onClick={handleClearDataset}
              disabled={actionBusy}
              className="px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Unload dataset to test Empty/Demo state"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Unload
            </button>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dataset Health Metric Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Records</div>
            <div className="text-xl font-display font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {summary.rowCount.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Feature Columns</div>
            <div className="text-xl font-display font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {summary.columnCount}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Target Class (y = yes)</div>
            <div className="text-xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
              {summary.subscribedCount.toLocaleString()} ({summary.subscriptionRate}%)
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Target Class (y = no)</div>
            <div className="text-xl font-display font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {summary.notSubscribedCount.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Missing / 'unknown' Cells</div>
            <div className="text-xl font-display font-bold text-amber-500 tabular-nums mt-1">
              {summary.meta.missingValues.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Duplicate Records</div>
            <div className="text-xl font-display font-bold text-blue-500 tabular-nums mt-1">
              {summary.meta.duplicateRows.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Segmented View Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-[#162042] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Dataset Records Grid
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'schema'
                ? 'bg-white dark:bg-[#162042] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Column Types & Missing Values ({summary?.columnCount || 17})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-white dark:bg-[#162042] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Statistical Summary (Quartiles & StdDev)
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-blue-500" />
          <span>Active Source: {summary?.meta.datasetName}</span>
        </div>
      </div>

      {/* TAB 1: Interactive Data Grid with Search, Filter, and Sort */}
      {activeTab === 'preview' && (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 space-y-4">
          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search job, month, balance..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <select
              value={jobFilter}
              onChange={e => {
                setJobFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Occupations (job)</option>
              {[
                'management',
                'technician',
                'blue-collar',
                'admin.',
                'services',
                'retired',
                'self-employed',
                'entrepreneur',
                'student',
                'unemployed',
                'housemaid'
              ].map(j => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>

            <select
              value={maritalFilter}
              onChange={e => {
                setMaritalFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Marital Statuses</option>
              <option value="married">married</option>
              <option value="single">single</option>
              <option value="divorced">divorced</option>
            </select>

            <select
              value={educationFilter}
              onChange={e => {
                setEducationFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Education Levels</option>
              <option value="tertiary">tertiary</option>
              <option value="secondary">secondary</option>
              <option value="primary">primary</option>
              <option value="unknown">unknown</option>
            </select>

            <select
              value={yFilter}
              onChange={e => {
                setYFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Target Classes (y)</option>
              <option value="yes">Subscribed (y = yes)</option>
              <option value="no">Not Subscribed (y = no)</option>
            </select>
          </div>

          {/* High-Density Data Table */}
          <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {[
                    { key: 'id', label: '#' },
                    { key: 'age', label: 'age' },
                    { key: 'job', label: 'job' },
                    { key: 'marital', label: 'marital' },
                    { key: 'education', label: 'education' },
                    { key: 'balance', label: 'balance (€)' },
                    { key: 'housing', label: 'housing' },
                    { key: 'loan', label: 'loan' },
                    { key: 'contact', label: 'contact' },
                    { key: 'month', label: 'month' },
                    { key: 'duration', label: 'duration (s)' },
                    { key: 'campaign', label: 'campaign' },
                    { key: 'poutcome', label: 'poutcome' },
                    { key: 'y', label: 'target (y)' }
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="py-2.5 px-3 cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>{col.label}</span>
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-mono tabular-nums">
                {loading ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-400">
                      Loading dataset records...
                    </td>
                  </tr>
                ) : !preview || preview.rows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-400 font-sans">
                      No matching records found. Adjust filters or restore the default UCI dataset.
                    </td>
                  </tr>
                ) : (
                  preview.rows.map(row => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 text-slate-400">{row.id}</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-slate-100">{row.age}</td>
                      <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">
                        {row.job}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {row.marital}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {row.education}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-semibold ${
                          row.balance < 0
                            ? 'text-rose-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        €{row.balance.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {row.housing}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {row.loan}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {row.contact}
                      </td>
                      <td className="py-2 px-3 uppercase text-slate-600 dark:text-slate-400">
                        {row.month}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                        {row.duration}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                        {row.campaign}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {row.poutcome}
                      </td>
                      <td className="py-2 px-3 font-sans font-semibold">
                        <span
                          className={
                            row.y === 'yes'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }
                        >
                          {row.y}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {preview && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="tabular-nums">
                Showing{' '}
                <strong className="text-slate-900 dark:text-white">
                  {preview.rows.length > 0 ? (preview.page - 1) * preview.limit + 1 : 0}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900 dark:text-white">
                  {Math.min(preview.totalFiltered, preview.page * preview.limit)}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-900 dark:text-white">
                  {preview.totalFiltered.toLocaleString()}
                </strong>{' '}
                filtered records
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono tabular-nums px-2">
                  Page {preview.page} / {preview.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(preview.totalPages, p + 1))}
                  disabled={page >= preview.totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Column Schema & Missing Values Inspector */}
      {activeTab === 'schema' && summary && (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              Column Schema, Data Types & Missing / Unknown Value Audit
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              All 17 UCI Bank Marketing attributes with cardinality and missingness rates
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4">Column Name</th>
                  <th className="py-2.5 px-4">Data Type</th>
                  <th className="py-2.5 px-4 text-right">Unique Values</th>
                  <th className="py-2.5 px-4 text-right">Missing / 'unknown' Count</th>
                  <th className="py-2.5 px-4 text-right">Missing %</th>
                  <th className="py-2.5 pl-4">Sample Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {summary.columns.map(col => (
                  <tr key={col.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 pr-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {col.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{col.type}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {col.uniqueCount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {col.missingCount.toLocaleString()}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono tabular-nums font-semibold ${
                        col.missingPct > 0
                          ? 'text-amber-500'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {col.missingPct}%
                    </td>
                    <td className="py-2.5 pl-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {col.sampleValues}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Statistical Summaries */}
      {activeTab === 'stats' && summary && (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                Numerical Feature Descriptive Statistics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mean, standard deviation, min/max, and interquartile range computed across{' '}
                {summary.rowCount.toLocaleString()} rows
              </p>
            </div>
            <a
              href="/api/reports/export?type=dataset_summary"
              download="bankora_dataset_statistical_summary.csv"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Export Statistical Summary CSV
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4">Numerical Attribute</th>
                  <th className="py-2.5 px-3 text-right">Count</th>
                  <th className="py-2.5 px-3 text-right">Mean</th>
                  <th className="py-2.5 px-3 text-right">Std Dev</th>
                  <th className="py-2.5 px-3 text-right">Min</th>
                  <th className="py-2.5 px-3 text-right">25% (Q1)</th>
                  <th className="py-2.5 px-3 text-right">50% (Median)</th>
                  <th className="py-2.5 px-3 text-right">75% (Q3)</th>
                  <th className="py-2.5 pl-3 text-right">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-mono tabular-nums">
                {summary.numericalStats.map(stat => (
                  <tr key={stat.column} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-4 font-semibold text-blue-600 dark:text-blue-400">
                      {stat.column}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {stat.count.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white">
                      {stat.mean.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {stat.std.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {stat.min.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {stat.q25.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-violet-600 dark:text-violet-400">
                      {stat.median.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {stat.q75.toLocaleString()}
                    </td>
                    <td className="py-3 pl-3 text-right text-slate-900 dark:text-white">
                      {stat.max.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
