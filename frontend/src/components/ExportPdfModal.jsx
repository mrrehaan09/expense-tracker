import { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileDown,
  CheckCircle2,
  Calendar,
  Layers,
  AlertCircle,
  Users,
  CalendarRange,
} from 'lucide-react';
import { exportTransactionsPDF, formatDatePdf } from '../utils/pdfExport';
import { formatINR } from '../utils/formatters';
import { useExpenses } from '../context/ExpenseContext';

// Helper: Format Date object to local YYYY-MM-DD
const toLocalDateString = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Helper: Extract YYYY-MM-DD from any date input
export const getTxDateString = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    return dateVal.slice(0, 10);
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return toLocalDateString(d);
};

// Presets date calculation
export const getPresetDates = (presetKey) => {
  const now = new Date();
  const todayStr = toLocalDateString(now);

  switch (presetKey) {
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: toLocalDateString(start),
        endDate: toLocalDateString(end),
        label: 'This Month',
      };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: toLocalDateString(start),
        endDate: toLocalDateString(end),
        label: 'Last Month',
      };
    }
    case 'last_30_days': {
      const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      return {
        startDate: toLocalDateString(start),
        endDate: todayStr,
        label: 'Last 30 Days',
      };
    }
    case 'this_week': {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
      return {
        startDate: toLocalDateString(monday),
        endDate: toLocalDateString(sunday),
        label: 'This Week',
      };
    }
    case 'all': {
      return {
        startDate: '',
        endDate: '',
        label: 'All Time',
      };
    }
    case 'custom':
    default: {
      return {
        startDate: '',
        endDate: '',
        label: 'Custom Range',
      };
    }
  }
};

const PRESET_OPTIONS = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_30_days', label: 'Last 30 Days' },
  { key: 'this_week', label: 'This Week' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' },
];

