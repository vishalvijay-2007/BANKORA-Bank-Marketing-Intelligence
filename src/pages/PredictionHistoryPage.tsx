import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  Trash2,
  Eye,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import { bankoraApi } from '../services/api.ts';
import { PredictionHistoryRecord } from '../types/bankora.ts';

interface PredictionHistoryPageProps {
  onHistoryChanged: () => void;
}

export const PredictionHistoryPage: React.FC<PredictionHistoryPageProps> = ({
  onHistoryChanged
}) => {
  const [records, setRecords] = useState<PredictionHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [selectedRecord, setSelectedRecord] = useState<PredictionHistoryRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bankoraApi.getPredictionHistory({
        search,
        result: resultFilter,
        sort: sortOrder
      });
      setRecords(res.records);
    } finally {
      setLoading(false);
    }
  }, [search, resultFilter, sortOrder]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async (id: number) => {
    await bankoraApi.deletePrediction(id);
    setConfirmDeleteId(null);
    if (selectedRecord?.id === id) setSelectedRecord(null);
    await loadHistory();
    onHistoryChanged();
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      await bankoraApi.clearAllPredictions();
      setConfirmClearAll(false);
      setSelectedRecord(null);
      await loadHistory();
      onHistoryChanged();
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Prediction History & Audit Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Persistent SQLite database log of all customer subscription predictions, probability
            scores, and recommended actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {records.length > 0 && (
            confirmClearAll ? (
              <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <span className="text-[11px] font-medium text-rose-500 pl-2">Clear all {records.length} logs?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={clearingAll}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 cursor-pointer disabled:opacity-60"
                >
                  {clearingAll ? 'Clearing...' : 'Yes, Clear All'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Clear all stored prediction history records from SQLite database"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Logs</span>
              </button>
            )
          )}

          <a
            href="/api/reports/export?type=prediction_history"
            download="bankora_prediction_history.csv"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export Prediction History CSV
          </a>
        </div>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer summary, occupation, or model name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={resultFilter}
            onChange={e => setResultFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Prediction Outcomes</option>
            <option value="yes">Likely to Subscribe (Yes)</option>
            <option value="no">Unlikely to Subscribe (No)</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Date: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </section>

      {/* Main History Grid + Optional Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div
          className={`${
            selectedRecord ? 'lg:col-span-7' : 'lg:col-span-12'
          } rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-3">ID</th>
                  <th className="py-2.5 px-3">Customer Input Summary</th>
                  <th className="py-2.5 px-3">Prediction</th>
                  <th className="py-2.5 px-3 text-right">Probability</th>
                  <th className="py-2.5 px-3">Model Name</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading prediction history from SQLite...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No prediction records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  records.map(rec => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pr-3 font-mono text-slate-400 tabular-nums">#{rec.id}</td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        {rec.customerSummary}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${
                            rec.prediction === 'yes'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {rec.prediction === 'yes' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {rec.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {(rec.probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        {rec.modelName}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                        {new Date(rec.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        {confirmDeleteId === rec.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleDelete(rec.id)}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedRecord(rec)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 cursor-pointer"
                              title="View Full Customer Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(rec.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Record Inspector Panel */}
        {selectedRecord && (
          <div className="lg:col-span-5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                  Prediction Record #{selectedRecord.id} Details
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {new Date(selectedRecord.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 text-xs">
              <div>
                <div className="text-slate-400">Outcome Verdict</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {selectedRecord.label}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Probability Score</div>
                <div className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
                  {(selectedRecord.probability * 100).toFixed(2)}% ({selectedRecord.confidenceTier})
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Submitted Customer Attributes
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                {Object.entries(selectedRecord.input || {})
                  .filter(([k]) => k !== 'modelMode' && k !== 'selectedModelId')
                  .map(([k, v]) => (
                    <div
                      key={k}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80"
                    >
                      <div className="text-[10px] text-slate-400">{k}</div>
                      <div className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                        {String(v)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {selectedRecord.recommendedAction?.strategy && (
              <div className="p-3.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs space-y-1">
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  Recommended Action ({selectedRecord.recommendedAction.priority})
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  {selectedRecord.recommendedAction.strategy}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
