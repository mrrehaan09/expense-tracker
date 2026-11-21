export function StatCardSkeleton() {
  return (
    <div className="bg-[#17171B] rounded-2xl p-5 sm:p-6 border border-[#302B25] shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-[#1E1E23] rounded-md" />
        <div className="w-8 h-8 rounded-xl bg-[#1E1E23] border border-[#302B25]/60" />
      </div>
      <div className="space-y-2">
        <div className="h-7 w-36 bg-[#1E1E23] rounded-md" />
        <div className="h-4 w-28 bg-[#1E1E23]/60 rounded-md" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 'h-72' }) {
  return (
    <div
      className={`bg-[#17171B] rounded-2xl p-5 sm:p-6 border border-[#302B25] shadow-xs animate-pulse ${height} flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-32 bg-[#1E1E23] rounded-md" />
          <div className="h-3 w-48 bg-[#1E1E23]/60 rounded-md" />
        </div>
        <div className="h-6 w-20 bg-[#1E1E23] rounded-lg" />
      </div>
      <div className="h-48 w-full bg-[#131316] rounded-xl flex items-end p-4 gap-4 border border-[#302B25]/40">
        <div className="h-1/3 flex-1 bg-[#1E1E23] rounded-t" />
        <div className="h-2/3 flex-1 bg-[#1E1E23] rounded-t" />
        <div className="h-1/2 flex-1 bg-[#1E1E23] rounded-t" />
        <div className="h-4/5 flex-1 bg-[#1E1E23] rounded-t" />
        <div className="h-3/5 flex-1 bg-[#1E1E23] rounded-t" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="p-4 bg-[#17171B] rounded-xl border border-[#302B25] animate-pulse flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1E1E23] border border-[#302B25]/60" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 bg-[#1E1E23] rounded" />
          <div className="h-2.5 w-20 bg-[#1E1E23]/60 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-5 w-16 bg-[#1E1E23] rounded-md" />
        <div className="h-4 w-20 bg-[#1E1E23] rounded" />
      </div>
    </div>
  );
}
