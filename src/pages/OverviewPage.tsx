import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import {
  Users,
  UserCheck,
  UserX,
  Percent,
  TrendingUp,
  Wallet,
  PhoneCall,
  ArrowRight,
  Database,
  BrainCircuit,
  RefreshCw,
  Upload
} from 'lucide-react';
import { NavPageId, OverviewResponse } from '../types/bankora.ts';

interface OverviewPageProps {
  data: OverviewResponse | null;
  loading: boolean;
  onNavigate: (page: NavPageId) => void;
  onRestoreDefaultDataset: () => void;
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0F172A',
  borderColor: '#1E293B',
  borderRadius: '10px',
  color: '#F8FAFC',
  fontSize: '12px'
};

export const OverviewPage: React.FC<OverviewPageProps> = ({
  data,
  loading,
  onNavigate,
  onRestoreDefaultDataset
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-2xl bg-slate-200/70 dark:bg-slate-900/60 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 rounded-xl bg-slate-200/70 dark:bg-slate-900/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty / Unloaded Dataset State
  if (!data || !data.hasDataset || !data.kpis) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1326] p-10 text-center max-w-2xl mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto mb-4">
          <Database className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
          No Active Marketing Dataset Loaded
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          BANKORA calculates all dashboard KPIs, segmentation distributions, and machine learning
          metrics directly from your active dataset. Upload a UCI Bank Marketing CSV file or load
          the built-in UCI dataset to populate analytics.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            onClick={onRestoreDefaultDataset}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Load UCI Bank Marketing Dataset
          </button>
          <button
            onClick={() => onNavigate('explorer')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload Custom CSV in Data Explorer
          </button>
        </div>
      </div>
    );
  }

  const {
    kpis,
    subscriptionDistribution = [],
    monthlyPerformance = [],
    ageGroupAnalysis = [],
    jobAnalysis = [],
    educationAnalysis = [],
    maritalAnalysis = [],
    housingComparison = [],
    campaignContactAnalysis = [],
    recentPredictions = []
  } = data;

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-gradient-to-br from-[#0B132B] via-[#0F1B3D] to-[#1A1446] text-white p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-24 -bottom-24 w-80 h-80 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="text-xs text-blue-300/90 font-medium tracking-wide">
              BANKORA · Bank Marketing Intelligence Platform · Active Dataset: {data.meta?.datasetName}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight text-white">
              Predict Smarter. Market Better. Grow Term Deposits.
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Machine learning intelligence engine trained on{' '}
              <span className="text-white font-semibold tabular-nums">
                {kpis.totalCustomers.toLocaleString()}
              </span>{' '}
              historical customer campaign records. Identify high-propensity subscribers prior to
              outbound dialing and eliminate campaign contact fatigue.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('predict')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <BrainCircuit className="w-4 h-4" />
                Predict Customer Subscription
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('models')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Inspect 5 Trained ML Models
              </button>
              <button
                onClick={() => onNavigate('explorer')}
                className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Explore Dataset ({kpis.totalCustomers.toLocaleString()} rows)
              </button>
            </div>
          </div>

          {/* Right Highlight Summary */}
          <div className="lg:col-span-4 rounded-xl bg-slate-950/45 border border-white/10 p-5 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Active Champion Model</span>
              <span className="font-mono text-blue-400 font-semibold">{kpis.bestModelName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="text-[11px] text-slate-400">Holdout ROC-AUC</div>
                <div className="text-2xl font-display font-bold text-white tabular-nums mt-0.5">
                  {kpis.bestModelRocAuc.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Subscriber Avg Balance</div>
                <div className="text-2xl font-display font-bold text-emerald-400 tabular-nums mt-0.5">
                  €{kpis.avgSubscribedBalance.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Stratified 80/20 Split · Zero Target Leakage</span>
              <button
                onClick={() => onNavigate('campaigns')}
                className="text-blue-400 hover:underline font-medium"
              >
                Campaign Lift →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Required Executive KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        <div className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Total Customers</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {kpis.totalCustomers.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono">
              <span className="w-1 h-1 rounded-full bg-blue-500" />
              100% active cohort
            </div>
          </div>
        </div>

        <div className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Subscribed (Yes)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
              {kpis.subscribedCustomers.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400/90 mt-1 flex items-center gap-1 font-mono">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              Term conversions
            </div>
          </div>
        </div>

        <div className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Not Subscribed</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <UserX className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {kpis.notSubscribedCustomers.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums font-mono">
              {(100 - kpis.subscriptionRate).toFixed(1)}% drop rate
            </div>
          </div>
        </div>

        <div className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Subscription Rate</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-display font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
              {kpis.subscriptionRate.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Benchmark ~12.0%
            </div>
          </div>
        </div>

        <div className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Conversion / Contact</span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-display font-bold text-violet-600 dark:text-violet-400 tabular-nums tracking-tight">
              {kpis.campaignConversionRate.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Per outreach attempt
            </div>
          </div>
        </div>

        <div className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Avg Portfolio Balance</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              €{kpis.averageBalance.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums font-mono truncate">
              Sub: €{kpis.avgSubscribedBalance.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="fintech-card rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Campaign Contacts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {kpis.totalCampaignContacts.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums font-mono">
              {(kpis.totalCampaignContacts / Math.max(1, kpis.totalCustomers)).toFixed(1)} calls / lead
            </div>
          </div>
        </div>
      </section>

      {/* Row 1 Charts: Subscription Donut + Monthly Campaign Performance + Age Group Analysis */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Subscription Distribution Donut Chart */}
        <div className="fintech-card lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                Subscription Distribution
              </h2>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Target (y)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target class balance (y = yes vs. y = no)
            </p>
          </div>

          <div className="h-56 relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {subscriptionDistribution.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={idx === 0 ? '#3B82F6' : '#1E293B'}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-display font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {kpis.subscriptionRate.toFixed(1)}%
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Subscribed</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Subscribed (Yes)</span>
              </div>
              <div className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                {kpis.subscribedCustomers.toLocaleString()} ({kpis.subscriptionRate}%)
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span>Not Subscribed</span>
              </div>
              <div className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-1 tabular-nums">
                {kpis.notSubscribedCustomers.toLocaleString()} ({(100 - kpis.subscriptionRate).toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>

        {/* 2. Monthly Campaign Performance Chart */}
        <div className="fintech-card lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 flex flex-col justify-between shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                Monthly Campaign Performance & Conversion Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monthly outreach volume vs. term deposit subscription rate (%)
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Peak conversion months: Mar · Sep · Oct · Dec
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyPerformance} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="subAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  unit="%"
                  tick={{ fontSize: 11, fill: '#A78BFA' }}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="subscribed"
                  name="Subscribed (Yes)"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="notSubscribed"
                  name="Not Subscribed (No)"
                  fill="#334155"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversionRate"
                  name="Conversion Rate (%)"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#8B5CF6' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Row 2 Charts: Age Group Analysis + Job Category Analysis + Education Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 3. Age Group Analysis */}
        <div className="fintech-card lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Age Group Subscription Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Subscription rate (%) across customer age cohorts
            </p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageGroupAnalysis} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis dataKey="ageGroup" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar
                  dataKey="subscriptionRate"
                  name="Subscription Rate (%)"
                  fill="#3B82F6"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Job Category Analysis */}
        <div className="fintech-card lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Job Category Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Top occupations by customer volume and conversion rate
            </p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={jobAnalysis.slice(0, 7)}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis
                  type="category"
                  dataKey="job"
                  width={84}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="subscribed" name="Subscribed" stackId="a" fill="#3B82F6" />
                <Bar
                  dataKey="notSubscribed"
                  name="Not Subscribed"
                  stackId="a"
                  fill="#1E293B"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Education Distribution */}
        <div className="fintech-card lg:col-span-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Education Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Conversion rate by education tier
            </p>
          </div>
          <div className="space-y-3.5 mt-4">
            {educationAnalysis.map(item => (
              <div key={item.education} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.education}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {item.subscribed}/{item.total} ·{' '}
                    <strong className="text-blue-500">{item.subscriptionRate}%</strong>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    style={{ width: `${Math.min(100, item.subscriptionRate * 2.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Row 3 Charts: Marital Status + Housing Loan Comparison + Campaign Contact Analysis */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 6. Subscription by Marital Status */}
        <div className="fintech-card lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Subscription by Marital Status
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Married, Single, and Divorced subscriber comparison
            </p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maritalAnalysis} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis dataKey="marital" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar
                  dataKey="subscriptionRate"
                  name="Subscription Rate (%)"
                  fill="#6366F1"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Housing Loan Comparison */}
        <div className="fintech-card lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Housing Loan Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Impact of existing mortgage obligation on term deposit uptake
            </p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={housingComparison} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis dataKey="housingLoan" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar
                  dataKey="subscriptionRate"
                  name="Conversion Rate (%)"
                  fill="#0EA5E9"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 8. Campaign Contact Frequency Analysis */}
        <div className="fintech-card lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Campaign Contact Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Conversion decay as campaign call count increases
            </p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={campaignContactAnalysis}
                margin={{ top: 5, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="contactDecayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis dataKey="contacts" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="conversionRate"
                  name="Conversion Rate (%)"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fill="url(#contactDecayGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Bottom Row: Recent Prediction Activity & Strategic Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Prediction Activity */}
        <div className="fintech-card lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                  Recent Customer Prediction Activity
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Latest real-time ML predictions persisted in SQLite database
              </p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
            >
              View Full Audit Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800/80 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3">Customer Profile</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3 text-right">Probability</th>
                  <th className="py-2.5 px-3">Model Used</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {recentPredictions.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {item.customer_summary}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold text-xs ${
                          item.prediction === 'yes'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.prediction === 'yes' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {item.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {(Number(item.probability) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[160px] font-mono text-[11px]">
                      {item.model_name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-400 tabular-nums">
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actionable Intelligence Summary */}
        <div className="fintech-card lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1024]/95 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                Calculated Dataset Insights
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-semibold">
                Quant Derived
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Derived directly from the active {kpis.totalCustomers.toLocaleString()} records
            </p>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
                <div className="font-semibold text-slate-900 dark:text-white">
                  01. Balance Liquidity Advantage
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Subscribed customers hold an average balance of{' '}
                  <span className="font-mono font-semibold text-emerald-500 tabular-nums">
                    €{kpis.avgSubscribedBalance.toLocaleString()}
                  </span>{' '}
                  compared to the overall portfolio average of{' '}
                  <span className="font-mono tabular-nums">
                    €{kpis.averageBalance.toLocaleString()}
                  </span>
                  .
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
                <div className="font-semibold text-slate-900 dark:text-white">
                  02. Mortgage Obligation Effect
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Customers without a housing loan subscribe at{' '}
                  <span className="font-mono font-semibold text-blue-500 tabular-nums">
                    {housingComparison.find(h => h.housingLoan.includes('No'))?.subscriptionRate || 0}%
                  </span>{' '}
                  vs.{' '}
                  <span className="font-mono tabular-nums">
                    {housingComparison.find(h => h.housingLoan.includes('Has'))?.subscriptionRate || 0}%
                  </span>{' '}
                  for mortgage holders.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
                <div className="font-semibold text-slate-900 dark:text-white">
                  03. Outbound Contact Efficiency
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  First and second contact attempts yield the highest conversion rate, whereas 5+
                  contacts drop conversion sharply.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('customers')}
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            Open Interactive Customer Segmentation
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
