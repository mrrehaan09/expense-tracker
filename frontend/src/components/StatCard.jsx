import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function StatCard({ type, title, amount, subtitle, count }) {
  const formattedAmount = formatINR(amount || 0);

  const config = {
    balance: {
      badgeBg: (amount || 0) >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' : 'bg-rose-50 text-rose-700 border-rose-200/70',
      badgeText: (amount || 0) >= 0 ? 'Net Positive' : 'Net Negative',
      iconContainer: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      icon: Wallet,
      indicatorIcon: (amount || 0) >= 0 ? ArrowUpRight : ArrowDownRight,
      indicatorColor: (amount || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600',
      borderColor: 'border-slate-200/80 hover:border-slate-300',
    },
    income: {
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
      badgeText: 'Total Inflow',
      iconContainer: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      icon: TrendingUp,
      indicatorIcon: ArrowUpRight,
      indicatorColor: 'text-emerald-600',
      borderColor: 'border-slate-200/80 hover:border-slate-300',
    },
    expense: {
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/70',
      badgeText: 'Total Outflow',
      iconContainer: 'bg-rose-50 text-rose-600 border border-rose-100',
      icon: TrendingDown,
      indicatorIcon: ArrowDownRight,
      indicatorColor: 'text-rose-600',
      borderColor: 'border-slate-200/80 hover:border-slate-300',
    },
  }[type] || {
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeText: 'Summary',
    iconContainer: 'bg-slate-50 text-slate-600 border border-slate-200',
    icon: Wallet,
    indicatorIcon: ArrowUpRight,
    indicatorColor: 'text-slate-600',
    borderColor: 'border-slate-200/80 hover:border-slate-300',
  };

  const MainIcon = config.icon;
  const Indicator = config.indicatorIcon;

  return (
    <div
      className={`bg-white rounded-2xl p-5 sm:p-6 border ${config.borderColor} shadow-sm minimal-card flex flex-col justify-between`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.iconContainer}`}>
          <MainIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Amount Display */}
      <div className="space-y-2">
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
          {formattedAmount}
        </div>

        {/* Subtitle & Badge */}
        <div className="flex items-center gap-2 pt-0.5">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${config.badgeBg}`}
          >
            <Indicator className="w-3 h-3" />
            {config.badgeText}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {subtitle || `${count || 0} transaction${count === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>
    </div>
  );
}
