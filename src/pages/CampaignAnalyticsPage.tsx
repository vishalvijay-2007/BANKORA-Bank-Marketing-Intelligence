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
  ComposedChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { PhoneCall, Clock, Award, Smartphone, AlertTriangle, ArrowRight } from 'lucide-react';
import { bankoraApi } from '../services/api.ts';
import { CampaignAnalyticsResponse, NavPageId } from '../types/bankora.ts';

interface CampaignAnalyticsPageProps {
  onNavigate: (page: NavPageId) => void;
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0F172A',
  borderColor: '#1E293B',
  borderRadius: '10px',
  color: '#F8FAFC',
  fontSize: '12px'
};

export const CampaignAnalyticsPage: React.FC<CampaignAnalyticsPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<CampaignAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bankoraApi
      .getCampaignAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-xl bg-slate-200/70 dark:bg-slate-900/50 animate-pulse" />
        <div className="h-80 rounded-xl bg-slate-200/70 dark:bg-slate-900/50 animate-pulse" />
      </div>
    );
  }

  if (!data || !data.hasDataset || !data.metrics) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1326] p-8 text-center">
        <p className="text-sm text-slate-500">
          No active dataset loaded. Please load or upload a dataset in Data Explorer.
        </p>
      </div>
    );
  }

  const {
    contactFrequency = [],
    previousOutcomes = [],
    contactMethods = [],
    monthlyStats = [],
    durationDistribution = [],
    metrics
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Campaign Effectiveness & Conversion Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyze outbound call frequency fatigue, historical campaign outcomes, contact channel
            lift, seasonality, and call duration thresholds.
          </p>
        </div>

        <button
          onClick={() => onNavigate('predict')}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          Score Prospect Before Dialing
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Campaign KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Prior Campaign Success Conv.</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-2">
            {metrics.pSuccessRate}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            When poutcome = 'success'
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Optimal 1–2 Calls Conversion</span>
            <PhoneCall className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-display font-bold text-blue-600 dark:text-blue-400 tabular-nums mt-2">
            {metrics.optimalCallsRate}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            vs. {metrics.overContactedRate}% for 4+ calls
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Cellular Channel Conversion</span>
            <Smartphone className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-display font-bold text-violet-600 dark:text-violet-400 tabular-nums mt-2">
            {metrics.cellularRate}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Highest-performing outreach channel
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Subscriber Mean Call Duration</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums mt-2">
            {metrics.avgDurationYes}s
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            vs. {metrics.avgDurationNo}s for non-subscribers
          </div>
        </div>
      </section>

      {/* Row 1: Campaign Contact Frequency + Previous Campaign Outcomes */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Campaign Contact Frequency */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              Campaign Contact Frequency & Call Fatigue Curve
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customer volume and subscription rate (%) by number of calls in current campaign
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={contactFrequency}
                margin={{ top: 5, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis dataKey="contacts" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  unit="%"
                  tick={{ fontSize: 11, fill: '#F43F5E' }}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="totalCustomers"
                  name="Customers Contacted"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversionRate"
                  name="Conversion Rate (%)"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Previous Campaign Outcomes */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              Previous Campaign Outcome Impact (poutcome)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Current campaign conversion rate based on prior marketing result
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={previousOutcomes}
                margin={{ top: 5, right: 10, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis dataKey="outcome" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar
                  dataKey="conversionRate"
                  name="Subscription Rate (%)"
                  fill="#10B981"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Row 2: Call Duration Distribution + Monthly Campaign Efficacy + Channel Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Call Duration Distribution */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              Call Duration Distribution & Conversion Curve
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Post-call engagement length vs. term deposit subscription rate (%)
            </p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={durationDistribution}
                margin={{ top: 5, right: 10, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis dataKey="durationRange" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="conversionRate"
                  name="Conversion Rate (%)"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fill="url(#durGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Seasonality Volume vs Conversion Rate */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              Monthly Outreach Volume vs. Conversion Efficiency
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              High-volume months (May, Jul, Aug) exhibit lower conversion efficiency than targeted
              months (Mar, Sep, Oct, Dec)
            </p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyStats}
                margin={{ top: 5, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  unit="%"
                  tick={{ fontSize: 11, fill: '#8B5CF6' }}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="volume"
                  name="Total Calls"
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
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Strategic Business Insights Based on Dataset Calculations */}
      <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">
              Calculated Marketing Optimization Recommendations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quantitative business rules derived directly from the active campaign dataset
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>{metrics.overContactedShare}% of customers were called 4+ times</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 text-xs">
          <div className="space-y-2">
            <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
              01. Cap Campaign Calls at 3 Attempts
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Customers contacted 1–2 times convert at{' '}
              <strong className="text-blue-500 tabular-nums">{metrics.optimalCallsRate}%</strong>,
              whereas customers called 4 or more times convert at only{' '}
              <strong className="text-rose-500 tabular-nums">{metrics.overContactedRate}%</strong>{' '}
              while consuming{' '}
              <span className="tabular-nums">{metrics.overContactedShare}%</span> of campaign
              effort. Enforcing a 3-call cap reallocates agent bandwidth to high-propensity leads.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
              02. Fast-Track Prior Campaign Responders
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Prospects with a previous campaign outcome of{' '}
              <code className="font-mono text-emerald-500">success</code> achieve a{' '}
              <strong className="text-emerald-500 tabular-nums">{metrics.pSuccessRate}%</strong>{' '}
              subscription rate. Prioritize these warm relationships at the start of every quarterly
              campaign cycle.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
              03. Shift May/July Mass Dialing to Cellular
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Cellular outreach achieves a{' '}
              <strong className="text-violet-500 tabular-nums">{metrics.cellularRate}%</strong>{' '}
              conversion rate compared to{' '}
              <strong className="tabular-nums">
                {contactMethods.find(c => c.method === 'Unknown')?.conversionRate || 0}%
              </strong>{' '}
              for unverified channels. Pre-scoring prospects via BANKORA before dialing maximizes
              cellular ROI.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
