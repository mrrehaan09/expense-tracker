export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-200 rounded-md" />
        <div className="w-8 h-8 rounded-xl bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-7 w-36 bg-slate-200 rounded-md" />
        <div className="h-4 w-28 bg-slate-100 rounded-md" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 'h-72' }) {
  return (
    <div className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs animate-pulse ${height} flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-32 bg-slate-200 rounded-md" />
          <div className="h-3 w-48 bg-slate-100 rounded-md" />
        </div>
        <div className="h-6 w-20 bg-slate-100 rounded-lg" />
      </div>
      <div className="h-48 w-full bg-slate-50 rounded-xl flex items-end p-4 gap-4">
        <div className="h-1/3 flex-1 bg-slate-200 rounded-t" />
        <div className="h-2/3 flex-1 bg-slate-200 rounded-t" />
        <div className="h-1/2 flex-1 bg-slate-200 rounded-t" />
        <div className="h-4/5 flex-1 bg-slate-200 rounded-t" />
        <div className="h-3/5 flex-1 bg-slate-200 rounded-t" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-100 animate-pulse flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-200" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 bg-slate-200 rounded" />
          <div className="h-2.5 w-20 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-5 w-16 bg-slate-100 rounded-md" />
        <div className="h-4 w-20 bg-slate-200 rounded" />
      </div>
    </div>
  );
}
