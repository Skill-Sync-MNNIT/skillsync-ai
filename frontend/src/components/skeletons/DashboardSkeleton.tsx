/**
 * DashboardSkeleton
 * Mimics the 3-column nav-card strip + the trending skills card.
 * Shown while dashboard API data is loading.
 */
export const DashboardSkeleton = () => (
  <div className="space-y-8 pb-8 animate-pulse">
    {/* Hero placeholder */}
    <div className="h-40 rounded-3xl bg-slate-200 dark:bg-[#2a2b32]" />

    {/* Quick-nav cards */}
    <div className="grid gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 dark:border-[#383942] bg-white dark:bg-[#202123]"
        >
          <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-[#2a2b32] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-[#2a2b32]" />
            <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-[#383942]" />
          </div>
        </div>
      ))}
    </div>

    {/* Trending skills card */}
    <div className="rounded-2xl border border-slate-100 dark:border-[#383942] bg-white dark:bg-[#202123] p-6 space-y-5">
      <div className="h-5 w-48 rounded bg-slate-200 dark:bg-[#2a2b32]" />
      <div className="grid gap-5 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-[#2a2b32]" />
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-[#383942]" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;
