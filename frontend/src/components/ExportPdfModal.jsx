import { useState } from 'react';
import {
  X,
  FileDown,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { exportTransactionsPDF } from '../utils/pdfExport';
import { formatINR } from '../utils/formatters';

export default function ExportPdfModal({
  isOpen,
  onClose,
  allTransactions = [],
  filteredTransactions = [],
  currentFilterLabel = 'Current Filter',
  filterDetails = '',
  user = null,
}) {
  const [selectedScope, setSelectedScope] = useState('filtered'); // 'filtered' | 'all'
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  if (!isOpen) return null;

  const activeTransactions =
    selectedScope === 'filtered' ? filteredTransactions : allTransactions;

  // Calculate live preview metrics for the selected option
  let previewIncome = 0;
  let previewExpense = 0;
  activeTransactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') previewIncome += amt;
    else previewExpense += amt;
  });
  const previewBalance = previewIncome - previewExpense;

  const handleExport = async () => {
    if (activeTransactions.length === 0) {
      alert('There are no transactions to export under this selection.');
      return;
    }

    setIsExporting(true);
    setExportSuccess('');

    try {
      // Small timeout to allow UI loading state to paint smoothly
      await new Promise((resolve) => setTimeout(resolve, 150));

      const scopeTitle =
        selectedScope === 'all'
          ? 'All-Time Complete Ledger'
          : `Filtered Ledger (${currentFilterLabel})`;

      const dateRangeLabel =
        selectedScope === 'all' ? 'All Time' : currentFilterLabel;

      const res = exportTransactionsPDF({
        transactions: activeTransactions,
        user,
        scopeTitle,
        dateRangeLabel,
        filterDetails: selectedScope === 'filtered' ? filterDetails : null,
      });

      if (res?.success) {
        setExportSuccess(`Successfully downloaded: ${res.fileName}`);
        setTimeout(() => {
          setExportSuccess('');
          onClose();
        }, 1600);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-10 animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Export Financial Statement (PDF)
              </h3>
              <p className="text-xs text-slate-500">
                Official statement in Indian Rupees (₹ INR)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {exportSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}

          {/* Scope Selector Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Choose Data Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Filtered */}
              <button
                type="button"
                onClick={() => setSelectedScope('filtered')}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedScope === 'filtered'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Filtered History
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      selectedScope === 'filtered'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {filteredTransactions.length} items
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Matches your active timeframe ({currentFilterLabel}) and ledger filters.
                </p>
              </button>

              {/* Option 2: All Time */}
              <button
                type="button"
                onClick={() => setSelectedScope('all')}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedScope === 'all'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    All-Time History
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      selectedScope === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {allTransactions.length} items
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Exports complete lifetime transaction register across all pages.
                </p>
              </button>
            </div>
          </div>

          {/* Scope Preview Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Statement Preview</span>
              <span className="font-semibold text-slate-500 text-[11px]">
                {activeTransactions.length} transactions included
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 text-center">
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Income
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  +{formatINR(previewIncome)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Expenses
                </span>
                <span className="text-xs font-bold text-rose-600">
                  -{formatINR(previewExpense)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Net Balance
                </span>
                <span
                  className={`text-xs font-bold ${
                    previewBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
                  }`}
                >
                  {formatINR(previewBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* PDF Format Guarantee Checklist */}
          <div className="text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Multi-page continuation with headers & page numbers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Includes executive summary, category breakdown & payment channels</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || activeTransactions.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>
              {isExporting
                ? 'Generating PDF...'
                : `Download PDF (${activeTransactions.length})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
