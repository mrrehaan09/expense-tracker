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
  Users,
} from 'lucide-react';
import {
  formatINR,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  INCOME_CATEGORIES,
  getPaymentBadge,
} from '../utils/formatters';
import ExportPdfModal from './ExportPdfModal';

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

    // Current month: Start from 1st
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    return transactions.filter((tx) => {
      // Type filter
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // Category filter
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      // Payment method filter
      if (selectedPaymentMethod !== 'all' && (tx.paymentMethod || 'Other') !== selectedPaymentMethod) {
        return false;
      }

      // Text search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = tx.title?.toLowerCase().includes(query);
        const matchesCategory = tx.category?.toLowerCase().includes(query);
        const matchesPayment = tx.paymentMethod?.toLowerCase().includes(query);
        const matchesNote = tx.note?.toLowerCase().includes(query);
        const matchesGroup = tx.group?.title?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesPayment && !matchesNote && !matchesGroup) {
          return false;
        }
      }

      // Date filtering
      const txDate = new Date(tx.date || tx.createdAt);
      if (dateFilter === 'today') {
        return txDate >= todayStart && txDate <= todayEnd;
      }
      if (dateFilter === 'yesterday') {
        return txDate >= yesterdayStart && txDate <= yesterdayEnd;
      }
      if (dateFilter === 'this_week') {
        return txDate >= thisWeekStart && txDate <= todayEnd;
      }
      if (dateFilter === 'this_month') {
        return txDate >= thisMonthStart && txDate <= todayEnd;
      }
      if (dateFilter === 'custom') {
        if (customStartDate && customEndDate) {
          const start = getStartOfDay(new Date(customStartDate));
          const end = getEndOfDay(new Date(customEndDate));
          return txDate >= start && txDate <= end;
        }
        if (customStartDate) {
          const start = getStartOfDay(new Date(customStartDate));
          return txDate >= start;
        }
        if (customEndDate) {
          const end = getEndOfDay(new Date(customEndDate));
          return txDate <= end;
        }
      }

      return true;
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

  // 2. Synchronize active date filter state with Export PDF modal
  const { exportPreset, exportStartDate, exportEndDate } = useMemo(() => {
    const toDateStr = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (dateFilter === 'today') {
      const t = toDateStr(new Date());
      return { exportPreset: 'custom', exportStartDate: t, exportEndDate: t };
    }
    if (dateFilter === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = toDateStr(y);
      return { exportPreset: 'custom', exportStartDate: yStr, exportEndDate: yStr };
    }
    if (dateFilter === 'this_week') {
      return { exportPreset: 'this_week', exportStartDate: '', exportEndDate: '' };
    }
    if (dateFilter === 'this_month') {
      return { exportPreset: 'this_month', exportStartDate: '', exportEndDate: '' };
    }
    if (dateFilter === 'custom') {
      return {
        exportPreset: 'custom',
        exportStartDate: customStartDate,
        exportEndDate: customEndDate,
      };
    }
    return { exportPreset: 'all', exportStartDate: '', exportEndDate: '' };
  }, [dateFilter, customStartDate, customEndDate]);

  // 3. Clear all active filters
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

  // 4. Group transactions chronologically by date
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

  return (
    <div className="bg-[#17171B] rounded-2xl border border-[#302B25] p-5 sm:p-6 shadow-sm minimal-card space-y-5">
      {/* ── Header Row ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF72]/15 text-[#D4AF72] flex items-center justify-center border border-[#D4AF72]/30 shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#F5F1E8] tracking-tight">
                Recent Transactions
              </h2>
              <span className="text-[11px] font-semibold bg-[#1E1E23] text-[#A6A19A] border border-[#302B25] px-2 py-0.5 rounded-full shrink-0">
                {filtered.length} of {transactions.length} records
              </span>
            </div>
            <p className="text-xs text-[#A6A19A] truncate">
              Live ledger with category and payment channel tracking
            </p>
          </div>
        </div>

        {/* Action Header: Export PDF Button & Type Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start sm:self-auto shrink-0">
          {/* Primary Clearly Visible Export PDF Button */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            disabled={transactions.length === 0}
            title="Export complete or filtered transaction history as PDF"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-[#1E1E23] hover:bg-[#25252B] active:bg-[#1E1E23] text-[#F5F1E8] text-xs font-semibold rounded-xl transition cursor-pointer border border-[#302B25] hover:border-[#D4AF72]/40 disabled:opacity-40 shrink-0 whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5 text-[#D4AF72]" />
            <span>Export PDF</span>
          </button>

          {/* Type Filter Buttons */}
          <div className="inline-flex items-center bg-[#131316] p-1 rounded-xl text-xs font-semibold border border-[#302B25] shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#1E1E23] text-[#F5F1E8] border border-[#302B25] shadow-xs'
                  : 'text-[#A6A19A] hover:text-[#F5F1E8]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'income'
                  ? 'bg-[#2EB872]/15 text-[#2EB872] border border-[#2EB872]/30 shadow-xs'
                  : 'text-[#A6A19A] hover:text-[#2EB872]'
              }`}
            >
              Income (+)
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'expense'
                  ? 'bg-[#E05263]/15 text-[#E05263] border border-[#E05263]/30 shadow-xs'
                  : 'text-[#A6A19A] hover:text-[#E05263]'
              }`}
            >
              Expenses (-)
            </button>
          </div>
        </div>
      </div>

      {/* ── Date Filter Preset Tabs ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#131316] rounded-xl border border-[#302B25] text-xs font-medium">
        <span className="px-2 text-[#A6A19A] font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider shrink-0">
          <Clock className="w-3 h-3 text-[#A6A19A]" />
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
            className={`px-3 py-1 rounded-lg transition-all text-xs font-semibold cursor-pointer shrink-0 ${
              dateFilter === item.id
                ? 'bg-[#D4AF72]/15 text-[#D4AF72] border border-[#D4AF72]/30 font-bold shadow-xs'
                : 'text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] border border-transparent'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Custom Date Pickers (Shown if Custom Range selected) ── */}
      {dateFilter === 'custom' && (
        <div className="p-3 bg-[#131316] rounded-xl border border-[#302B25] flex flex-wrap items-center gap-3 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-[#D4AF72]" />
            <span className="font-bold text-[#F5F1E8]">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[#A6A19A] font-medium">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-[#1E1E23] border border-[#302B25] rounded-lg text-[#F5F1E8] text-xs font-medium focus:border-[#D4AF72] focus:ring-1 focus:ring-[#D4AF72]/30 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[#A6A19A] font-medium">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-[#1E1E23] border border-[#302B25] rounded-lg text-[#F5F1E8] text-xs font-medium focus:border-[#D4AF72] focus:ring-1 focus:ring-[#D4AF72]/30 outline-none"
            />
          </div>
          {(customStartDate || customEndDate) && (
            <button
              onClick={() => {
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-[11px] font-bold text-[#E05263] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear Range
            </button>
          )}
        </div>
      )}

      {/* ── Search, Category, Payment & Reset Controls (Responsive 12-col) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
        {/* Search Box */}
        <div className="sm:col-span-5 lg:col-span-5 relative">
          <Search className="w-4 h-4 text-[#6B665F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, category, payment method or note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:bg-[#17171B] focus:outline-none focus:border-[#D4AF72]/60 focus:ring-1 focus:ring-[#D4AF72]/30 transition text-[#F5F1E8] placeholder:text-[#6B665F] font-medium"
          />
        </div>

        {/* Category Dropdown */}
        <div className="sm:col-span-3 lg:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:bg-[#17171B] focus:outline-none focus:border-[#D4AF72]/60 focus:ring-1 focus:ring-[#D4AF72]/30 transition text-[#F5F1E8] font-medium cursor-pointer"
          >
            <option value="all">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat} className="bg-[#17171B] text-[#F5F1E8]">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Dropdown */}
        <div className="sm:col-span-2 lg:col-span-3">
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:bg-[#17171B] focus:outline-none focus:border-[#D4AF72]/60 focus:ring-1 focus:ring-[#D4AF72]/30 transition text-[#F5F1E8] font-medium cursor-pointer"
          >
            <option value="all">All Methods</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method} className="bg-[#17171B] text-[#F5F1E8]">
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* Reset button if active — robust col-span so it never clips */}
        <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-end">
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="w-full py-2 px-2 text-[11px] font-bold text-[#D4AF72] bg-[#D4AF72]/10 hover:bg-[#D4AF72]/20 border border-[#D4AF72]/25 rounded-xl transition-colors text-center cursor-pointer whitespace-nowrap shrink-0"
              title="Clear all filters"
            >
              Reset
            </button>
          ) : (
            <div className="hidden sm:flex items-center justify-center w-full text-[#6B665F]">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* ── Transaction List (Grouped by Date) ────────────────────── */}
      <div className="space-y-4 pt-1">
        {groupedTransactions.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-[#302B25] rounded-2xl bg-[#131316]/50">
            <div className="w-10 h-10 rounded-xl bg-[#1E1E23] text-[#A6A19A] border border-[#302B25] flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-5 h-5 text-[#D4AF72]" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F1E8]">
              No transactions match your criteria
            </h3>
            <p className="text-xs text-[#A6A19A] mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your period, category, or payment filters to view other transactions.'
                : 'Click "Add Transaction" above to record your first entry.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#D4AF72] bg-[#D4AF72]/10 hover:bg-[#D4AF72]/20 border border-[#D4AF72]/25 rounded-xl transition cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#302B25]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#131316] text-[#A6A19A] border-b border-[#302B25] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction</th>
                  <th className="py-3 px-4 hidden md:table-cell">Category</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302B25]/60 text-xs">
                {groupedTransactions.map((group) => (
                  <tr key={`group-${group.dateKey}`} className="contents">
                    {/* Date Subheader Row */}
                    <td colSpan={5} className="bg-[#131316]/90 px-4 py-2 border-y border-[#302B25]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#A6A19A]">
                        <span className="flex items-center gap-1.5 text-[#F5F1E8]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF72]" />
                          <span>{group.label}</span>
                          <span className="text-[#6B665F] font-normal">
                            ({group.fullDate.toLocaleDateString('en-IN', { weekday: 'short' })})
                          </span>
                        </span>
                        <div className="flex items-center gap-3">
                          {group.dayTotalIncome > 0 && (
                            <span className="text-[#2EB872]">
                              +{formatINR(group.dayTotalIncome)}
                            </span>
                          )}
                          {group.dayTotalExpense > 0 && (
                            <span className="text-[#E05263]">
                              -{formatINR(group.dayTotalExpense)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Group Transactions */}
                    {group.items.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const badgeClasses = getPaymentBadge(tx.paymentMethod);

                      return (
                        <tr
                          key={tx._id}
                          className="hover:bg-[#1E1E23]/60 transition-colors group"
                        >
                          {/* Title & Group */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isIncome
                                    ? 'bg-[#2EB872]/10 text-[#2EB872] border-[#2EB872]/25'
                                    : 'bg-[#E05263]/10 text-[#E05263] border-[#E05263]/25'
                                }`}
                              >
                                {isIncome ? (
                                  <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                  <ArrowDownLeft className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[#F5F1E8] truncate text-xs sm:text-sm">
                                  {tx.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {tx.note && (
                                    <span className="text-[11px] text-[#A6A19A] truncate max-w-[200px]">
                                      {tx.note}
                                    </span>
                                  )}
                                  {tx.group && (
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border"
                                      style={{
                                        backgroundColor: tx.group.color ? `${tx.group.color}15` : '#D4AF7215',
                                        color: tx.group.color || '#D4AF72',
                                        borderColor: tx.group.color ? `${tx.group.color}35` : '#D4AF7235',
                                      }}
                                    >
                                      <Users className="w-2.5 h-2.5" />
                                      {tx.group.title}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4 hidden md:table-cell">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E1E23] text-[#F5F1E8] border border-[#302B25] text-xs font-medium">
                              <Tag className="w-3 h-3 text-[#D4AF72]" />
                              {tx.category || 'General'}
                            </span>
                          </td>

                          {/* Payment Method */}
                          <td className="py-3.5 px-4 hidden sm:table-cell">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${badgeClasses}`}
                            >
                              <CreditCard className="w-3 h-3 opacity-80" />
                              {tx.paymentMethod || 'Other'}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`text-xs sm:text-sm font-black font-sans tracking-tight ${
                                isIncome ? 'text-[#2EB872]' : 'text-[#F5F1E8]'
                              }`}
                            >
                              {isIncome ? '+' : '-'}
                              {formatINR(tx.amount)}
                            </span>
                          </td>

                          {/* Action Button (Delete) */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => onDeleteTransaction && onDeleteTransaction(tx._id)}
                              disabled={isDeletingId === tx._id}
                              title="Delete transaction"
                              className="p-1.5 text-[#6B665F] hover:text-[#E05263] hover:bg-[#E05263]/10 rounded-lg transition-colors border border-transparent hover:border-[#E05263]/25 disabled:opacity-40 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Internal Export PDF Modal Trigger ────────────────────────── */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allTransactions={transactions}
        defaultPreset={exportPreset}
        initialStartDate={exportStartDate}
        initialEndDate={exportEndDate}
        user={user}
      />
    </div>
  );
}
