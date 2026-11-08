import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  Activity,
  Award,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  Download
} from 'lucide-react';
import { bankoraApi } from '../services/api.ts';
import { ModelPerformanceResponse } from '../types/bankora.ts';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0F172A',
  borderColor: '#1E293B',
  borderRadius: '10px',
  color: '#F8FAFC',
  fontSize: '12px'
};

export const ModelPerformancePage: React.FC = () => {
  const [suites, setSuites] = useState<ModelPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [pipelineMode, setPipelineMode] = useState<'pre_call' | 'post_call'>('pre_call');
  const [selectedModelId, setSelectedModelId] = useState<string>('gradient_boosting');
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  useEffect(() => {
    bankoraApi
      .getModelPerformance()
      .then(res => {
        setSuites(res);
        setSelectedModelId(res.preCall.bestModelId);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setBannerMsg(null);
    try {
      const res = await bankoraApi.retrainModels();
      setSuites({ preCall: res.preCall, postCall: res.postCall });
      setBannerMsg(res.message);
    } finally {
      setRetraining(false);
    }
  };

  if (loading || !suites) {
    return (
      <div className="space-y-6">
        <div className="h-36 rounded-xl bg-slate-200/70 dark:bg-slate-900/50 animate-pulse" />
        <div className="h-96 rounded-xl bg-slate-200/70 dark:bg-slate-900/50 animate-pulse" />
      </div>
    );
  }

  const activeSuite = pipelineMode === 'pre_call' ? suites.preCall : suites.postCall;
  const activeModel =
    activeSuite.models.find(m => m.id === selectedModelId) || activeSuite.models[0];

  const cm = activeModel.confusionMatrix;
  const cmTotal = Math.max(1, cm.tp + cm.fp + cm.tn + cm.fn);

  return (
    <div className="space-y-6">
      {/* Header & Retrain Trigger */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Machine Learning Model Evaluation & Benchmarking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stratified 80/20 train-test evaluation comparing Logistic Regression, Decision Tree,
            Random Forest, Gradient Boosting, and K-Nearest Neighbors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pipeline Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setPipelineMode('pre_call')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                pipelineMode === 'pre_call'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Pre-Call Pipeline (Excludes Duration)
            </button>
            <button
              onClick={() => setPipelineMode('post_call')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                pipelineMode === 'post_call'
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Post-Call Pipeline (Includes Duration)
            </button>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 text-xs font-semibold flex items-center gap-2 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? 'Retraining 5 Models...' : 'Retrain All Models'}
          </button>

          <a
            href="/api/reports/export?type=model_metrics"
            download="bankora_model_comparison_metrics.csv"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1326] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            Export Metrics CSV
          </a>
        </div>
      </div>

      {bannerMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Data Leakage Prevention & Pipeline Explanation Banner */}
      <section className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{activeSuite.modeLabel}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            {activeSuite.modeDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 shrink-0 text-xs border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-slate-400 font-medium">Train / Test Split</div>
            <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {activeSuite.trainSize.toLocaleString()} / {activeSuite.testSize.toLocaleString()} (80/20)
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Champion Classifier</div>
            <div className="font-display font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <Award className="w-3.5 h-3.5" />
              {activeSuite.bestModelName}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Best ROC-AUC</div>
            <div className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
              {activeSuite.bestModelRocAuc}%
            </div>
          </div>
        </div>
      </section>

      {/* 5-Model Comprehensive Comparison Table */}
      <section className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Classification Algorithm Comparison Matrix (Holdout Test Set)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any model row to inspect its Confusion Matrix, ROC Curve, PR Curve, and Feature
              Importances below
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums font-mono">
            Positive Class (y = yes) Ratio: {activeSuite.positiveClassRatio}%
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/70 dark:border-slate-800/80 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4">Classifier Algorithm</th>
                <th className="py-2.5 px-3">Model Family</th>
                <th className="py-2.5 px-3 text-right">Accuracy</th>
                <th className="py-2.5 px-3 text-right">Precision (YES)</th>
                <th className="py-2.5 px-3 text-right">Recall (YES)</th>
                <th className="py-2.5 px-3 text-right">F1-Score (YES)</th>
                <th className="py-2.5 px-3 text-right">F1-Score (NO)</th>
                <th className="py-2.5 px-3 text-right">ROC-AUC</th>
                <th className="py-2.5 pl-3 text-right">Train Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {activeSuite.models.map(m => {
                const isSelected = m.id === activeModel.id;
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedModelId(m.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600/10 dark:bg-blue-500/15'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{m.name}</span>
                      {m.isBest && (
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                          · Best Model
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{m.family}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {m.accuracy.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {m.precision.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {m.recall.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                      {m.f1Score.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {m.f1No.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {m.rocAuc.toFixed(2)}%
                    </td>
                    <td className="py-3 pl-3 text-right font-mono tabular-nums text-slate-400">
                      {m.trainTimeMs}ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Model Comparison Bar Chart + Confusion Matrix */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Multi-Metric Model Comparison Chart */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              Visual Model Benchmark (ROC-AUC vs. F1-Score vs. Recall)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Side-by-side comparison across all 5 trained algorithms
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeSuite.models}
                margin={{ top: 5, right: 12, left: -14, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="rocAuc" name="ROC-AUC (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="f1Score" name="F1-Score YES (%)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recall" name="Recall YES (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix for Selected Model */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                Confusion Matrix — {activeModel.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluated on {activeSuite.testSize.toLocaleString()} holdout test records
              </p>
            </div>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3 my-auto">
            <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                True Negative (Actual No · Pred No)
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                {cm.tn.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-slate-400 tabular-nums mt-0.5">
                {((cm.tn / cmTotal) * 100).toFixed(1)}% of test set
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <div className="text-[11px] text-amber-600 dark:text-amber-400">
                False Positive (Actual No · Pred Yes)
              </div>
              <div className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                {cm.fp.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-amber-500/80 tabular-nums mt-0.5">
                {((cm.fp / cmTotal) * 100).toFixed(1)}% Type I error
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25">
              <div className="text-[11px] text-rose-600 dark:text-rose-400">
                False Negative (Actual Yes · Pred No)
              </div>
              <div className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">
                {cm.fn.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-rose-500/80 tabular-nums mt-0.5">
                {((cm.fn / cmTotal) * 100).toFixed(1)}% Missed subscribers
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                True Positive (Actual Yes · Pred Yes)
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {cm.tp.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-emerald-500/80 tabular-nums mt-0.5">
                {((cm.tp / cmTotal) * 100).toFixed(1)}% Captured subscribers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Row 3: ROC Curve + Precision-Recall Curve + Feature Importance */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ROC Curve */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
          <div className="mb-3">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              ROC Curve ({activeModel.name})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              True Positive Rate vs. False Positive Rate (AUC = {activeModel.rocAuc}%)
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeModel.rocCurve} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  name="False Positive Rate"
                />
                <YAxis
                  dataKey="y"
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  name="True Positive Rate"
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="y"
                  name="True Positive Rate"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precision-Recall Curve */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
          <div className="mb-3">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              Precision-Recall Curve ({activeModel.name})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Minority class (y = yes) precision across recall thresholds
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeModel.prCurve} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  name="Recall"
                />
                <YAxis
                  dataKey="y"
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  name="Precision"
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="y"
                  name="Precision (YES)"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Importance Ranking */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                Feature Importance ({activeModel.name})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Relative predictive power (%) by input attribute
              </p>
            </div>
            <Sliders className="w-4 h-4 text-violet-500" />
          </div>
          <div className="space-y-2.5 mt-2">
            {activeModel.featureImportance.slice(0, 7).map(fi => (
              <div key={fi.feature} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                    {fi.label}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {fi.importance.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{ width: `${Math.min(100, fi.importance * 2.4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
