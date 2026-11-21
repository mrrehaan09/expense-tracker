import { useState, useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { formatINR, getPaymentBadge } from '../utils/formatters';
import ExportPdfModal from '../components/ExportPdfModal';
import AddTransactionModal from '../components/AddTransactionModal';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  FileDown,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Tag,
  CreditCard,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Gold', hex: '#D4AF72' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Sky', hex: '#0ea5e9' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Teal', hex: '#14b8a6' },
];

export default function GroupsPage() {
  const {
    groups = [],
    transactions = [],
    user,
    createGroup,
    updateGroup,
    deleteGroup,
    updateTransactionGroup,
    deleteTransaction,
  } = useExpenses();

  // Active view & modals state
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  // Group Form state
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupColor, setGroupColor] = useState(PRESET_COLORS[0].hex);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Add Transaction Modal to specific group
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [targetGroupIdForTx, setTargetGroupIdForTx] = useState('');

  // Export PDF Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTargetGroup, setExportTargetGroup] = useState('all');

  // Transaction reassign state
  const [reassigningTxId, setReassigningTxId] = useState(null);
  const [deletingTxId, setDeletingTxId] = useState(null);

  // Global KPI calculations for groups
  const { totalGroupExpense, totalGroupIncome, totalGroupCount, totalGroupNet } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    let count = 0;

    groups.forEach((g) => {
      exp += Number(g.totalExpense) || 0;
      inc += Number(g.totalIncome) || 0;
      count += Number(g.transactionCount) || 0;
    });

    return {
      totalGroupExpense: exp,
      totalGroupIncome: inc,
      totalGroupCount: count,
      totalGroupNet: inc - exp,
    };
  }, [groups]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingGroup(null);
    setGroupTitle('');
    setGroupDescription('');
    setGroupColor(PRESET_COLORS[0].hex);
    setFormError('');
    setIsGroupModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (group, e) => {
    if (e) e.stopPropagation();
    setEditingGroup(group);
    setGroupTitle(group.title || '');
    setGroupDescription(group.description || '');
    setGroupColor(group.color || PRESET_COLORS[0].hex);
    setFormError('');
    setIsGroupModalOpen(true);
  };

  // Handle Create / Edit Submit
  const handleGroupFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!groupTitle.trim()) {
      return setFormError('Group title is required');
    }

    setFormLoading(true);
    try {
      if (editingGroup) {
        const res = await updateGroup(editingGroup._id, {
          title: groupTitle.trim(),
          description: groupDescription.trim(),
          color: groupColor,
        });
        if (!res.success) {
          return setFormError(res.message || 'Failed to update group');
        }
      } else {
        const res = await createGroup({
          title: groupTitle.trim(),
          description: groupDescription.trim(),
          color: groupColor,
        });
        if (!res.success) {
          return setFormError(res.message || 'Failed to create group');
        }
      }

      setIsGroupModalOpen(false);
      setEditingGroup(null);
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete Group
  const handleDeleteGroup = async (group, e) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(
      `Delete expense group "${group.title}"?\n\nNOTE: All ${
        group.transactionCount || 0
      } associated transactions will NOT be deleted. They will automatically be moved to your Personal Expenses.`
    );

    if (!confirmed) return;

    try {
      const res = await deleteGroup(group._id);
      if (!res.success) {
        alert(res.message || 'Failed to delete group');
      } else {
        if (selectedGroupId === group._id) {
          setSelectedGroupId(null);
        }
      }
    } catch (err) {
      alert(err.message || 'Error deleting group');
    }
  };

  // Trigger PDF Export for Group
  const handleExportGroup = (groupId, e) => {
    if (e) e.stopPropagation();
    setExportTargetGroup(groupId);
    setIsExportModalOpen(true);
  };

  // Open Add Transaction targeting group
  const handleAddTxToGroup = (groupId, e) => {
    if (e) e.stopPropagation();
    setTargetGroupIdForTx(groupId);
    setIsAddTxModalOpen(true);
  };

  // Reassign or Remove Transaction from Group
  const handleReassignTx = async (txId, newGroupId) => {
    setReassigningTxId(txId);
    try {
      const res = await updateTransactionGroup(txId, newGroupId || null);
      if (!res.success) {
        alert(res.message || 'Failed to reassign transaction');
      }
    } catch (err) {
      alert(err.message || 'Error updating transaction group');
    } finally {
      setReassigningTxId(null);
    }
  };

  // Delete single transaction
  const handleDeleteTx = async (txId) => {
    if (!window.confirm('Delete this transaction record?')) return;
    setDeletingTxId(txId);
    try {
      const res = await deleteTransaction(txId);
      if (!res.success) alert(res.message || 'Failed to delete transaction');
    } catch (err) {
      alert(err.message || 'Error deleting transaction');
    } finally {
      setDeletingTxId(null);
    }
  };

  // Transactions for the currently selected group
  const activeGroup = groups.find((g) => g._id === selectedGroupId) || null;
  const activeGroupTransactions = useMemo(() => {
    if (!selectedGroupId) return [];
    return transactions.filter(
      (tx) => (tx.group?._id || (typeof tx.group === 'string' ? tx.group : null)) === selectedGroupId
    );
  }, [transactions, selectedGroupId]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── KPI Summary Ribbon ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        {/* Total Groups */}
        <div className="p-4 sm:p-5 bg-[#17171B] rounded-2xl border border-[#302B25] shadow-xs minimal-card">
          <span className="block text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider">
            Total Groups
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#F5F1E8] mt-1 tracking-tight font-sans">
            {groups.length}
          </div>
          <span className="text-[11px] text-[#A6A19A] font-medium block mt-0.5">
            {totalGroupCount} total transactions
          </span>
        </div>

        {/* Total Group Expenses */}
        <div className="p-4 sm:p-5 bg-[#17171B] rounded-2xl border border-[#302B25] shadow-xs minimal-card">
          <span className="block text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider">
            Total Group Spend
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#E05263] mt-1 tracking-tight font-sans">
            -{formatINR(totalGroupExpense)}
          </div>
          <span className="text-[11px] text-[#E05263]/80 font-medium block mt-0.5">
            Outflow across all groups
          </span>
        </div>

        {/* Total Group Inflow */}
        <div className="p-4 sm:p-5 bg-[#17171B] rounded-2xl border border-[#302B25] shadow-xs minimal-card">
          <span className="block text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider">
            Total Group Inflow
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#2EB872] mt-1 tracking-tight font-sans">
            +{formatINR(totalGroupIncome)}
          </div>
          <span className="text-[11px] text-[#2EB872]/80 font-medium block mt-0.5">
            Shared contributions
          </span>
        </div>

        {/* Net Balance */}
        <div className="p-4 sm:p-5 bg-[#17171B] rounded-2xl border border-[#302B25] shadow-xs minimal-card">
          <span className="block text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider">
            Net Group Balance
          </span>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 tracking-tight font-sans ${
              totalGroupNet >= 0 ? 'text-[#2EB872]' : 'text-[#E05263]'
            }`}
          >
            {formatINR(totalGroupNet)}
          </div>
          <span className="text-[11px] text-[#A6A19A] font-medium block mt-0.5">
            Aggregate net balance
          </span>
        </div>
      </div>

      {/* ── Main Section Card ─────────────────────────────────────────── */}
      <div className="bg-[#17171B] rounded-2xl border border-[#302B25] p-5 sm:p-6 shadow-xs minimal-card space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#302B25]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF72]/15 text-[#D4AF72] flex items-center justify-center border border-[#D4AF72]/30 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#F5F1E8]">Expense Groups</h2>
            </div>
            <p className="text-xs text-[#A6A19A] mt-0.5">
              Organize trips, parties, and events with isolated ledgers without splitting accounts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            {groups.length > 0 && (
              <button
                type="button"
                onClick={() => handleExportGroup('all')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E1E23] hover:bg-[#25252B] active:bg-[#1E1E23] text-[#F5F1E8] text-xs font-semibold rounded-xl transition cursor-pointer border border-[#302B25] hover:border-[#D4AF72]/40 shrink-0 shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5 text-[#D4AF72]" />
                <span>Export PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4AF72] hover:bg-[#E0C28A] active:bg-[#B89455] text-[#0B0B0D] text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </button>
          </div>
        </div>

        {/* ── Empty State ─────────────────────────────────────────────── */}
        {groups.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-[#302B25] rounded-2xl bg-[#131316]/50">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF72]/15 text-[#D4AF72] flex items-center justify-center mx-auto mb-3 border border-[#D4AF72]/30">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F1E8] mb-1">No Expense Groups Created Yet</h3>
            <p className="text-xs text-[#A6A19A] max-w-sm mx-auto mb-4 leading-relaxed">
              Create a group for your next trip, dinner party, or project to keep its expenses neatly
              isolated from your personal ledger.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF72] hover:bg-[#E0C28A] text-[#0B0B0D] text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Group</span>
            </button>
          </div>
        ) : (
          /* ── Groups Cards Grid (Aligned Baseline) ─────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
            {groups.map((group) => {
              const isSelected = selectedGroupId === group._id;
              const color = group.color || '#D4AF72';

              return (
                <div
                  key={group._id}
                  onClick={() => setSelectedGroupId(isSelected ? null : group._id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-full ${
                    isSelected
                      ? 'bg-[#1E1E23] border-[#D4AF72] ring-1 ring-[#D4AF72]/40 shadow-md'
                      : 'bg-[#17171B] hover:bg-[#1C1C22] border-[#302B25] shadow-xs hover:border-[#453E35]'
                  }`}
                >
                  {/* Top Color Accent Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                    style={{ backgroundColor: color }}
                  />

                  {/* Card Header & Content */}
                  <div>
                    <div className="flex items-start justify-between gap-3 pt-1 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: color }}
                        />
                        <h3 className="font-bold text-sm sm:text-base text-[#F5F1E8] truncate">
                          {group.title}
                        </h3>
                      </div>

                      {/* Action Menu Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleExportGroup(group._id, e)}
                          title="Export PDF Statement for this group"
                          className="p-1.5 text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] rounded-lg transition-colors cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openEditModal(group, e)}
                          title="Edit Group"
                          className="p-1.5 text-[#A6A19A] hover:text-[#D4AF72] hover:bg-[#D4AF72]/15 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteGroup(group, e)}
                          title="Delete Group"
                          className="p-1.5 text-[#A6A19A] hover:text-[#E05263] hover:bg-[#E05263]/15 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Group Description - Consistent Height for baseline alignment */}
                    <p className="text-xs text-[#A6A19A] line-clamp-2 min-h-[36px] mb-4 leading-relaxed">
                      {group.description || (
                        <span className="italic text-[#6B665F]">No description provided</span>
                      )}
                    </p>
                  </div>

                  {/* Group Metrics */}
                  <div className="space-y-3 pt-3 border-t border-[#302B25]">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-[#A6A19A] uppercase tracking-wider block">
                          Expenses
                        </span>
                        <span className="font-extrabold text-[#E05263] text-sm font-sans">
                          -{formatINR(group.totalExpense || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#A6A19A] uppercase tracking-wider block">
                          Inflow
                        </span>
                        <span className="font-extrabold text-[#2EB872] text-sm font-sans">
                          +{formatINR(group.totalIncome || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#302B25]/60">
                      <span className="text-[11px] font-bold text-[#A6A19A]">
                        {group.transactionCount || 0} transaction{group.transactionCount === 1 ? '' : 's'}
                      </span>
                      <span
                        className={`text-xs font-black font-sans ${
                          (group.netBalance || 0) >= 0 ? 'text-[#2EB872]' : 'text-[#E05263]'
                        }`}
                      >
                        Net: {formatINR(group.netBalance || 0)}
                      </span>
                    </div>

                    {/* Card Footer Buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleAddTxToGroup(group._id, e)}
                        className="flex-1 py-1.5 px-2 bg-[#D4AF72]/15 hover:bg-[#D4AF72]/25 text-[#D4AF72] border border-[#D4AF72]/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Expense</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroupId(isSelected ? null : group._id);
                        }}
                        className={`py-1.5 px-3 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-[#D4AF72] text-[#0B0B0D]'
                            : 'bg-[#1E1E23] text-[#F5F1E8] hover:bg-[#25252B] border border-[#302B25]'
                        }`}
                      >
                        <span>{isSelected ? 'Hide Ledger' : 'Ledger'}</span>
                        {isSelected ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Active Group Transaction Ledger ───────────────────────── */}
        {activeGroup && (
          <div className="mt-6 pt-6 border-t border-[#302B25] space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131316] p-4 rounded-2xl border border-[#302B25]">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: activeGroup.color || '#D4AF72' }}
                />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#F5F1E8]">
                    Ledger: {activeGroup.title}
                  </h3>
                  <p className="text-xs text-[#A6A19A]">
                    Showing {activeGroupTransactions.length} transaction(s) recorded in this group
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportGroup(activeGroup._id)}
                  className="px-3 py-1.5 bg-[#1E1E23] border border-[#302B25] hover:border-[#D4AF72]/40 text-[#F5F1E8] text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#D4AF72]" />
                  <span>Export Group PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTxToGroup(activeGroup._id)}
                  className="px-3.5 py-1.5 bg-[#D4AF72] hover:bg-[#E0C28A] text-[#0B0B0D] text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Transaction</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGroupId(null)}
                  className="p-1.5 text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] rounded-lg transition"
                  title="Close ledger"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table of Group Transactions */}
            {activeGroupTransactions.length === 0 ? (
              <div className="text-center py-8 px-4 bg-[#131316]/50 rounded-2xl border border-dashed border-[#302B25]">
                <p className="text-xs font-semibold text-[#A6A19A] mb-2">
                  No transactions have been added to &ldquo;{activeGroup.title}&rdquo; yet.
                </p>
                <button
                  onClick={() => handleAddTxToGroup(activeGroup._id)}
                  className="text-xs font-bold text-[#D4AF72] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add first expense to this group
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#302B25]">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead className="bg-[#101013] text-[#A6A19A] text-[11px] font-bold uppercase tracking-wider border-b border-[#302B25]">
                    <tr>
                      <th className="py-3 px-4">Transaction</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Payment</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#302B25]/60 text-sm bg-[#17171B]">
                    {activeGroupTransactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const txDate = new Date(tx.date || tx.createdAt);
                      const formattedDate = txDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });

                      return (
                        <tr
                          key={tx._id}
                          className="hover:bg-[#1E1E23]/60 transition-colors duration-150"
                        >
                          {/* Title & Icon */}
                          <td className="py-3 px-4 max-w-[240px]">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isIncome
                                    ? 'bg-[#2EB872]/15 text-[#2EB872] border border-[#2EB872]/30'
                                    : 'bg-[#E05263]/15 text-[#E05263] border border-[#E05263]/30'
                                }`}
                              >
                                {isIncome ? (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[#F5F1E8] truncate text-xs sm:text-sm">
                                  {tx.title}
                                </p>
                                {tx.note && (
                                  <p className="text-[11px] text-[#A6A19A] truncate font-normal">
                                    {tx.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-xs text-[#A6A19A] whitespace-nowrap">
                              <Calendar className="w-3 h-3 text-[#6B665F]" />
                              {formattedDate}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#1E1E23] text-[#A6A19A] border border-[#302B25]">
                              <Tag className="w-3 h-3 text-[#6B665F]" />
                              {tx.category || 'General'}
                            </span>
                          </td>

                          {/* Payment Method */}
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${getPaymentBadge(tx.paymentMethod)}`}>
                              <CreditCard className="w-3 h-3 opacity-80" />
                              <span>{tx.paymentMethod || 'Other'}</span>
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`font-black text-sm whitespace-nowrap font-sans ${
                                isIncome ? 'text-[#2EB872]' : 'text-[#F5F1E8]'
                              }`}
                            >
                              {isIncome ? '+' : '-'}
                              {formatINR(tx.amount)}
                            </span>
                          </td>

                          {/* Actions: Reassign Group / Delete */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Move to Personal */}
                              <button
                                type="button"
                                onClick={() => handleReassignTx(tx._id, null)}
                                disabled={reassigningTxId === tx._id}
                                title="Move to Personal Expenses (remove from this group)"
                                className="px-2 py-1 text-[10px] font-bold bg-[#1E1E23] hover:bg-[#25252B] text-[#A6A19A] hover:text-[#F5F1E8] border border-[#302B25] rounded-md transition cursor-pointer disabled:opacity-40"
                              >
                                {reassigningTxId === tx._id ? 'Moving...' : 'Move to Personal'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteTx(tx._id)}
                                disabled={deletingTxId === tx._id}
                                title="Delete transaction"
                                className="p-1.5 text-[#A6A19A] hover:text-[#E05263] hover:bg-[#E05263]/15 rounded-lg transition disabled:opacity-40 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create / Edit Group Modal ───────────────────────────────── */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0B0B0D]/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsGroupModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#17171B] rounded-2xl shadow-2xl border border-[#302B25] overflow-hidden z-10 animate-fade-in-up">
            <div className="px-6 py-4 border-b border-[#302B25] flex items-center justify-between bg-[#101013]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF72]/15 text-[#D4AF72] flex items-center justify-center border border-[#D4AF72]/30">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-[#F5F1E8]">
                  {editingGroup ? 'Edit Group' : 'Create Expense Group'}
                </h3>
              </div>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1.5 rounded-lg text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGroupFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-2.5 bg-[#E05263]/15 border border-[#E05263]/30 text-[#E05263] text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#F5F1E8] mb-1.5">
                  Group Title *
                </label>
                <input
                  type="text"
                  required
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="e.g. Goa Trip 2026, Birthday Party, New Phone"
                  className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:border-[#D4AF72] focus:outline-none focus:ring-1 focus:ring-[#D4AF72]/20 transition text-[#F5F1E8] placeholder-[#6B665F] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#F5F1E8] mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Brief note about this event, trip, or goal..."
                  className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:border-[#D4AF72] focus:outline-none focus:ring-1 focus:ring-[#D4AF72]/20 transition text-[#F5F1E8] placeholder-[#6B665F] font-medium resize-none"
                />
              </div>

              {/* Color Palette Selector */}
              <div>
                <label className="block text-xs font-bold text-[#F5F1E8] mb-2">
                  Theme Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => {
                    const isSelected = groupColor === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setGroupColor(c.hex)}
                        title={c.name}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          isSelected ? 'scale-125 ring-2 ring-[#D4AF72] ring-offset-2 ring-offset-[#17171B]' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#302B25]">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#A6A19A] hover:bg-[#1E1E23] hover:text-[#F5F1E8] rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-xs font-bold text-[#0B0B0D] bg-[#D4AF72] hover:bg-[#E0C28A] rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {formLoading
                    ? 'Saving...'
                    : editingGroup
                    ? 'Update Group'
                    : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Transaction Modal Targeting This Group ─────────────── */}
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        defaultGroupId={targetGroupIdForTx}
      />

      {/* ── Export PDF Modal Targeting Groups ───────────────────────── */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allTransactions={transactions}
        groups={groups}
        user={user}
        defaultPreset="all"
        initialGroup={exportTargetGroup}
      />
    </div>
  );
}
