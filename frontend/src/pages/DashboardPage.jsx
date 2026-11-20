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
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

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
      {/* ── Section 1: Minimal Welcome Header Banner ──────────────── */}
      <div className="animate-section-1 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 minimal-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'User'}
            </h2>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Live Overview
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Financial snapshot in Indian Rupees (₹). Track daily income, expenses, and download statements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-40 shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Statement</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* ── Section 2: Stat Cards (4 KPI metrics) ────────────────── */}
      <div className="animate-section-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs minimal-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Savings Rate
                </span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {savingsRate}%
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200/70">
                    {savingsRate >= 20 ? 'Strong Savings' : 'Moderate'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    of total income
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Section 3: Charts Row ─────────────────────────────────── */}
      <div className="animate-section-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <ChartSkeleton height="h-80" />
          ) : (
            <MonthlyChart data={monthlyStats} />
          )}
        </div>
        <div className="lg:col-span-1">
          {loading ? (
            <ChartSkeleton height="h-80" />
          ) : (
            <CategoryBreakdown categories={categoryBreakdown} />
          )}
        </div>
      </div>

      {/* ── Section 4: Recent Transactions Snapshot ──────────────── */}
      <div className="animate-section-4 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs minimal-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Activity
              </h2>
              <p className="text-xs text-slate-500">
                Latest transactions from your live ledger
              </p>
            </div>
          </div>

          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <span>View All ({transactions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No activity recorded yet</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
              Add your first transaction to populate your dashboard and financial analytics.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
            >
              <Plus className="w-3 h-3" /> Add Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <tbody className="divide-y divide-slate-100 text-sm">
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
                      className="group hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      <td className="py-2.5 pl-1 max-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
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
                            <span className="text-[11px] text-slate-400">
                              {formattedDate}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {tx.category || 'General'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          {tx.paymentMethod || 'Other'}
                        </span>
                      </td>

                      <td className="py-2.5 pr-1 text-right">
                        <span
                          className={`font-extrabold text-sm whitespace-nowrap font-sans ${
                            isIncome ? 'text-emerald-600' : 'text-slate-900'
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
