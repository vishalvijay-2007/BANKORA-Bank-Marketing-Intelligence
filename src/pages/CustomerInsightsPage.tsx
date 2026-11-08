import React, { useState, useEffect, useCallback } from 'react';
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
  Line
} from 'recharts';
import { Filter, RotateCcw, Users, Percent, Wallet, Calendar } from 'lucide-react';
import { bankoraApi } from '../services/api.ts';
import { CustomerInsightsResponse } from '../types/bankora.ts';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0F172A',
  borderColor: '#1E293B',
  borderRadius: '10px',
  color: '#F8FAFC',
  fontSize: '12px'
};

export const CustomerInsightsPage: React.FC = () => {
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(90);
  const [job, setJob] = useState('all');
  const [education, setEducation] = useState('all');
  const [marital, setMarital] = useState('all');
  const [housing, setHousing] = useState('all');
  const [loan, setLoan] = useState('all');

  const [data, setData] = useState<CustomerInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bankoraApi.getCustomerInsights({
        minAge,
        maxAge,
        job,
        education,
        marital,
        housing,
        loan
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [minAge, maxAge, job, education, marital, housing, loan]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleResetFilters = () => {
    setMinAge(18);
    setMaxAge(90);
    setJob('all');
    setEducation('all');
    setMarital('all');
    setHousing('all');
    setLoan('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Customer Segmentation & Behavioral Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Interactive multi-dimensional cohort slicing across age, occupation, education, marital
            status, liquidity, and loan obligations.
          </p>
        </div>

        <button
          onClick={handleResetFilters}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1326] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Segment Filters
        </button>
      </div>

      {/* Interactive Filter Control Bar */}
      <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-3.5">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          <span>Interactive Cohort Filters (Charts Update Live)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {/* Age Range Controls */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Age Range ({minAge} – {maxAge} yrs)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={18}
                max={maxAge}
                value={minAge}
                onChange={e => setMinAge(Math.max(18, Math.min(maxAge, Number(e.target.value) || 18)))}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="number"
                min={minAge}
                max={100}
                value={maxAge}
                onChange={e => setMaxAge(Math.max(minAge, Math.min(100, Number(e.target.value) || 90)))}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Job Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Occupation (Job)
            </label>
            <select
              value={job}
              onChange={e => setJob(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Occupations</option>
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
          </div>

          {/* Education Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Education Level
            </label>
            <select
              value={education}
              onChange={e => setEducation(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Education Tiers</option>
              <option value="tertiary">Tertiary (University)</option>
              <option value="secondary">Secondary (High School)</option>
              <option value="primary">Primary</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          {/* Marital Status Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Marital Status
            </label>
            <select
              value={marital}
              onChange={e => setMarital(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Marital Statuses</option>
              <option value="married">Married</option>
              <option value="single">Single</option>
              <option value="divorced">Divorced</option>
            </select>
          </div>

          {/* Housing Loan Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Housing Mortgage Loan
            </label>
            <select
              value={housing}
              onChange={e => setHousing(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All (Yes & No)</option>
              <option value="no">No Housing Loan</option>
              <option value="yes">Has Housing Loan</option>
            </select>
          </div>

          {/* Personal Loan Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Personal Loan
            </label>
            <select
              value={loan}
              onChange={e => setLoan(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All (Yes & No)</option>
              <option value="no">No Personal Loan</option>
              <option value="yes">Has Personal Loan</option>
            </select>
          </div>
        </div>
      </section>

      {/* Filtered Cohort Summary Strip */}
      {data?.summary && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Filtered Customers</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums mt-2">
              {data.summary.totalFiltered.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                / {data.summary.totalDataset.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Cohort Subscription Rate</span>
              <Percent className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-2">
              {data.summary.subscriptionRate}%
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({data.summary.subscribedCount.toLocaleString()} yes)
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Cohort Average Balance</span>
              <Wallet className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums mt-2">
              €{data.summary.avgBalance.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Cohort Mean Age</span>
              <Calendar className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums mt-2">
              {data.summary.avgAge} yrs
            </div>
          </div>
        </section>
      )}

      {loading || !data || !data.hasDataset ? (
        <div className="h-80 rounded-xl bg-slate-200/60 dark:bg-slate-900/50 animate-pulse" />
      ) : (
        <>
          {/* Row 1: Age Distribution + Account Balance Tier Analysis */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Customer Age Distribution */}
            <div className="lg:col-span-6 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
              <div className="mb-4">
                <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                  Customer Age Distribution & Conversion Rate
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Subscriber volume vs. conversion rate (%) across age brackets
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data.ageDistribution}
                    margin={{ top: 5, right: 10, left: -14, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      unit="%"
                      tick={{ fontSize: 11, fill: '#38BDF8' }}
                    />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
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
                      dataKey="rate"
                      name="Conversion Rate (%)"
                      stroke="#38BDF8"
                      strokeWidth={2.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Account Balance Analysis */}
            <div className="lg:col-span-6 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
              <div className="mb-4">
                <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                  Account Balance Liquidity Analysis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Term deposit subscription rate across average yearly balance tiers
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.balanceAnalysis}
                    margin={{ top: 5, right: 10, left: -14, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                    <XAxis dataKey="tier" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar
                      dataKey="rate"
                      name="Subscription Rate (%)"
                      fill="#8B5CF6"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Row 2: Job-Wise Subscription Analysis + Loan Status Matrix */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Job-Wise Subscription Analysis */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
              <div className="mb-4">
                <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                  Job-Wise Subscription Rate Ranking
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Occupations ranked by term deposit conversion rate (%)
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.jobBreakdown}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 24, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                    <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis
                      type="category"
                      dataKey="job"
                      width={90}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                    />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar
                      dataKey="rate"
                      name="Conversion Rate (%)"
                      fill="#3B82F6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Loan Status Matrix */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
              <div className="mb-4">
                <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                  Loan Obligation & Debt Profile Analysis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Combined effect of housing mortgage and personal loan status
                </p>
              </div>
              <div className="space-y-4 mt-4">
                {data.loanProfiles?.map(lp => (
                  <div key={lp.profile} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {lp.profile}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {lp.subscribed}/{lp.total} ·{' '}
                        <strong className="text-emerald-500">{lp.rate}%</strong>
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${Math.min(100, lp.rate * 2.5)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Row 3: Education, Marital Status, and Contact Method Breakdown */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Education Breakdown */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
              <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white mb-1">
                Education-Wise Subscription
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Conversion rate by academic qualification
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.educationBreakdown}
                    margin={{ top: 5, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                    <XAxis dataKey="education" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="rate" name="Subscription Rate (%)" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Marital Status Breakdown */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
              <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white mb-1">
                Marital Status Analysis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Subscription rate by household status
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.maritalBreakdown}
                    margin={{ top: 5, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                    <XAxis dataKey="marital" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="rate" name="Subscription Rate (%)" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Contact Method Analysis */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5">
              <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white mb-1">
                Contact Method Analysis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Cellular vs. landline telephone conversion
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.contactAnalysis}
                    margin={{ top: 5, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.35} />
                    <XAxis dataKey="contact" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="rate" name="Subscription Rate (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
