import { useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { ChartSkeleton, StatCardSkeleton } from '../components/LoadingSkeleton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart as PieIcon,
  CreditCard,
  Percent,
  FileDown,
} from 'lucide-react';
import { formatINR, formatCompactINR } from '../utils/formatters';

const PIE_COLORS = [
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#d97706', // Amber
  '#0284c7', // Sky
  '#db2777', // Pink
  '#7c3aed', // Violet
  '#ea580c', // Orange
  '#0d9488', // Teal
  '#e11d48', // Rose
  '#475569', // Slate
];

// Custom Tooltip for Recharts
function AnalyticsTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1.5 min-w-[150px]">
        {label && (
          <div className="text-slate-300 font-semibold border-b border-slate-800 pb-1">
            {label}
          </div>
        )}
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color || item.payload?.fill }}
              />
              <span className="capitalize text-slate-300 text-[11px]">
                {item.name}:
              </span>
            </span>
            <span className="font-bold text-white tracking-tight">
              {formatINR(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage() {
  const {
    loading,
    summary,
    categoryBreakdown,
    monthlyStats,
    transactions,
    setIsExportModalOpen,
  } = useExpenses();

  // 1. Savings rate calculation
  const savingsRate =
    summary.totalIncome > 0
      ? Math.max(0, Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100))
      : 0;

  // 2. Compute Payment Method distribution from real MongoDB transactions
  const paymentMethodStats = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      const pm = tx.paymentMethod || 'Other';
      const amt = Number(tx.amount) || 0;
      if (!map[pm]) {
        map[pm] = { name: pm, amount: 0, count: 0, expense: 0, income: 0 };
      }
      map[pm].count += 1;
      map[pm].amount += amt;
      if (tx.type === 'income') map[pm].income += amt;
      else map[pm].expense += amt;
    });

    return Object.values(map)
      .sort((a, b) => b.expense - a.expense);
  }, [transactions]);

  // 3. Compute Income streams breakdown from real transactions
  const incomeCategoryStats = useMemo(() => {
    const map = {};
    transactions
      .filter((tx) => tx.type === 'income')
      .forEach((tx) => {
        const cat = tx.category || 'Other Income';
        const amt = Number(tx.amount) || 0;
        map[cat] = (map[cat] || 0) + amt;
      });

    return Object.keys(map)
      .map((cat) => ({
        name: cat,
        amount: map[cat],
        percentage:
          summary.totalIncome > 0
            ? Math.round((map[cat] / summary.totalIncome) * 100)
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, summary.totalIncome]);

  // 4. Monthly Trend Data with Net Savings
  const monthlyTrendData = useMemo(() => {
    return monthlyStats.map((item) => ({
      ...item,
      netSavings: item.income - item.expense,
    }));
  }, [monthlyStats]);

  const hasData = transactions.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Page Header Banner ────────────────────────────────────── */}
      <div className="animate-section-1 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 minimal-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Financial Analytics & Trends
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              Real MongoDB Sync
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Deep-dive visual analysis of cash flows, category spending distributions, and payment habits.
          </p>
        </div>

        <button
          onClick={() => setIsExportModalOpen(true)}
          disabled={!hasData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-40 self-start sm:self-auto"
        >
          <FileDown className="w-3.5 h-3.5 text-slate-300" />
          <span>Export Analytics PDF</span>
        </button>
      </div>

      {/* ── Executive Financial Metrics (4 Cards) ─────────────────── */}
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
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs minimal-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Income
                </span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {formatINR(summary.totalIncome)}
                </div>
                <p className="text-xs text-slate-500">Gross recorded inflows</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs minimal-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Outflow
                </span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {formatINR(summary.totalExpense)}
                </div>
                <p className="text-xs text-slate-500">Total recorded expenses</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs minimal-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Net Savings
                </span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    summary.totalBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
                  }`}
                >
                  {formatINR(summary.totalBalance)}
                </div>
                <p className="text-xs text-slate-500">Retained cash flow</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs minimal-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Savings Rate
                </span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal-50 text-teal-600 border border-teal-100">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {savingsRate}%
                </div>
                <p className="text-xs text-slate-500">Of total income saved</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Main Charts Grid ──────────────────────────────────────── */}
      {!hasData && !loading ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
          <PieIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No financial analytics available
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            Analytics require at least one transaction in your database. Add income or expenses to generate automated charts and breakdowns.
          </p>
        </div>
      ) : (
        <>
          {/* Chart Row 1: Income vs Expenses & Net Cash Flow Trend */}
          <div className="animate-section-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Income vs Expense Monthly Comparative */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs minimal-card">
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-900">
                  Income vs. Expense Trend
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly comparative inflow and outflow performance
                </p>
              </div>

              <div className="h-72 w-full">
                {loading ? (
                  <ChartSkeleton height="h-72" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyTrendData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      barGap={6}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(val) => formatCompactINR(val)}
                      />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                      />
                      <Bar
                        name="Income"
                        dataKey="income"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        name="Expenses"
                        dataKey="expense"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Net Savings & Cash Flow Trend (Area Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs minimal-card">
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-900">
                  Net Savings & Cash Flow
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly retained savings balance progression
                </p>
              </div>

              <div className="h-72 w-full">
                {loading ? (
                  <ChartSkeleton height="h-72" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyTrendData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorNetSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(val) => formatCompactINR(val)}
                      />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Area
                        type="monotone"
                        name="Net Savings"
                        dataKey="netSavings"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorNetSavings)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Chart Row 2: Category Breakdown (Donut) & Payment Channel Breakdown */}
          <div className="animate-section-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Category Breakdown Donut + List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs minimal-card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Expense Categories Share
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Spending proportion across categories
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                  {categoryBreakdown.length} Categories
                </span>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-center text-xs text-slate-400">
                  No expense records logged yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<AnalyticsTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top categories legend list */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {categoryBreakdown.slice(0, 6).map((cat, idx) => {
                      const color = PIE_COLORS[idx % PIE_COLORS.length];
                      return (
                        <div key={cat.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 truncate max-w-[120px]">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-slate-700 font-medium truncate">
                              {cat.name}
                            </span>
                          </span>
                          <span className="font-bold text-slate-900 font-sans">
                            {formatINR(cat.amount)}{' '}
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({cat.percentage}%)
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Chart 4: Payment Channels Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs minimal-card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Payment Method Volume
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distribution of expense outflows across payment channels
                  </p>
                </div>
                <CreditCard className="w-4 h-4 text-slate-400" />
              </div>

              {paymentMethodStats.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-center text-xs text-slate-400">
                  No payment data available.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={paymentMethodStats.slice(0, 7)}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        tickFormatter={(val) => formatCompactINR(val)}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                        width={90}
                      />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Bar
                        name="Outflow"
                        dataKey="expense"
                        fill="#4f46e5"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Income Streams Distribution (if any income recorded) */}
          {incomeCategoryStats.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs minimal-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Income Streams Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distribution of all earned inflows by category
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">
                  {formatINR(summary.totalIncome)} Total
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {incomeCategoryStats.map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 font-sans">
                      +{formatINR(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
