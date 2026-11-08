import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Activity,
  History,
  Database,
  CheckCircle2
} from 'lucide-react';
import { bankoraApi } from '../services/api.ts';

export const ReportsPage: React.FC = () => {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  const handleGeneratePDFReport = async () => {
    setGeneratingPdf(true);
    setPdfSuccess(null);
    try {
      const [overview, summary, models, history] = await Promise.all([
        bankoraApi.getOverview(),
        bankoraApi.getDatasetSummary(),
        bankoraApi.getModelPerformance(),
        bankoraApi.getPredictionHistory()
      ]);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(11, 19, 43);
      doc.rect(0, 0, 210, 36, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('BANKORA – Bank Marketing Intelligence', 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Project Report: Customer Subscription Prediction Using Machine Learning (UCI Dataset)',
        14,
        24
      );
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

      // Section 1: Executive Summary & KPIs
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.text('1. Executive Dataset & Campaign Summary', 14, 46);

      const kpis = overview.kpis;
      if (kpis) {
        autoTable(doc, {
          startY: 50,
          head: [['Metric', 'Calculated Value', 'Analytical Interpretation']],
          body: [
            ['Total Customers Analyzed', kpis.totalCustomers.toLocaleString(), 'Active UCI Bank Marketing dataset'],
            ['Customers Subscribed (y = yes)', kpis.subscribedCustomers.toLocaleString(), `${kpis.subscriptionRate}% overall subscription rate`],
            ['Customers Not Subscribed (y = no)', kpis.notSubscribedCustomers.toLocaleString(), `${(100 - kpis.subscriptionRate).toFixed(2)}% non-converted`],
            ['Average Account Balance', `EUR ${kpis.averageBalance.toLocaleString()}`, `Subscribers average EUR ${kpis.avgSubscribedBalance.toLocaleString()}`],
            ['Total Campaign Contacts', kpis.totalCampaignContacts.toLocaleString(), `${kpis.campaignConversionRate}% conversion per call`],
            ['Champion Pre-Call Classifier', kpis.bestModelName, `Holdout ROC-AUC: ${kpis.bestModelRocAuc}%`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235] },
          styles: { fontSize: 9 }
        });
      }

      // Section 2: Machine Learning Model Comparison
      const afterFirstTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 105;
      doc.setFontSize(13);
      doc.text('2. Machine Learning Model Comparison (Pre-Call Leakage-Free Pipeline)', 14, afterFirstTable + 12);

      autoTable(doc, {
        startY: afterFirstTable + 16,
        head: [['Algorithm', 'Family', 'Accuracy', 'Precision (YES)', 'Recall (YES)', 'F1-Score (YES)', 'ROC-AUC']],
        body: models.preCall.models.map(m => [
          m.isBest ? `${m.name} (Best)` : m.name,
          m.family,
          `${m.accuracy}%`,
          `${m.precision}%`,
          `${m.recall}%`,
          `${m.f1Score}%`,
          `${m.rocAuc}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8.5 }
      });

      // Section 3: Numerical Statistical Summary
      const afterSecondTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 165;
      doc.setFontSize(13);
      doc.text('3. Dataset Numerical Feature Statistics', 14, afterSecondTable + 12);

      autoTable(doc, {
        startY: afterSecondTable + 16,
        head: [['Column', 'Count', 'Mean', 'Std Dev', 'Min', 'Median (50%)', 'Max']],
        body: summary.numericalStats.map(s => [
          s.column,
          s.count.toLocaleString(),
          String(s.mean),
          String(s.std),
          String(s.min),
          String(s.median),
          String(s.max)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8.5 }
      });

      // Section 4: Recent Customer Predictions Log
      doc.addPage();
      doc.setFontSize(13);
      doc.text('4. Recent Customer Subscription Predictions Audit Log', 14, 20);

      autoTable(doc, {
        startY: 25,
        head: [['ID', 'Customer Profile Summary', 'Prediction', 'Probability', 'Model Used', 'Timestamp']],
        body: history.records.slice(0, 15).map(r => [
          `#${r.id}`,
          r.customerSummary,
          r.label,
          `${(r.probability * 100).toFixed(1)}%`,
          r.modelName,
          new Date(r.createdAt).toLocaleDateString()
        ]),
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8.5 }
      });

      doc.save('BANKORA_Executive_ML_Project_Report.pdf');
      setPdfSuccess('Generated and downloaded BANKORA_Executive_ML_Project_Report.pdf');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
          Reports & Analytical Exports
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Generate formatted PDF capstone reports and download CSV datasets, statistical summaries,
          model benchmarks, and prediction logs.
        </p>
      </div>

      {pdfSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{pdfSuccess}</span>
          </div>
          <button onClick={() => setPdfSuccess(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Primary PDF Report Card */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-gradient-to-br from-[#0B132B] via-[#111C38] to-[#1D1848] text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-blue-300 font-medium">
            Comprehensive Multi-Page Academic & Executive Deliverable
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold">
            Generate Full BANKORA Project PDF Report
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Compiles live KPI statistics, all 5 machine learning classification metrics (Accuracy,
            Precision, Recall, F1-Score, ROC-AUC), dataset numerical distributions, and recent
            customer prediction records into a formatted PDF document.
          </p>
        </div>

        <button
          onClick={handleGeneratePDFReport}
          disabled={generatingPdf}
          className="self-start lg:self-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <FileText className="w-4 h-4" />
          {generatingPdf ? 'Compiling PDF Report...' : 'Download Executive PDF Report'}
        </button>
      </section>

      {/* CSV Export Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Dataset Statistical Summary CSV */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                Dataset Statistical Summary (CSV)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Exports count, mean, standard deviation, minimum, 25th/50th/75th percentiles, and
                maximum for all numerical attributes in the active dataset.
              </p>
            </div>
          </div>
          <a
            href="/api/reports/export?type=dataset_summary"
            download="bankora_dataset_statistical_summary.csv"
            className="self-start px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            Download Dataset Summary CSV
          </a>
        </div>

        {/* 2. Model Comparison Metrics CSV */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                ML Model Comparison Metrics (CSV)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Exports holdout test evaluation metrics (Accuracy, Precision, Recall, F1-Score,
                ROC-AUC, TP, FP, TN, FN) for both Pre-Call and Post-Call pipelines across all 5
                classifiers.
              </p>
            </div>
          </div>
          <a
            href="/api/reports/export?type=model_metrics"
            download="bankora_model_comparison_metrics.csv"
            className="self-start px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-violet-500" />
            Download Model Metrics CSV
          </a>
        </div>

        {/* 3. Prediction History CSV */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                Customer Prediction Audit History (CSV)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Exports all historical customer predictions stored in SQLite including customer
                summary, predicted class, probability score, confidence tier, and timestamp.
              </p>
            </div>
          </div>
          <a
            href="/api/reports/export?type=prediction_history"
            download="bankora_prediction_history.csv"
            className="self-start px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            Download Prediction History CSV
          </a>
        </div>

        {/* 4. Full Cleaned Dataset CSV */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0D1326] p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                Complete CleanedUCI Dataset (CSV)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Downloads the full active 17-column UCI Bank Marketing dataset ready for external
                Jupyter notebook analysis or Scikit-learn pipeline training.
              </p>
            </div>
          </div>
          <a
            href="/api/reports/export?type=cleaned_dataset"
            download="bankora_cleaned_dataset.csv"
            className="self-start px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            Download Full Cleaned Dataset CSV
          </a>
        </div>
      </section>
    </div>
  );
};
