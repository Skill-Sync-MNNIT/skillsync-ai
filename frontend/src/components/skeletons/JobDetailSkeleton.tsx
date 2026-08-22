/** Skeleton screen for the JobDetail page while job data is loading. */
export const JobDetailSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
    {/* Back link */}
    <div className="h-4 w-24 bg-slate-200 dark:bg-[#2a2b32] rounded" />

    {/* Main card */}
    <div className="bg-white dark:bg-[#202123] border border-slate-200 dark:border-[#383942] rounded-2xl p-8 shadow-sm">
      {/* Title row */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-72 bg-slate-200 dark:bg-[#2a2b32] rounded-lg" />
            <div className="h-6 w-16 bg-slate-100 dark:bg-[#40414f] rounded-full" />
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 bg-slate-200 dark:bg-[#2a2b32] rounded" />
                <div className="space-y-1.5">
                  <div className="h-3 w-16 bg-slate-100 dark:bg-[#40414f] rounded" />
                  <div className="h-4 w-28 bg-slate-200 dark:bg-[#2a2b32] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="h-12 w-36 bg-slate-200 dark:bg-[#2a2b32] rounded-xl shrink-0" />
      </div>

      <div className="my-8 border-t border-slate-100 dark:border-[#383942]" />

      {/* Description */}
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="h-5 w-28 bg-slate-200 dark:bg-[#2a2b32] rounded" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 dark:bg-[#40414f] rounded" />
            <div className="h-3 w-5/6 bg-slate-100 dark:bg-[#40414f] rounded" />
            <div className="h-3 w-4/5 bg-slate-100 dark:bg-[#40414f] rounded" />
            <div className="h-3 w-3/4 bg-slate-100 dark:bg-[#40414f] rounded" />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <div className="h-5 w-32 bg-slate-200 dark:bg-[#2a2b32] rounded" />
          <div className="flex flex-wrap gap-2">
            {[70, 90, 80, 100, 65].map((w, i) => (
              <div key={i} className="h-8 bg-slate-100 dark:bg-[#40414f] rounded-lg" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default JobDetailSkeleton;
