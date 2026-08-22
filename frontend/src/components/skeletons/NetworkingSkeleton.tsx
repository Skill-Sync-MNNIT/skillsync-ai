/** Skeleton screen for the Networking page while connections are loading. */
export const NetworkingSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-8 px-6 pb-12 animate-pulse">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-slate-200 dark:bg-[#2a2b32] rounded-xl" />
        <div className="h-8 w-36 bg-slate-200 dark:bg-[#2a2b32] rounded-lg" />
      </div>
      <div className="h-10 w-32 bg-slate-200 dark:bg-[#2a2b32] rounded-xl" />
    </div>

    {/* Search bar */}
    <div className="h-12 w-full bg-slate-200 dark:bg-[#2a2b32] rounded-2xl" />

    {/* Section label */}
    <div className="flex items-center justify-between">
      <div className="h-6 w-28 bg-slate-200 dark:bg-[#2a2b32] rounded-lg" />
      <div className="h-4 w-32 bg-slate-100 dark:bg-[#40414f] rounded" />
    </div>

    {/* Connection cards grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white dark:bg-[#202123] border border-slate-100 dark:border-[#383942] rounded-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-slate-200 dark:bg-[#2a2b32] rounded-full shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-[#2a2b32] rounded" />
              <div className="h-3 w-24 bg-slate-100 dark:bg-[#40414f] rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-slate-100 dark:bg-[#2a2b32] rounded-full" />
            <div className="h-9 w-9 bg-slate-100 dark:bg-[#2a2b32] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default NetworkingSkeleton;
