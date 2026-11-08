import React from 'react';
import {
  BookOpen,
  Target,
  Layers,
  Cpu,
  Database,
  GitBranch,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const UCI_ATTRIBUTES = [
  { name: 'age', type: 'Numerical', desc: 'Customer age in years (18–95)' },
  { name: 'job', type: 'Categorical', desc: 'Type of job (management, technician, blue-collar, retired, etc.)' },
  { name: 'marital', type: 'Categorical', desc: 'Marital status (married, single, divorced/widowed)' },
  { name: 'education', type: 'Categorical', desc: 'Education level (primary, secondary, tertiary, unknown)' },
  { name: 'default', type: 'Binary', desc: 'Has credit in default? (yes, no)' },
  { name: 'balance', type: 'Numerical', desc: 'Average yearly account balance in Euros (€)' },
  { name: 'housing', type: 'Binary', desc: 'Has a residential housing mortgage loan? (yes, no)' },
  { name: 'loan', type: 'Binary', desc: 'Has a personal consumer loan? (yes, no)' },
  { name: 'contact', type: 'Categorical', desc: 'Contact communication type (cellular, telephone, unknown)' },
  { name: 'day', type: 'Numerical', desc: 'Last contact day of the month (1–31)' },
  { name: 'month', type: 'Categorical', desc: 'Last contact month of year (jan, feb, mar, ..., dec)' },
  { name: 'duration', type: 'Numerical', desc: 'Last contact duration in seconds (Excluded in Pre-Call Model to prevent data leakage)' },
  { name: 'campaign', type: 'Numerical', desc: 'Number of contacts performed during this campaign for this client' },
  { name: 'pdays', type: 'Numerical', desc: 'Days passed after the client was last contacted from a previous campaign (-1 means not previously contacted)' },
  { name: 'previous', type: 'Numerical', desc: 'Number of contacts performed before this campaign for this client' },
  { name: 'poutcome', type: 'Categorical', desc: 'Outcome of the previous marketing campaign (failure, other, success, unknown)' },
  { name: 'y', type: 'Target (Binary)', desc: 'Has the client subscribed a term deposit? (yes, no)' }
];

export const AboutProjectPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Project Title Card */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-gradient-to-br from-[#0B132B] via-[#101B3B] to-[#1B1445] text-white p-6 sm:p-8 space-y-3">
        <div className="text-xs text-blue-300 font-medium">
          Academic Capstone Project · Full-Stack Machine Learning Intelligence System
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">
          Bank Marketing – Customer Subscription Prediction Using Machine Learning
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          <strong>BANKORA – Bank Marketing Intelligence</strong> is an end-to-end decision science
          and predictive analytics platform designed to help retail banking institutions identify
          customers with high propensity to subscribe to long-term deposits while minimizing
          telemarketing fatigue and operational cost.
        </p>
      </section>

      {/* Problem Statement & Objectives */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span>Problem Statement</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Banks conduct direct telemarketing campaigns to promote term deposits, but identifying
            customers who are genuinely likely to subscribe is challenging. Mass untargeted outbound
            calling results in low conversion rates (~11–12%), high contact center costs, and severe
            customer irritation from repeated follow-up calls.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
            <Target className="w-4 h-4 text-emerald-500" />
            <span>Project Objectives</span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed list-disc pl-4">
            <li>
              Develop a leakage-free machine learning system to predict customer subscription
              behavior using historical UCI Bank Marketing data.
            </li>
            <li>
              Benchmark 5 supervised classification algorithms using stratified train/test splitting
              and class-imbalance-aware metrics (ROC-AUC, F1-Score, Precision-Recall).
            </li>
            <li>
              Provide actionable next-best marketing recommendations and interactive exploratory data
              analytics for campaign managers.
            </li>
          </ul>
        </div>
      </section>

      {/* Methodology & Machine Learning Algorithms */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
            <GitBranch className="w-4 h-4 text-violet-500" />
            <span>End-to-End Data Science Methodology</span>
          </div>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <strong className="text-slate-900 dark:text-white">01. Data Validation & Cleaning:</strong>{' '}
              Validates all 17 UCI attributes, detects missing/unknown values, and deduplicates
              records.
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">
                02. Leakage Prevention (Pre-Call Pipeline):
              </strong>{' '}
              Excludes <code className="font-mono text-blue-500">duration</code> during pre-call
              training because call duration is unknown prior to dialing a customer.
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">
                03. Feature Encoding & Scaling:
              </strong>{' '}
              Fits One-Hot Encoding on categorical features and Z-score Standard Scaling on numerical
              features strictly on the 80% stratified training split.
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">
                04. Imbalance-Aware Training & Persistence:
              </strong>{' '}
              Applies balanced class weights during training, evaluates on the 20% holdout test split,
              and persists the champion pipeline via Joblib & SQLite.
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
            <Cpu className="w-4 h-4 text-blue-500" />
            <span>Implemented Machine Learning Algorithms</span>
          </div>
          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <strong className="text-slate-900 dark:text-white">1. Logistic Regression:</strong> L2
              regularized linear log-odds classifier with class-balanced sample weighting.
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">2. Decision Tree (CART):</strong>{' '}
              Non-linear recursive partitioning using weighted Gini impurity and leaf regularization.
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">3. Random Forest:</strong> Bagged
              ensemble of de-correlated decision trees trained on bootstrap samples and random
              feature subsets.
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">4. Gradient Boosting:</strong>{' '}
              Sequential stagewise additive ensemble focusing on hard-to-classify minority subscribers.
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">5. K-Nearest Neighbors (KNN):</strong>{' '}
              Distance-weighted Euclidean similarity search in standardized feature space.
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture & Technology Stack */}
      <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
          <Layers className="w-4 h-4 text-cyan-500" />
          <span>System Architecture & Technology Stack</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="font-display font-bold text-slate-900 dark:text-white">
              Frontend Layer
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, jsPDF Report Engine
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="font-display font-bold text-slate-900 dark:text-white">
              REST API Layer
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              FastAPI (Python) & Express/TypeScript Full-Stack Runtime with schema validation
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="font-display font-bold text-slate-900 dark:text-white">
              ML & Data Science
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Scikit-learn, Pandas, NumPy, Joblib, Stratified 80/20 Pipeline, ROC/PR Evaluation
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="font-display font-bold text-slate-900 dark:text-white">
              Persistence Layer
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              SQLite Relational Database & SQLAlchemy ORM storing prediction history and settings
            </p>
          </div>
        </div>
      </section>

      {/* UCI Bank Marketing Dataset Dictionary */}
      <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
            <Database className="w-4 h-4 text-blue-500" />
            <span>UCI Bank Marketing Dataset Attribute Dictionary (17 Columns)</span>
          </div>
          <span className="text-xs text-slate-400">Source: Moro et al., UCI ML Repository</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-2 pr-4">Attribute</th>
                <th className="py-2 px-4">Type</th>
                <th className="py-2 pl-4">Description & Role in Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {UCI_ATTRIBUTES.map(attr => (
                <tr key={attr.name}>
                  <td className="py-2 pr-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {attr.name}
                  </td>
                  <td className="py-2 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {attr.type}
                  </td>
                  <td className="py-2 pl-4 text-slate-700 dark:text-slate-300">{attr.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Future Enhancements */}
      <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Future Enhancements</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <strong className="text-slate-900 dark:text-white">
              01. Automated Batch Campaign Scoring:
            </strong>{' '}
            Upload multi-thousand prospect lists to automatically output ranked dial sheets for CRM
            ingestion.
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white">
              02. Macroeconomic Context Features:
            </strong>{' '}
            Integrate Euribor 3-month rate, consumer confidence index, and quarterly employment
            indicators (`bank-additional-full`).
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white">
              03. Drift Monitoring & Uplift Modeling:
            </strong>{' '}
            Track population stability index (PSI) across seasonal campaigns and model causal
            treatment uplift.
          </div>
        </div>
      </section>
    </div>
  );
};
