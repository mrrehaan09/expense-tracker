import { useState, useMemo, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import ExportPdfModal from '../components/ExportPdfModal';
import { TableRowSkeleton } from '../components/LoadingSkeleton';
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
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  formatINR,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  INCOME_CATEGORIES,
  getPaymentBadge,
} from '../utils/formatters';

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const getEndOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const PAGE_SIZE = 15;

export default function TransactionsPage() {
  const {
    user,
    loading,
    transactions,
    groups,
    deleteTransaction,
    updateTransactionGroup,
    setIsModalOpen,
  } = useExpenses();

  const [deletingId, setDeletingId] = useState(null);
  const [reassigningId, setReassigningId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filters State
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'income'
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all'); // 'all' | 'personal' | groupId
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [search, setSearch] = useState('');

  // Date Filter State: 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const allCategories = Array.from(
    new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])
  );

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, selectedGroupFilter, selectedCategory, selectedPaymentMethod, search, dateFilter, customStartDate, customEndDate]);

  // Filter logic
  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = getStartOfDay(yesterday);
    const yesterdayEnd = getEndOfDay(yesterday);

    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - diffToMonday);
    const thisWeekStart = getStartOfDay(weekStart);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    return transactions.filter((tx) => {
      const matchesType = filterType === 'all' ? true : tx.type === filterType;
      const matchesGroup =
        selectedGroupFilter === 'all'
          ? true
          : selectedGroupFilter === 'personal'
          ? !tx.group
          : (tx.group?._id || (typeof tx.group === 'string' ? tx.group : null)) === selectedGroupFilter;
      const matchesCategory =
        selectedCategory === 'all' ? true : tx.category === selectedCategory;
      const matchesPayment =
        selectedPaymentMethod === 'all'
          ? true
          : (tx.paymentMethod || 'Other') === selectedPaymentMethod;

      const matchesSearch =
        tx.title.toLowerCase().includes(search.toLowerCase()) ||
        (tx.category && tx.category.toLowerCase().includes(search.toLowerCase())) ||
        (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(search.toLowerCase())) ||
        (tx.note && tx.note.toLowerCase().includes(search.toLowerCase()));

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

      return (
        matchesType &&
        matchesGroup &&
        matchesCategory &&
        matchesPayment &&
        matchesSearch &&
        matchesDate
      );
    });
  }, [
    transactions,
    filterType,
    selectedGroupFilter,
    selectedCategory,
    selectedPaymentMethod,
    search,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  // Current filter label for export
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

  // Filter description for PDF
  const filterDetailsText = useMemo(() => {
    const parts = [];
    if (filterType !== 'all') parts.push(`Type: ${filterType}`);
    if (selectedGroupFilter === 'personal') {
      parts.push('Group: Personal Only');
    } else if (selectedGroupFilter !== 'all') {
      const gObj = groups.find((g) => g._id === selectedGroupFilter);
      parts.push(`Group: ${gObj ? gObj.title : 'Selected Group'}`);
    }
    if (selectedCategory !== 'all') parts.push(`Category: ${selectedCategory}`);
    if (selectedPaymentMethod !== 'all') parts.push(`Payment: ${selectedPaymentMethod}`);
    if (search.trim()) parts.push(`Search: "${search.trim()}"`);
    return parts.join(' | ');
  }, [filterType, selectedGroupFilter, groups, selectedCategory, selectedPaymentMethod, search]);

  // Calculated summary for filtered items
  let filteredIncome = 0;
  let filteredExpense = 0;
  filtered.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') filteredIncome += amt;
    else filteredExpense += amt;
  });
  const filteredNet = filteredIncome - filteredExpense;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedTransactions = useMemo(() => {
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filtered, startIndex]);

  // Grouped by date (using the current page transactions for optimal rendering)
  const groupedTransactions = useMemo(() => {
    const map = new Map();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    paginatedTransactions.forEach((tx) => {
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

        if (isSameDay(txDate, now)) label = 'Today';
        else if (isSameDay(txDate, yesterday)) label = 'Yesterday';

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
      if (tx.type === 'income') group.dayTotalIncome += amt;
      else group.dayTotalExpense += amt;
    });

    return Array.from(map.values()).sort((a, b) => b.fullDate - a.fullDate);
  }, [paginatedTransactions]);

  // Clear filters
  const clearFilters = () => {
    setFilterType('all');
    setSelectedGroupFilter('all');
    setSelectedCategory('all');
    setSelectedPaymentMethod('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearch('');
  };

  const hasActiveFilters =
    filterType !== 'all' ||
    selectedGroupFilter !== 'all' ||
    selectedCategory !== 'all' ||
    selectedPaymentMethod !== 'all' ||
    dateFilter !== 'all' ||
    customStartDate !== '' ||
    customEndDate !== '' ||
    search.trim() !== '';

  const handleReassignGroup = async (txId, newGroupId) => {
    setReassigningId(txId);
    try {
      const res = await updateTransactionGroup(txId, newGroupId || null);
      if (!res.success) {
        alert(res.message || 'Failed to update transaction group');
      }
    } catch (err) {
      alert(err.message || 'Error updating transaction group');
    } finally {
      setReassigningId(null);
    }
  };

  // Synchronize active date filter state with Export PDF modal
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction record?')) return;
    setDeletingId(id);
    const res = await deleteTransaction(id);
    if (!res.success) {
      alert(res.message);
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Metrics Ribbon ─────────────────────────────────── */}
      <div className="animate-section-1 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-[#17171B] rounded-2xl border border-[#302B25] shadow-xs minimal-card">
          <span className="block text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider">
            Total Records
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#F5F1E8] tracking-tight font-sans mt-1">
            {filtered.length}{' '}
            <span className="text-xs font-normal text-[#A6A19A]">
              / {transactions.length}
            </span>
          </div>
          <span className="text-[11px] text-[#A6A19A] font-medium block mt-0.5">
            Matching active filters
          </span>
        </div>

        <div className="p-4 sm:p-5 bg-[#17171B] rounded-2xl border border-[#302B25] shadow-xs minimal-card">
          <span className="block text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider">
            Filtered Income
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#2EB872] tracking-tight font-sans mt-1">
            +{formatINR(filteredIncome)}
          </div>
          <span className="text-[11px] text-[#2EB872]/80 font-medium block mt-0.5">
            Total incoming funds
          </span>
        </div>

        <div className="p-4 sm:p-5 bg-[#17171B] rounded-2xl border border-[#302B25] shadow-xs minimal-card">
          <span className="block text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider">
            Filtered Expenses
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#E05263] tracking-tight font-sans mt-1">
            -{formatINR(filteredExpense)}
          </div>
          <span className="text-[11px] text-[#E05263]/80 font-medium block mt-0.5">
            Total outgoing spend
          </span>
        </div>

        <div className="p-4 sm:p-5 bg-[#17171B] rounded-2xl border border-[#302B25] shadow-xs minimal-card">
          <span className="block text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider">
            Filtered Net Flow
          </span>
          <div
            className={`text-xl sm:text-2xl font-black tracking-tight font-sans mt-1 ${
              filteredNet >= 0 ? 'text-[#F5F1E8]' : 'text-[#E05263]'
            }`}
          >
            {formatINR(filteredNet)}
          </div>
          <span className="text-[11px] text-[#A6A19A] font-medium block mt-0.5">
            Retained cash flow
          </span>
        </div>
      </div>

      {/* ── Main Ledger Card ───────────────────────────────────────── */}
      <div className="animate-section-2 bg-[#17171B] rounded-2xl border border-[#302B25] p-5 sm:p-6 shadow-xs minimal-card space-y-5">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#302B25]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF72]/15 text-[#D4AF72] flex items-center justify-center border border-[#D4AF72]/30 shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#F5F1E8] truncate">
                Transaction Register
              </h2>
              <p className="text-xs text-[#A6A19A] truncate">
                Manage, filter and export your complete transaction ledger
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              disabled={transactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E1E23] hover:bg-[#25252B] active:bg-[#1E1E23] border border-[#302B25] hover:border-[#D4AF72]/40 text-[#F5F1E8] text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-40 shrink-0 whitespace-nowrap shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5 text-[#D4AF72]" />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4AF72] hover:bg-[#E0C28A] active:bg-[#B89455] text-[#0B0B0D] text-xs font-bold rounded-xl transition cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="space-y-3 pt-1">
          {/* Preset Timeframe Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#131316] rounded-xl border border-[#302B25] text-xs font-medium">
            <span className="px-2 text-[#A6A19A] font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider shrink-0">
              <Clock className="w-3 h-3 text-[#D4AF72]" />
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

          {/* Custom Date Range */}
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

          {/* Search, Type, Group, Category, Payment Grid (Responsive 12-col) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Search Box */}
            <div className="sm:col-span-4 lg:col-span-3 relative">
              <Search className="w-4 h-4 text-[#6B665F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:bg-[#17171B] focus:outline-none focus:border-[#D4AF72]/60 focus:ring-1 focus:ring-[#D4AF72]/30 transition text-[#F5F1E8] placeholder:text-[#6B665F] font-medium"
              />
            </div>

            {/* Type Filter */}
            <div className="sm:col-span-3 lg:col-span-2 inline-flex items-center bg-[#131316] p-1 rounded-xl text-xs font-semibold border border-[#302B25]">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#1E1E23] text-[#F5F1E8] border border-[#302B25] shadow-xs'
                    : 'text-[#A6A19A] hover:text-[#F5F1E8]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  filterType === 'income'
                    ? 'bg-[#2EB872]/15 text-[#2EB872] border border-[#2EB872]/30 shadow-xs'
                    : 'text-[#A6A19A] hover:text-[#2EB872]'
                }`}
              >
                In
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  filterType === 'expense'
                    ? 'bg-[#E05263]/15 text-[#E05263] border border-[#E05263]/30 shadow-xs'
                    : 'text-[#A6A19A] hover:text-[#E05263]'
                }`}
              >
                Out
              </button>
            </div>

            {/* Group Filter Dropdown */}
            <div className="sm:col-span-2 lg:col-span-2">
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:bg-[#17171B] focus:outline-none focus:border-[#D4AF72]/60 focus:ring-1 focus:ring-[#D4AF72]/30 transition text-[#F5F1E8] font-medium cursor-pointer"
              >
                <option value="all">All Groups</option>
                <option value="personal">Personal Only</option>
                {groups.length > 0 && (
                  <optgroup label="Expense Groups">
                    {groups.map((grp) => (
                      <option key={grp._id} value={grp._id} className="bg-[#17171B] text-[#F5F1E8]">
                        {grp.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="sm:col-span-3 lg:col-span-2">
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
            <div className="sm:col-span-3 lg:col-span-2">
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:bg-[#17171B] focus:outline-none focus:border-[#D4AF72]/60 focus:ring-1 focus:ring-[#D4AF72]/30 transition text-[#F5F1E8] font-medium cursor-pointer"
              >
                <option value="all">All Channels</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method} className="bg-[#17171B] text-[#F5F1E8]">
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-end">
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 px-2 text-[11px] font-bold text-[#D4AF72] bg-[#D4AF72]/10 hover:bg-[#D4AF72]/20 border border-[#D4AF72]/25 rounded-xl transition text-center cursor-pointer whitespace-nowrap shrink-0"
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
        </div>

        {/* ── Transactions Table List ─────────────────────────────────── */}
        <div className="pt-2">
          {loading ? (
            <div className="space-y-3">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[#302B25] rounded-2xl bg-[#131316]/50">
              <Receipt className="w-8 h-8 text-[#6B665F] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#F5F1E8]">No records match your criteria</p>
              <p className="text-[11px] text-[#A6A19A] max-w-xs mx-auto mt-1">
                Try modifying your search keywords, period, category, or payment method filters.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#D4AF72] bg-[#D4AF72]/10 hover:bg-[#D4AF72]/20 border border-[#D4AF72]/25 rounded-lg transition cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-[#302B25]">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead>
                    <tr className="bg-[#131316] text-[#A6A19A] border-b border-[#302B25] text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Transaction / Group</th>
                      <th className="py-3 px-4 hidden md:table-cell">Category</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Payment Channel</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-3 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#302B25]/60 text-xs">
                    {groupedTransactions.map((group) => (
                      <tr key={`group-${group.dateKey}`} className="contents">
                        {/* Date Group Subheader */}
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

                        {/* Grouped Transactions Rows */}
                        {group.items.map((tx) => {
                          const isIncome = tx.type === 'income';

                          return (
                            <tr
                              key={tx._id}
                              className="hover:bg-[#1E1E23]/60 transition-colors group"
                            >
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
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      {tx.note && (
                                        <span className="text-[11px] text-[#A6A19A] truncate max-w-[200px]">
                                          {tx.note}
                                        </span>
                                      )}

                                      {/* Group Badge & Reassign Dropdown */}
                                      <div className="flex items-center gap-1">
                                        {tx.group ? (
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
                                        ) : (
                                          <span className="text-[10px] text-[#6B665F]">Personal</span>
                                        )}

                                        {/* Quick group reassignment select */}
                                        <select
                                          value={tx.group?._id || ''}
                                          onChange={(e) => handleReassignGroup(tx._id, e.target.value)}
                                          disabled={reassigningId === tx._id}
                                          title="Change group assignment"
                                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-[#1E1E23] border border-[#302B25] rounded px-1 py-0.5 text-[#A6A19A] hover:text-[#F5F1E8] cursor-pointer"
                                        >
                                          <option value="">Move to Personal</option>
                                          {groups.map((g) => (
                                            <option key={g._id} value={g._id} className="bg-[#17171B] text-[#F5F1E8]">
                                              Assign: {g.title}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 hidden md:table-cell">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E1E23] text-[#F5F1E8] border border-[#302B25] text-xs font-medium">
                                  <Tag className="w-3 h-3 text-[#D4AF72]" />
                                  {tx.category || 'General'}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 hidden sm:table-cell">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${getPaymentBadge(tx.paymentMethod)}`}>
                                  <CreditCard className="w-3 h-3 opacity-80" />
                                  <span>{tx.paymentMethod || 'Other'}</span>
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <span
                                  className={`font-black text-xs sm:text-sm font-sans tracking-tight ${
                                    isIncome ? 'text-[#2EB872]' : 'text-[#F5F1E8]'
                                  }`}
                                >
                                  {isIncome ? '+' : '-'}
                                  {formatINR(tx.amount)}
                                </span>
                              </td>

                              <td className="py-3.5 px-3 text-center">
                                <button
                                  onClick={() => handleDelete(tx._id)}
                                  disabled={deletingId === tx._id}
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

              {/* ── Polished Obsidian Gold Pagination Bar ──────────────── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-[#A6A19A]">
                <div>
                  Showing{' '}
                  <span className="font-bold text-[#F5F1E8]">{startIndex + 1}</span> to{' '}
                  <span className="font-bold text-[#F5F1E8]">
                    {Math.min(startIndex + PAGE_SIZE, filtered.length)}
                  </span>{' '}
                  of <span className="font-bold text-[#F5F1E8]">{filtered.length}</span> transactions
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5 self-center sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-2.5 py-1.5 bg-[#1E1E23] hover:bg-[#25252B] active:bg-[#1E1E23] text-[#F5F1E8] border border-[#302B25] rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                            safeCurrentPage === pageNum
                              ? 'bg-[#D4AF72] text-[#0B0B0D] shadow-xs'
                              : 'bg-[#131316] text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] border border-[#302B25]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-2.5 py-1.5 bg-[#1E1E23] hover:bg-[#25252B] active:bg-[#1E1E23] text-[#F5F1E8] border border-[#302B25] rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Global Export PDF Modal Connected with active filters ── */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allTransactions={transactions}
        groups={groups}
        user={user}
        defaultPreset={exportPreset}
        initialStartDate={exportStartDate}
        initialEndDate={exportEndDate}
        pageFilters={{
          type: filterType,
          category: selectedCategory,
          paymentMethod: selectedPaymentMethod,
          search: search,
          group: selectedGroupFilter,
        }}
        currentFilterLabel={currentFilterLabel}
        filterDetails={filterDetailsText}
      />
    </div>
  );
}
