import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { formatINR, formatCompactINR } from '../utils/formatters';

// Obsidian Gold Custom Tooltip
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1E1E23] text-[#F5F1E8] p-3 rounded-xl shadow-xl border border-[#302B25] text-xs space-y-1.5 min-w-[150px]">
        <div className="flex items-center gap-1.5 text-[#A6A19A] font-semibold border-b border-[#302B25] pb-1">
          <Calendar className="w-3 h-3 text-[#D4AF72]" />
          <span>{label}</span>
        </div>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="capitalize text-[#A6A19A] text-[11px]">{item.name}:</span>
            </span>
            <span className="font-bold text-[#F5F1E8] tracking-tight">
              {formatINR(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function MonthlyChart({ data = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="bg-[#17171B] rounded-2xl border border-[#302B25] p-5 sm:p-6 shadow-xs minimal-card flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF72]/15 text-[#D4AF72] flex items-center justify-center border border-[#D4AF72]/30">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#F5F1E8]">
                Cash Flow Analytics
              </h2>
            </div>
            <p className="text-xs text-[#A6A19A] mt-0.5">
              Monthly income vs expense performance in Indian Rupees (₹)
            </p>
          </div>

          {hasData && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold px-2.5 py-1 bg-[#1E1E23] text-[#A6A19A] border border-[#302B25] rounded-lg flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4AF72]" />
                {data.length} period{data.length > 1 ? 's' : ''} tracked
              </span>
            </div>
          )}
        </div>

        <div className="h-72 w-full">
          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#302B25] rounded-2xl bg-[#131316]/50">
              <div className="w-10 h-10 rounded-xl bg-[#1E1E23] text-[#A6A19A] border border-[#302B25] flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-[#D4AF72]" />
              </div>
              <h3 className="text-sm font-bold text-[#F5F1E8]">No chart data yet</h3>
              <p className="text-xs text-[#A6A19A] max-w-xs mt-1 leading-relaxed">
                Record your transactions using &quot;Add Transaction&quot; to generate an interactive comparison chart.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#302B25" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: '#302B25' }}
                  tick={{ fill: '#A6A19A', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#A6A19A', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(val) => formatCompactINR(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 600, color: '#A6A19A' }}
                />
                <Bar
                  name="Income"
                  dataKey="income"
                  fill="#2EB872"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Bar
                  name="Expenses"
                  dataKey="expense"
                  fill="#E05263"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
