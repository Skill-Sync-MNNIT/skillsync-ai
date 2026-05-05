/** Skeleton screen for the Job Listing page while jobs are loading. */
export const JobListingSkeleton = () => (
  <div className="max-w-6xl mx-auto p-4 pt-0 sm:px-8 sm:pb-8 space-y-6 pb-24 lg:pb-8 animate-pulse">
    {/* Hero header */}
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-[#2a2b32] dark:to-[#383942] p-6 sm:p-10 rounded-[1.5rem] h-36" />

    {/* Search bar */}
    <div className="h-14 w-full bg-slate-200 dark:bg-[#2a2b32] rounded-2xl" />

    {/* Count label */}
    <div className="h-6 w-40 bg-slate-200 dark:bg-[#2a2b32] rounded-lg" />

    {/* Job card grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#202123] border border-slate-100 dark:border-[#383942] rounded-2xl p-6 space-y-4"
        >
          {/* Title + badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-[#2a2b32] rounded-lg" />
              <div className="h-3 w-1/2 bg-slate-100 dark:bg-[#40414f] rounded" />
            </div>
            <div className="h-6 w-16 bg-slate-100 dark:bg-[#40414f] rounded-full shrink-0" />
          </div>

          {/* Description lines */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-100 dark:bg-[#40414f] rounded" />
            <div className="h-3 w-5/6 bg-slate-100 dark:bg-[#40414f] rounded" />
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5">
            {[60, 80, 70].map((w, j) => (
              <div key={j} className="h-7 bg-slate-100 dark:bg-[#40414f] rounded-lg" style={{ width: w }} />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#383942]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-slate-200 dark:bg-[#2a2b32] rounded-full" />
              <div className="h-3 w-20 bg-slate-100 dark:bg-[#40414f] rounded" />
            </div>
            <div className="h-3 w-16 bg-slate-100 dark:bg-[#40414f] rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default JobListingSkeleton;
