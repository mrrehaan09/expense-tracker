import { PieChart, Sparkles } from 'lucide-react';
import { formatINR } from '../utils/formatters';

// Clean category color palette
const CATEGORY_COLORS = [
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

export default function CategoryBreakdown({ categories = [] }) {
  const hasCategories = Array.isArray(categories) && categories.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm minimal-card flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Expense Categories
              </h2>
              <p className="text-xs text-slate-500">Distribution breakdown in ₹</p>
            </div>
          </div>
          {hasCategories && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
              {categories.length} categories
            </span>
          )}
        </div>

        {/* Empty State */}
        {!hasCategories ? (
          <div className="h-60 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No expenses recorded</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
              When you record expense entries, an automated category distribution will appear here.
            </p>
          </div>
        ) : (
          /* List of Categories with Minimal Progress Bar */
          <div className="space-y-3.5 pt-1">
            {categories.map((cat, index) => {
              const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              return (
                <div key={cat.name} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-2 truncate max-w-[150px]">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-slate-900 font-sans">
                        {formatINR(cat.amount)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded min-w-[34px] text-center">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Minimal Sleek Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-400"
                      style={{
                        width: `${Math.max(cat.percentage, 2)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasCategories && (
        <div className="pt-4 mt-5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Ranked by highest total spending</span>
        </div>
      )}
    </div>
  );
}
