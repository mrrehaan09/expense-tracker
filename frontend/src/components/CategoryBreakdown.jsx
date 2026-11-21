import { PieChart, Sparkles } from 'lucide-react';
import { formatINR } from '../utils/formatters';

// Coordinated Obsidian Gold category palette (refined, muted, elegant)
const CATEGORY_COLORS = [
  '#D4AF72', // Champagne Gold
  '#2EB872', // Muted Emerald
  '#E05263', // Muted Rose
  '#38BDF8', // Soft Sky
  '#F59E0B', // Warm Amber
  '#A78BFA', // Soft Violet
  '#2DD4BF', // Muted Teal
  '#818CF8', // Soft Indigo
  '#FB7185', // Warm Coral
  '#A6A19A', // Refined Stone
];

export default function CategoryBreakdown({ categories = [] }) {
  const hasCategories = Array.isArray(categories) && categories.length > 0;

  return (
    <div className="bg-[#17171B] rounded-2xl border border-[#302B25] p-5 sm:p-6 shadow-sm minimal-card flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF72]/15 text-[#D4AF72] flex items-center justify-center border border-[#D4AF72]/30">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F1E8]">
                Expense Categories
              </h2>
              <p className="text-xs text-[#A6A19A]">Distribution breakdown in ₹</p>
            </div>
          </div>
          {hasCategories && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-[#1E1E23] text-[#A6A19A] border border-[#302B25] rounded-md">
              {categories.length} categories
            </span>
          )}
        </div>

        {/* Empty State */}
        {!hasCategories ? (
          <div className="h-60 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#302B25] rounded-2xl bg-[#131316]/50">
            <div className="w-10 h-10 rounded-xl bg-[#1E1E23] text-[#A6A19A] border border-[#302B25] flex items-center justify-center mb-3">
              <PieChart className="w-5 h-5 text-[#D4AF72]" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F1E8]">No expenses recorded</h3>
            <p className="text-xs text-[#A6A19A] max-w-xs mt-1 leading-relaxed">
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
                    <span className="font-semibold text-[#F5F1E8] flex items-center gap-2 truncate max-w-[150px]">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-[#F5F1E8] font-sans">
                        {formatINR(cat.amount)}
                      </span>
                      <span className="text-[11px] font-semibold text-[#A6A19A] bg-[#1E1E23] border border-[#302B25] px-1.5 py-0.5 rounded min-w-[34px] text-center">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Minimal Sleek Progress bar with Obsidian Dark Track */}
                  <div className="w-full bg-[#131316] h-1.5 rounded-full overflow-hidden border border-[#302B25]/40">
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
        <div className="pt-4 mt-5 border-t border-[#302B25] text-[11px] text-[#A6A19A] flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF72]" />
          <span>Ranked by highest total spending</span>
        </div>
      )}
    </div>
  );
}
