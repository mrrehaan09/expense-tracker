import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function StatCard({ type, title, amount, subtitle, count }) {
  const formattedAmount = formatINR(amount || 0);

  const config = {
    balance: {
      badgeBg: (amount || 0) >= 0
        ? 'bg-[#2EB872]/10 text-[#2EB872] border-[#2EB872]/25'
        : 'bg-[#E05263]/10 text-[#E05263] border-[#E05263]/25',
      badgeText: (amount || 0) >= 0 ? 'Net Positive' : 'Net Negative',
      iconContainer: 'bg-[#D4AF72]/15 text-[#D4AF72] border border-[#D4AF72]/30',
      icon: Wallet,
      indicatorIcon: (amount || 0) >= 0 ? ArrowUpRight : ArrowDownRight,
      amountColor: 'text-[#F5F1E8]',
    },
    income: {
      badgeBg: 'bg-[#2EB872]/10 text-[#2EB872] border-[#2EB872]/25',
      badgeText: 'Total Inflow',
      iconContainer: 'bg-[#2EB872]/10 text-[#2EB872] border border-[#2EB872]/25',
      icon: TrendingUp,
      indicatorIcon: ArrowUpRight,
      amountColor: 'text-[#2EB872]',
    },
    expense: {
      badgeBg: 'bg-[#E05263]/10 text-[#E05263] border-[#E05263]/25',
      badgeText: 'Total Outflow',
      iconContainer: 'bg-[#E05263]/10 text-[#E05263] border border-[#E05263]/25',
      icon: TrendingDown,
      indicatorIcon: ArrowDownRight,
      amountColor: 'text-[#E05263]',
    },
  }[type] || {
    badgeBg: 'bg-[#1E1E23] text-[#A6A19A] border-[#302B25]',
    badgeText: 'Summary',
    iconContainer: 'bg-[#1E1E23] text-[#D4AF72] border border-[#302B25]',
    icon: Wallet,
    indicatorIcon: ArrowUpRight,
    amountColor: 'text-[#F5F1E8]',
  };

  const MainIcon = config.icon;
  const Indicator = config.indicatorIcon;

  return (
    <div className="bg-[#17171B] rounded-2xl p-5 sm:p-6 border border-[#302B25] hover:border-[#453E35] transition-all duration-200 shadow-sm minimal-card flex flex-col justify-between">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold text-[#A6A19A] uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.iconContainer}`}>
          <MainIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Amount Display */}
      <div className="space-y-2">
        <div className={`text-2xl sm:text-3xl font-black ${config.amountColor} tracking-tight font-sans`}>
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
          <span className="text-xs text-[#A6A19A] font-medium">
            {subtitle || `${count || 0} transaction${count === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>
    </div>
  );
}
