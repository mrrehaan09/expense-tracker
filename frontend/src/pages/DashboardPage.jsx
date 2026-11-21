import { Link } from 'react-router-dom';
import { useExpenses } from '../context/ExpenseContext';
import StatCard from '../components/StatCard';
import MonthlyChart from '../components/MonthlyChart';
import CategoryBreakdown from '../components/CategoryBreakdown';
import { StatCardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import {
  FileDown,
  Plus,
  ArrowRight,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Tag,
  Sparkles,
  Users,
} from 'lucide-react';
import { formatINR, getPaymentBadge } from '../utils/formatters';

export default function DashboardPage() {
  const {
    user,
    loading,
    summary,
    categoryBreakdown,
    monthlyStats,
    transactions,
    setIsModalOpen,
    setIsExportModalOpen,
  } = useExpenses();

  // Calculate savings rate
  const savingsRate =
    summary.totalIncome > 0
      ? Math.max(0, Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100))
      : 0;

  // Recent 6 transactions for dashboard snapshot
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* ── Section 1: Welcome Header Banner ──────────────────────── */}
      <div className="animate-section-1 bg-[#17171B] rounded-2xl p-5 sm:p-6 border border-[#302B25] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 minimal-card">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5F1E8] tracking-tight truncate">
              Welcome back, {user?.name || 'User'}
            </h2>
            <span className="text-xs font-semibold text-[#D4AF72] bg-[#D4AF72]/15 border border-[#D4AF72]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-[#D4AF72]" />
              Live Overview
            </span>
          </div>
          <p className="text-[#A6A19A] text-xs sm:text-sm">
            Financial snapshot in Indian Rupees (₹). Track daily income, expenses, and download statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E1E23] hover:bg-[#25252B] active:bg-[#1E1E23] border border-[#302B25] hover:border-[#D4AF72]/40 text-[#F5F1E8] text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-40 shadow-xs shrink-0 whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5 text-[#D4AF72]" />
            <span>Export Statement</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4AF72] hover:bg-[#E0C28A] active:bg-[#B89455] text-[#0B0B0D] text-xs font-bold rounded-xl transition cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* ── Section 2: Stat Cards (4 KPI metrics) ────────────────── */}
      <div className="animate-section-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              type="balance"
              title="Net Balance"
              amount={summary.totalBalance}
              subtitle="Available Cash Flow"
            />
            <StatCard
              type="income"
              title="Total Income"
              amount={summary.totalIncome}
              subtitle="All Recorded Inflows"
            />
            <StatCard
              type="expense"
              title="Total Expenses"
              amount={summary.totalExpense}
              subtitle="All Recorded Outflows"
            />
            {/* Card 4: Savings Rate in Obsidian Gold */}
            <div className="bg-[#17171B] rounded-2xl p-5 sm:p-6 border border-[#302B25] hover:border-[#453E35] transition-all duration-200 shadow-xs minimal-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider">
                  Savings Rate
                </span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#D4AF72]/15 text-[#D4AF72] border border-[#D4AF72]/30">
                  <TrendingUp className="w-4 h-4 text-[#D4AF72]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-black text-[#F5F1E8] tracking-tight font-sans">
                  {savingsRate}%
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border bg-[#D4AF72]/10 text-[#D4AF72] border-[#D4AF72]/25">
                    {savingsRate >= 20 ? 'Strong Savings' : 'Moderate'}
                  </span>
                  <span className="text-xs text-[#A6A19A] font-medium">
                    of total income
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Section 3: Charts Row (Consistent Height Alignment) ─── */}
      <div className="animate-section-3 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          {loading ? (
            <ChartSkeleton height="h-80" />
          ) : (
            <MonthlyChart data={monthlyStats} />
          )}
        </div>
        <div className="lg:col-span-1 flex flex-col">
          {loading ? (
            <ChartSkeleton height="h-80" />
          ) : (
            <CategoryBreakdown categories={categoryBreakdown} />
          )}
        </div>
      </div>

      {/* ── Section 4: Recent Transactions Snapshot ──────────────── */}
      <div className="animate-section-4 bg-[#17171B] rounded-2xl border border-[#302B25] p-5 sm:p-6 shadow-xs minimal-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#302B25]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF72]/15 text-[#D4AF72] flex items-center justify-center border border-[#D4AF72]/30">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F1E8]">
                Recent Activity
              </h2>
              <p className="text-xs text-[#A6A19A]">
                Latest transactions from your live ledger
              </p>
            </div>
          </div>

          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF72] hover:text-[#E0C28A] transition"
          >
            <span>View All ({transactions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-[#302B25] rounded-2xl bg-[#131316]/50">
            <Receipt className="w-8 h-8 text-[#6B665F] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#F5F1E8]">No activity recorded yet</p>
            <p className="text-[11px] text-[#A6A19A] max-w-xs mx-auto mt-1">
              Add your first transaction to populate your dashboard and financial analytics.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#D4AF72] bg-[#D4AF72]/10 hover:bg-[#D4AF72]/20 border border-[#D4AF72]/25 rounded-lg transition cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#302B25]">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead className="bg-[#131316] text-[#A6A19A] text-[11px] font-bold uppercase tracking-wider border-b border-[#302B25]">
                <tr>
                  <th className="py-3 px-4">Transaction / Group</th>
                  <th className="py-3 px-4 hidden md:table-cell">Category</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Payment Channel</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302B25]/60 text-sm bg-[#17171B]">
                {recentTransactions.map((tx) => {
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
                      className="group hover:bg-[#1E1E23]/60 transition-colors duration-150"
                    >
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                              isIncome
                                ? 'bg-[#2EB872]/10 text-[#2EB872] border-[#2EB872]/25'
                                : 'bg-[#E05263]/10 text-[#E05263] border-[#E05263]/25'
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
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[11px] text-[#A6A19A]">
                                {formattedDate}
                              </span>
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

                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1E1E23] text-[#F5F1E8] border border-[#302B25]">
                          <Tag className="w-3 h-3 text-[#D4AF72]" />
                          {tx.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${getPaymentBadge(tx.paymentMethod)}`}>
                          <CreditCard className="w-3 h-3 opacity-80" />
                          <span>{tx.paymentMethod || 'Other'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-black text-sm whitespace-nowrap font-sans tracking-tight ${
                            isIncome ? 'text-[#2EB872]' : 'text-[#F5F1E8]'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatINR(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
