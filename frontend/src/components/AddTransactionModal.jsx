import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import {
  X,
  Plus,
  AlertCircle,
  IndianRupee,
  Tag,
  CreditCard,
  Calendar,
  FileText,
  Users,
  Check,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  INCOME_CATEGORIES,
} from '../utils/formatters';
import { useExpenses } from '../context/ExpenseContext';

const PRESET_COLORS = [
  '#D4AF72', // Gold
  '#6366f1', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#f43f5e', // Rose
  '#14b8a6', // Teal
];

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  defaultGroupId = '',
}) {
  const { groups = [], createGroup, fetchGroups } = useExpenses();
  const todayStr = new Date().toISOString().split('T')[0];

  const [type, setType] = useState('expense'); // 'expense' | 'income'
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]); // 'Cash'
  const [date, setDate] = useState(todayStr);
  const [note, setNote] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(defaultGroupId || '');

  // Inline group creation state
  const [showInlineGroupCreate, setShowInlineGroupCreate] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(PRESET_COLORS[0]);
  const [groupCreateLoading, setGroupCreateLoading] = useState(false);
  const [groupCreateError, setGroupCreateError] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedGroup(defaultGroupId || '');
      setShowInlineGroupCreate(false);
      setNewGroupTitle('');
      setGroupCreateError('');
      setError('');
    }
  }, [isOpen, defaultGroupId]);

  if (!isOpen) return null;

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  const handleInlineCreateGroup = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGroupCreateError('');

    if (!newGroupTitle.trim()) {
      setGroupCreateError('Please enter a group title');
      return;
    }

    setGroupCreateLoading(true);
    try {
      const res = await createGroup({
        title: newGroupTitle.trim(),
        color: newGroupColor,
      });

      if (res && res.success && res.group) {
        setSelectedGroup(res.group._id);
        setShowInlineGroupCreate(false);
        setNewGroupTitle('');
      } else {
        setGroupCreateError(res?.message || 'Failed to create group');
      }
    } catch (err) {
      setGroupCreateError(err.message || 'Error creating group');
    } finally {
      setGroupCreateLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      return setError('Please enter a descriptive title for this transaction.');
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return setError('Please enter a valid amount greater than ₹0.00.');
    }

    setLoading(true);
    try {
      await api.post('/expenses', {
        title: title.trim(),
        amount: numAmount,
        type,
        category,
        paymentMethod,
        date: date || new Date().toISOString(),
        note: note.trim(),
        group: selectedGroup && selectedGroup !== '' ? selectedGroup : null,
      });

      // Reset form
      setTitle('');
      setAmount('');
      setNote('');
      setDate(todayStr);
      setPaymentMethod(PAYMENT_METHODS[0]);
      setSelectedGroup('');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to record transaction. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B0B0D]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#17171B] rounded-2xl shadow-2xl border border-[#302B25] overflow-hidden z-10 animate-fade-in-up my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#302B25] flex items-center justify-between bg-[#101013]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF72]/15 text-[#D4AF72] flex items-center justify-center border border-[#D4AF72]/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#F5F1E8]">
                New Transaction
              </h3>
              <p className="text-xs text-[#A6A19A]">Record in Indian Rupees (₹ INR)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#E05263]/15 border border-[#E05263]/30 text-[#E05263] text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#131316] rounded-xl border border-[#302B25]">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-[#E05263] text-white shadow-xs'
                    : 'text-[#A6A19A] hover:text-[#F5F1E8]'
                }`}
              >
                Expense (-)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-[#2EB872] text-white shadow-xs'
                    : 'text-[#A6A19A] hover:text-[#F5F1E8]'
                }`}
              >
                Income (+)
              </button>
            </div>
          </div>

          {/* Title & Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#F5F1E8] mb-1.5">
                Description / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Groceries, Fuel, Rent"
                className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:border-[#D4AF72] focus:outline-none focus:ring-1 focus:ring-[#D4AF72]/20 transition text-[#F5F1E8] placeholder-[#6B665F] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F5F1E8] mb-1.5 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-[#D4AF72]" />
                <span>Amount (₹ INR) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:border-[#D4AF72] focus:outline-none focus:ring-1 focus:ring-[#D4AF72]/20 transition font-bold text-[#F5F1E8] placeholder-[#6B665F]"
              />
            </div>
          </div>

          {/* Group Selector & Inline Group Creation */}
          <div className="p-3 bg-[#1E1E23] rounded-xl border border-[#302B25] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#F5F1E8] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#D4AF72]" />
                <span>Assign to Group (Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowInlineGroupCreate(!showInlineGroupCreate)}
                className="text-[11px] font-bold text-[#D4AF72] hover:text-[#E0C28A] transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{showInlineGroupCreate ? 'Cancel New Group' : 'New Group'}</span>
              </button>
            </div>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:outline-none focus:border-[#D4AF72] transition text-[#F5F1E8] font-medium cursor-pointer"
            >
              <option value="">Personal Transaction (No Group)</option>
              {groups.map((grp) => (
                <option key={grp._id} value={grp._id}>
                  {grp.title} {grp.color ? `(${grp.color})` : ''}
                </option>
              ))}
            </select>

            {/* Inline New Group Box */}
            {showInlineGroupCreate && (
              <div className="mt-2.5 p-3 bg-[#131316] border border-[#302B25] rounded-xl space-y-2.5 shadow-xs animate-fade-in">
                <div className="text-[11px] font-bold text-[#D4AF72]">
                  Quick Group Creation
                </div>

                {groupCreateError && (
                  <div className="text-[11px] text-[#E05263] bg-[#E05263]/15 p-1.5 rounded-lg border border-[#E05263]/30">
                    {groupCreateError}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                    placeholder="Group title (e.g. Goa Trip, Birthday)"
                    className="flex-1 px-2.5 py-1.5 text-xs bg-[#1E1E23] border border-[#302B25] rounded-lg focus:outline-none focus:border-[#D4AF72] text-[#F5F1E8] placeholder-[#6B665F]"
                  />
                  <button
                    type="button"
                    onClick={handleInlineCreateGroup}
                    disabled={groupCreateLoading || !newGroupTitle.trim()}
                    className="px-3 py-1.5 bg-[#D4AF72] hover:bg-[#E0C28A] text-[#0B0B0D] text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {groupCreateLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>

                {/* Color Selector */}
                <div>
                  <span className="block text-[10px] font-semibold text-[#A6A19A] mb-1">
                    Group Color Theme:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewGroupColor(c)}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          newGroupColor === c ? 'scale-125 ring-2 ring-[#D4AF72] ring-offset-1 ring-offset-[#131316]' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {newGroupColor === c && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#F5F1E8] mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#D4AF72]" />
                <span>Category *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:border-[#D4AF72] focus:outline-none transition text-[#F5F1E8] font-medium cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F5F1E8] mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#D4AF72]" />
                <span>Payment Method *</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:border-[#D4AF72] focus:outline-none transition text-[#F5F1E8] font-medium cursor-pointer"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Note Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#F5F1E8] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF72]" />
                <span>Transaction Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:border-[#D4AF72] focus:outline-none transition text-[#F5F1E8] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F5F1E8] mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#D4AF72]" />
                <span>Note / Remark (Optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. UPI Ref, remarks"
                className="w-full px-3 py-2 text-xs bg-[#131316] border border-[#302B25] rounded-xl focus:border-[#D4AF72] focus:outline-none transition text-[#F5F1E8] placeholder-[#6B665F] font-medium"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#302B25]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#A6A19A] hover:bg-[#1E1E23] hover:text-[#F5F1E8] rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 ${
                type === 'expense'
                  ? 'bg-[#E05263] hover:bg-[#F06A7A] text-white'
                  : 'bg-[#2EB872] hover:bg-[#38C87E] text-white'
              }`}
            >
              {loading ? 'Recording...' : type === 'expense' ? 'Record Expense' : 'Record Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
