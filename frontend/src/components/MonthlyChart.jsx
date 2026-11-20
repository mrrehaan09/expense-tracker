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

// Clean minimal tooltip
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1.5 min-w-[150px]">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold border-b border-slate-800 pb-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{label}</span>
        </div>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="capitalize text-slate-300 text-[11px]">{item.name}:</span>
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

export default function MonthlyChart({ data = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm minimal-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Cash Flow Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monthly income vs expense performance in Indian Rupees (₹)
          </p>
        </div>

        {hasData && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              {data.length} period{data.length > 1 ? 's' : ''} tracked
            </span>
          </div>
        )}
      </div>

      <div className="h-72 w-full">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No chart data yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(val) => formatCompactINR(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 600 }}
              />
              <Bar
                name="Income"
                dataKey="income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={30}
              />
              <Bar
                name="Expenses"
                dataKey="expense"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