export default function ExportPdfModal({
  isOpen,
  onClose,
  allTransactions: propsAllTransactions = null,
  filteredTransactions: _ignoredFiltered = null,
  groups: propsGroups = null,
  user: propsUser = null,
  defaultPreset = 'this_month',
  initialStartDate = '',
  initialEndDate = '',
  initialGroup = 'all',
  pageFilters = null,
  currentFilterLabel = '',
  filterDetails = '',
}) {
  const expenseCtx = useExpenses();
  const rawTransactions = propsAllTransactions || expenseCtx?.transactions || [];
  const groups = propsGroups || expenseCtx?.groups || [];
  const user = propsUser || expenseCtx?.user || null;

  // Selected preset state
  const [selectedPreset, setSelectedPreset] = useState(defaultPreset);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(initialGroup || 'all'); // 'all' | 'personal' | groupId
  const [includePageFilters, setIncludePageFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const preset = defaultPreset || 'this_month';
      setSelectedPreset(preset);

      if (preset === 'custom' && initialStartDate && initialEndDate) {
        setStartDate(initialStartDate);
        setEndDate(initialEndDate);
      } else {
        const dates = getPresetDates(preset);
        setStartDate(dates.startDate);
        setEndDate(dates.endDate);
      }

      setSelectedGroup(initialGroup || 'all');

      // Check if page has active filters
      const hasPageFilters = Boolean(
        pageFilters &&
          ((pageFilters.type && pageFilters.type !== 'all') ||
            (pageFilters.category && pageFilters.category !== 'all') ||
            (pageFilters.paymentMethod && pageFilters.paymentMethod !== 'all') ||
            (pageFilters.search && pageFilters.search.trim().length > 0))
      );
      setIncludePageFilters(hasPageFilters);
      setExportSuccess('');
      setIsExporting(false);
    }
  }, [isOpen, defaultPreset, initialStartDate, initialEndDate, initialGroup, pageFilters]);

  // Handle Preset Button Click
  const handlePresetSelect = (presetKey) => {
    setSelectedPreset(presetKey);
    const dates = getPresetDates(presetKey);
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
  };

  // Handle Manual Date Picker Changes
  const handleStartDateChange = (val) => {
    setStartDate(val);
    setSelectedPreset('custom');
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    setSelectedPreset('custom');
  };

  // Date Validation
  const dateValidationError = useMemo(() => {
    if (selectedPreset === 'all') return null;
    if (!startDate || !endDate) {
      return 'Please specify both Start Date and End Date.';
    }
    if (startDate > endDate) {
      return 'Start Date cannot be later than End Date.';
    }
    return null;
  }, [selectedPreset, startDate, endDate]);

  // Filtered dataset strictly shared by live preview AND PDF export
  const filteredTransactions = useMemo(() => {
    if (!rawTransactions || rawTransactions.length === 0) return [];
    if (dateValidationError) return [];

    return rawTransactions.filter((tx) => {
      // 1. Date Filter (inclusive of both calendar dates)
      if (selectedPreset !== 'all') {
        if (!startDate || !endDate) return false;
        const txDateStr = getTxDateString(tx.date || tx.createdAt);
        if (!txDateStr) return false;
        if (txDateStr < startDate || txDateStr > endDate) return false;
      }

      // 2. Group Filter
      if (selectedGroup === 'personal') {
        if (tx.group) return false;
      } else if (selectedGroup !== 'all') {
        const txGroupId = tx.group?._id || (typeof tx.group === 'string' ? tx.group : null);
        if (txGroupId !== selectedGroup) return false;
      }

      // 3. Active Page Filters (if user opted to include them)
      if (includePageFilters && pageFilters) {
        if (pageFilters.type && pageFilters.type !== 'all' && tx.type !== pageFilters.type) {
          return false;
        }
        if (pageFilters.category && pageFilters.category !== 'all' && tx.category !== pageFilters.category) {
          return false;
        }
        if (
          pageFilters.paymentMethod &&
          pageFilters.paymentMethod !== 'all' &&
          (tx.paymentMethod || 'Other') !== pageFilters.paymentMethod
        ) {
          return false;
        }
        if (pageFilters.search && pageFilters.search.trim()) {
          const q = pageFilters.search.trim().toLowerCase();
          const match =
            (tx.title && tx.title.toLowerCase().includes(q)) ||
            (tx.category && tx.category.toLowerCase().includes(q)) ||
            (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(q)) ||
            (tx.note && tx.note.toLowerCase().includes(q));
          if (!match) return false;
        }
      }

      return true;
    });
  }, [
    rawTransactions,
    selectedPreset,
    startDate,
    endDate,
    dateValidationError,
    selectedGroup,
    includePageFilters,
    pageFilters,
  ]);

  // Live preview metrics (strictly matching filtered dataset)
  const { previewIncome, previewExpense, previewBalance, previewCount } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') inc += amt;
      else exp += amt;
    });
    return {
      previewIncome: inc,
      previewExpense: exp,
      previewBalance: inc - exp,
      previewCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  if (!isOpen) return null;

  // Active group details for headline
  const activeGroupObj =
    selectedGroup !== 'all' && selectedGroup !== 'personal'
      ? groups.find((g) => g._id === selectedGroup)
      : null;

  // Handle PDF Export
  const handleExport = async () => {
    if (dateValidationError || filteredTransactions.length === 0) return;

    setIsExporting(true);
    setExportSuccess('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 1. Date Range Label
      let dateRangeLabel = 'All Time';
      if (selectedPreset === 'this_month') {
        dateRangeLabel = `This Month (${formatDatePdf(startDate)} - ${formatDatePdf(endDate)})`;
      } else if (selectedPreset === 'last_month') {
        dateRangeLabel = `Last Month (${formatDatePdf(startDate)} - ${formatDatePdf(endDate)})`;
      } else if (selectedPreset === 'last_30_days') {
        dateRangeLabel = `Last 30 Days (${formatDatePdf(startDate)} - ${formatDatePdf(endDate)})`;
      } else if (selectedPreset === 'this_week') {
        dateRangeLabel = `This Week (${formatDatePdf(startDate)} - ${formatDatePdf(endDate)})`;
      } else if (selectedPreset === 'custom') {
        dateRangeLabel = `${formatDatePdf(startDate)} to ${formatDatePdf(endDate)}`;
      }

      // 2. Scope & Group Titles
      let groupTitle = null;
      let scopeTitle = 'Financial Statement';
      if (selectedGroup === 'personal') {
        scopeTitle = 'Personal Transactions';
      } else if (activeGroupObj) {
        groupTitle = activeGroupObj.title;
        scopeTitle = `Group: ${activeGroupObj.title}`;
      }

      // 3. Optional Filter Details Subtitle
      let filterDetailsText = null;
      if (includePageFilters && pageFilters) {
        const parts = [];
        if (pageFilters.type && pageFilters.type !== 'all') parts.push(`Type: ${pageFilters.type}`);
        if (pageFilters.category && pageFilters.category !== 'all') parts.push(`Category: ${pageFilters.category}`);
        if (pageFilters.paymentMethod && pageFilters.paymentMethod !== 'all') parts.push(`Payment: ${pageFilters.paymentMethod}`);
        if (pageFilters.search && pageFilters.search.trim()) parts.push(`Search: "${pageFilters.search.trim()}"`);
        if (parts.length > 0) filterDetailsText = parts.join(' | ');
      } else if (filterDetails && includePageFilters) {
        filterDetailsText = filterDetails;
      }

      const res = exportTransactionsPDF({
        transactions: filteredTransactions,
        user,
        scopeTitle,
        dateRangeLabel,
        filterDetails: filterDetailsText,
        groupTitle,
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

  const hasPageFilters = Boolean(
    pageFilters &&
      ((pageFilters.type && pageFilters.type !== 'all') ||
        (pageFilters.category && pageFilters.category !== 'all') ||
        (pageFilters.paymentMethod && pageFilters.paymentMethod !== 'all') ||
        (pageFilters.search && pageFilters.search.trim().length > 0))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B0B0D]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#17171B] rounded-2xl shadow-2xl border border-[#302B25] overflow-hidden z-10 flex flex-col max-h-[92vh] animate-fade-in-up">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#302B25] flex items-center justify-between bg-[#101013] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF72]/15 text-[#D4AF72] flex items-center justify-center border border-[#D4AF72]/30">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#F5F1E8]">
                Export Financial Statement (PDF)
              </h3>
              <p className="text-xs text-[#A6A19A]">
                Professional ledger formatted in Indian Rupees (Rs.)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Success Banner */}
          {exportSuccess && (
            <div className="p-3 bg-[#2EB872]/15 border border-[#2EB872]/30 text-[#2EB872] text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2EB872] flex-shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}

          {/* Date Range Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#F5F1E8] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF72]" />
                Select Date Range Preset
              </label>
              <span className="text-[11px] text-[#A6A19A] font-medium">
                {selectedPreset === 'all'
                  ? 'Complete history'
                  : selectedPreset === 'custom'
                  ? 'Custom calendar dates'
                  : 'Automatic range'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_OPTIONS.map((opt) => {
                const isActive = selectedPreset === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handlePresetSelect(opt.key)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                      isActive
                        ? 'bg-[#D4AF72] text-[#0B0B0D] border-[#D4AF72] shadow-xs'
                        : 'bg-[#131316] hover:bg-[#1E1E23] text-[#A6A19A] hover:text-[#F5F1E8] border-[#302B25]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start and End Date Inputs */}
          <div className="p-3.5 bg-[#1E1E23] rounded-xl border border-[#302B25] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F5F1E8] flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-[#D4AF72]" />
                Timeframe Boundaries
              </span>
              {selectedPreset !== 'all' && selectedPreset !== 'custom' && (
                <span className="text-[10px] bg-[#131316] text-[#D4AF72] border border-[#302B25] px-2 py-0.5 rounded-md font-semibold">
                  Preset Applied
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#A6A19A] mb-1">
                  Start Date (Inclusive)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  disabled={selectedPreset === 'all'}
                  className="w-full px-3 py-1.5 bg-[#131316] border border-[#302B25] rounded-lg text-xs font-medium text-[#F5F1E8] focus:outline-none focus:border-[#D4AF72] disabled:bg-[#101013] disabled:text-[#6B665F] disabled:border-[#24211D] disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A6A19A] mb-1">
                  End Date (Inclusive)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  disabled={selectedPreset === 'all'}
                  className="w-full px-3 py-1.5 bg-[#131316] border border-[#302B25] rounded-lg text-xs font-medium text-[#F5F1E8] focus:outline-none focus:border-[#D4AF72] disabled:bg-[#101013] disabled:text-[#6B665F] disabled:border-[#24211D] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Date Validation Alert */}
            {dateValidationError && (
              <div className="p-2.5 bg-[#E05263]/15 border border-[#E05263]/30 text-[#E05263] text-xs font-medium rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#E05263] flex-shrink-0" />
                <span>{dateValidationError}</span>
              </div>
            )}
          </div>

          {/* Group Filter Selection */}
          <div>
            <label className="block text-xs font-bold text-[#F5F1E8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#D4AF72]" />
              Filter by Expense Group
            </label>
            <div className="relative">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#131316] border border-[#302B25] rounded-xl text-xs font-semibold text-[#F5F1E8] focus:outline-none focus:border-[#D4AF72] cursor-pointer"
              >
                <option value="all">All Transactions (Personal & All Groups)</option>
                <option value="personal">Personal Transactions Only (No Group)</option>
                {groups.length > 0 && (
                  <optgroup label="Expense Groups">
                    {groups.map((grp) => (
                      <option key={grp._id} value={grp._id}>
                        Group: {grp.title} {grp.color ? `(${grp.color})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            {activeGroupObj && (
              <p className="mt-1.5 text-[11px] text-[#D4AF72] font-medium">
                Export will prominently display group &ldquo;{activeGroupObj.title}&rdquo; in the PDF report header.
              </p>
            )}
          </div>

          {/* Include Active Page Filters (if applicable) */}
          {hasPageFilters && (
            <div className="p-3 bg-[#1E1E23] rounded-xl border border-[#302B25] flex items-start gap-2.5">
              <input
                type="checkbox"
                id="includePageFilters"
                checked={includePageFilters}
                onChange={(e) => setIncludePageFilters(e.target.checked)}
                className="mt-0.5 rounded border-[#302B25] text-[#D4AF72] focus:ring-[#D4AF72] cursor-pointer accent-[#D4AF72]"
              />
              <label htmlFor="includePageFilters" className="text-xs text-[#A6A19A] cursor-pointer">
                <span className="font-bold text-[#F5F1E8]">Include active table filters: </span>
                <span className="text-[#A6A19A]">
                  {currentFilterLabel ? `${currentFilterLabel} ` : ''}
                  {filterDetails ? `(${filterDetails})` : ''}
                </span>
              </label>
            </div>
          )}

          {/* Live Preview Summary (Mathematically identical to exported rows) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#F5F1E8] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#D4AF72]" />
                Live Statement Preview
              </label>
              <span className="text-[11px] font-bold text-[#D4AF72]">
                {previewCount} transaction{previewCount === 1 ? '' : 's'} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-[#1E1E23] border border-[#302B25]">
                <div className="text-[10px] font-bold text-[#A6A19A] uppercase tracking-wider">
                  Records
                </div>
                <div className="text-sm sm:text-base font-extrabold text-[#F5F1E8] mt-1">
                  {previewCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#2EB872]/10 border border-[#2EB872]/30">
                <div className="text-[10px] font-bold text-[#2EB872] uppercase tracking-wider">
                  Total Income
                </div>
                <div className="text-sm sm:text-base font-extrabold text-[#2EB872] mt-1">
                  +{formatINR(previewIncome)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#E05263]/10 border border-[#E05263]/30">
                <div className="text-[10px] font-bold text-[#E05263] uppercase tracking-wider">
                  Total Expenses
                </div>
                <div className="text-sm sm:text-base font-extrabold text-[#E05263] mt-1">
                  -{formatINR(previewExpense)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1E1E23] border border-[#302B25]">
                <div className="text-[10px] font-bold text-[#A6A19A] uppercase tracking-wider">
                  Net Balance
                </div>
                <div
                  className={`text-sm sm:text-base font-extrabold mt-1 ${
                    previewBalance >= 0 ? 'text-[#2EB872]' : 'text-[#E05263]'
                  }`}
                >
                  {formatINR(previewBalance)}
                </div>
              </div>
            </div>

            {previewCount === 0 && !dateValidationError && (
              <p className="mt-2.5 text-xs text-[#F59E0B] bg-[#F59E0B]/15 p-2.5 rounded-lg border border-[#F59E0B]/30 font-medium">
                No transactions match this timeframe and filter combination. Please select a broader date range.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 bg-[#101013] border-t border-[#302B25] flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || Boolean(dateValidationError) || previewCount === 0}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#D4AF72] hover:bg-[#E0C28A] active:bg-[#B89455] text-[#0B0B0D] text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#0B0B0D]/30 border-t-[#0B0B0D] rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Download PDF Statement ({previewCount})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
