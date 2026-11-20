import { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Search,
  CalendarRange,
  Tag,
  CreditCard,
  SlidersHorizontal,
  Receipt,
  X,
  Clock,
  FileDown,
} from 'lucide-react';
import {
  formatINR,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  INCOME_CATEGORIES,
} from '../utils/formatters';
import ExportPdfModal from './ExportPdfModal';

// Clean, subtle badges for Indian payment methods
const getPaymentBadge = (method = 'Other') => {
  if (method.includes('PhonePe')) {
    return 'bg-purple-50 text-purple-700 border-purple-200/70';
  }
  if (method.includes('Paytm')) {
    return 'bg-sky-50 text-sky-700 border-sky-200/70';
  }
  if (method.includes('Google Pay')) {
    return 'bg-blue-50 text-blue-700 border-blue-200/70';
  }
  if (method.includes('UPI')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200/70';
  }
  if (method === 'Cash') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
  }
  if (method.includes('Card')) {
    return 'bg-amber-50 text-amber-700 border-amber-200/70';
  }
  if (method.includes('Bank') || method.includes('Net Banking')) {
    return 'bg-teal-50 text-teal-700 border-teal-200/70';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200/70';
};

// Date helper routines
const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const getEndOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export default function RecentTransactions({
  transactions = [],
  onDeleteTransaction,
  isDeletingId = null,
  user = null,
}) {
  // Filters State
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'income'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [search, setSearch] = useState('');

  // Date Filter State: 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Export PDF Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const allCategories = Array.from(
    new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])
  );

  // 1. Comprehensive multi-filter logic
  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = getStartOfDay(yesterday);
    const yesterdayEnd = getEndOfDay(yesterday);

    // Current week: Start from Monday
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - diffToMonday);
    const thisWeekStart = getStartOfDay(weekStart);

    // Current month: 1st day of month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    return transactions.filter((tx) => {
      // Type filter (All / Income / Expense)
      const matchesType = filterType === 'all' ? true : tx.type === filterType;

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' ? true : tx.category === selectedCategory;

      // Payment Method filter
      const matchesPayment =
        selectedPaymentMethod === 'all'
          ? true
          : (tx.paymentMethod || 'Other') === selectedPaymentMethod;

      // Text Search
      const matchesSearch =
        tx.title.toLowerCase().includes(search.toLowerCase()) ||
        (tx.category && tx.category.toLowerCase().includes(search.toLowerCase())) ||
        (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(search.toLowerCase())) ||
        (tx.note && tx.note.toLowerCase().includes(search.toLowerCase()));

      // Date Filtering
      const txDate = new Date(tx.date || tx.createdAt);
      let matchesDate = true;

      if (dateFilter === 'today') {
        matchesDate = txDate >= todayStart && txDate <= todayEnd;
      } else if (dateFilter === 'yesterday') {
        matchesDate = txDate >= yesterdayStart && txDate <= yesterdayEnd;
      } else if (dateFilter === 'this_week') {
        matchesDate = txDate >= thisWeekStart && txDate <= todayEnd;
      } else if (dateFilter === 'this_month') {
        matchesDate = txDate >= thisMonthStart && txDate <= todayEnd;
      } else if (dateFilter === 'custom') {
        if (customStartDate && customEndDate) {
          const start = getStartOfDay(new Date(customStartDate));
          const end = getEndOfDay(new Date(customEndDate));
          matchesDate = txDate >= start && txDate <= end;
        } else if (customStartDate) {
          const start = getStartOfDay(new Date(customStartDate));
          matchesDate = txDate >= start;
        } else if (customEndDate) {
          const end = getEndOfDay(new Date(customEndDate));
          matchesDate = txDate <= end;
        }
      }

      return matchesType && matchesCategory && matchesPayment && matchesSearch && matchesDate;
    });
  }, [
    transactions,
    filterType,
    selectedCategory,
    selectedPaymentMethod,
    search,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  // Readable label for the current filter for the export modal & PDF
  const currentFilterLabel = useMemo(() => {
    switch (dateFilter) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'this_week':
        return 'This Week';
      case 'this_month':
        return 'This Month';
      case 'custom':
        if (customStartDate && customEndDate) return `${customStartDate} to ${customEndDate}`;
        if (customStartDate) return `From ${customStartDate}`;
        if (customEndDate) return `Up to ${customEndDate}`;
        return 'Custom Range';
      default:
        return 'All Time';
    }
  }, [dateFilter, customStartDate, customEndDate]);

  // Extra filter metadata description
  const filterDetailsText = useMemo(() => {
    const parts = [];
    if (filterType !== 'all') parts.push(`Type: ${filterType}`);
    if (selectedCategory !== 'all') parts.push(`Category: ${selectedCategory}`);
    if (selectedPaymentMethod !== 'all') parts.push(`Payment: ${selectedPaymentMethod}`);
    if (search.trim()) parts.push(`Search: "${search.trim()}"`);
    return parts.join(' | ');
  }, [filterType, selectedCategory, selectedPaymentMethod, search]);

  // 2. Group transactions by date for clear ledger headings
  const groupedTransactions = useMemo(() => {
    const map = new Map();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    filtered.forEach((tx) => {
      const txDate = new Date(tx.date || tx.createdAt);
      const dateKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(
        txDate.getDate()
      ).padStart(2, '0')}`;

      if (!map.has(dateKey)) {
        let label = txDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        if (isSameDay(txDate, now)) {
          label = 'Today';
        } else if (isSameDay(txDate, yesterday)) {
          label = 'Yesterday';
        }

        map.set(dateKey, {
          dateKey,
          label,
          fullDate: txDate,
          items: [],
          dayTotalIncome: 0,
          dayTotalExpense: 0,
        });
      }

      const group = map.get(dateKey);
      group.items.push(tx);
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        group.dayTotalIncome += amt;
      } else {
        group.dayTotalExpense += amt;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.fullDate - a.fullDate);
  }, [filtered]);

  // Reset all filters
  const clearFilters = () => {
    setFilterType('all');
    setSelectedCategory('all');
    setSelectedPaymentMethod('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearch('');
  };

  const hasActiveFilters =
    filterType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedPaymentMethod !== 'all' ||
    dateFilter !== 'all' ||
    customStartDate !== '' ||
    customEndDate !== '' ||
    search.trim() !== '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm minimal-card">
      {/* ── Top Header Row ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Transaction Ledger
                </h2>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {filtered.length} of {transactions.length} records
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Live ledger with category and payment channel tracking
              </p>
            </div>
          </div>

          {/* Action Header: Export PDF Button & Type Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Primary Clearly Visible Export PDF Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              disabled={transactions.length === 0}
              title="Export complete or filtered transaction history as PDF"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-40"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-300" />
              <span>Export PDF</span>
            </button>

            {/* Type Filter Buttons */}
            <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl text-xs font-semibold border border-slate-200/60">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === 'income'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                Income (+)
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === 'expense'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                Expenses (-)
              </button>
            </div>
          </div>
        </div>

        {/* ── Date Filter Preset Tabs ──────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs font-medium">
          <span className="px-2 text-slate-400 font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <Clock className="w-3 h-3 text-slate-400" />
            Period:
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDateFilter(item.id)}
              className={`px-3 py-1 rounded-lg transition-all text-xs font-semibold cursor-pointer ${
                dateFilter === item.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ── Custom Date Pickers (Shown if Custom Range selected) ── */}
        {dateFilter === 'custom' && (
          <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 flex flex-wrap items-center gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-700">Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-medium">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-medium">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Clear Range
              </button>
            )}
          </div>
        )}

        {/* ── Search, Category & Payment Method Controls ───────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, category, payment method or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800 placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800 font-medium cursor-pointer"
            >
              <option value="all">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800 font-medium cursor-pointer"
            >
              <option value="all">All Methods</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button if active */}
          <div className="sm:col-span-1 flex items-center">
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="w-full py-2 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-center cursor-pointer"
                title="Clear all filters"
              >
                Reset
              </button>
            ) : (
              <div className="hidden sm:flex items-center justify-center w-full text-slate-300">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Grouped Transaction History ──────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-700">No transactions found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            {transactions.length === 0
              ? 'Your transaction register is empty. Click "Add Transaction" to record your first entry.'
              : 'No entries match your date range or filter criteria. Try choosing "All Time" or resetting filters.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {groupedTransactions.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              {/* Date Group Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    {group.label}
                    {group.label !== 'Today' && group.label !== 'Yesterday' && (
                      <span className="text-[11px] font-normal text-slate-400">
                        ({group.fullDate.toLocaleDateString('en-IN', { weekday: 'short' })})
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {group.items.length}
                  </span>
                </div>

                {/* Day Net Summary */}
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                  {group.dayTotalIncome > 0 && (
                    <span className="text-emerald-600 font-bold">
                      +{formatINR(group.dayTotalIncome)}
                    </span>
                  )}
                  {group.dayTotalExpense > 0 && (
                    <span className="text-rose-600 font-bold">
                      -{formatINR(group.dayTotalExpense)}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions in this Date Group */}
              <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {group.items.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const txDate = new Date(tx.date || tx.createdAt);
                      const formattedTime = txDate.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const paymentMethod = tx.paymentMethod || 'Other';
                      const badgeStyle = getPaymentBadge(paymentMethod);

                      return (
                        <tr
                          key={tx._id}
                          className="group hover:bg-slate-50/80 transition-colors duration-150"
                        >
                          {/* Title + Icon */}
                          <td className="py-2.5 pl-1 max-w-[260px]">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                                  isIncome
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/70'
                                    : 'bg-rose-50 text-rose-600 border border-rose-200/70'
                                }`}
                              >
                                {isIncome ? (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                                  {tx.title}
                                </p>
                                {tx.note && (
                                  <p className="text-[11px] text-slate-500 truncate max-w-xs font-normal">
                                    {tx.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category Tag */}
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100/90 text-slate-700">
                              <Tag className="w-3 h-3 text-slate-400" />
                              {tx.category || 'General'}
                            </span>
                          </td>

                          {/* Payment Method Badge */}
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeStyle}`}
                            >
                              <CreditCard className="w-2.5 h-2.5 opacity-70" />
                              {paymentMethod}
                            </span>
                          </td>

                          {/* Time */}
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium whitespace-nowrap">
                              <Clock className="w-3 h-3 text-slate-300" />
                              {formattedTime}
                            </span>
                          </td>

                          {/* Formatted INR Amount */}
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`font-extrabold text-sm whitespace-nowrap font-sans ${
                                isIncome ? 'text-emerald-600' : 'text-slate-900'
                              }`}
                            >
                              {isIncome ? '+' : '-'}
                              {formatINR(tx.amount)}
                            </span>
                          </td>

                          {/* Delete Action */}
                          <td className="py-2.5 pr-1 text-right">
                            <button
                              onClick={() => onDeleteTransaction && onDeleteTransaction(tx._id)}
                              disabled={isDeletingId === tx._id}
                              title="Delete transaction"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Export PDF Modal ─────────────────────────────────────── */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allTransactions={transactions}
        filteredTransactions={filtered}
        currentFilterLabel={currentFilterLabel}
        filterDetails={filterDetailsText}
        user={user}
      />
    </div>
  );
}
