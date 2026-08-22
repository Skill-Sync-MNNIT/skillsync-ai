/** Skeleton screen for the ViewProfile page while student data is loading. */
export const ViewProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto pb-20 space-y-6 animate-pulse">
    {/* Hero card */}
    <div className="rounded-3xl bg-white dark:bg-[#202123] border border-slate-200 dark:border-[#383942] overflow-hidden shadow-md">
      {/* Gradient strip */}
      <div className="h-32 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-[#2a2b32] dark:to-[#383942]" />
      <div className="px-5 sm:px-8 pb-8">
        {/* Avatar + actions row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-12 mb-6 gap-6">
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-slate-300 dark:bg-[#40414f] ring-8 ring-white dark:ring-slate-900" />
          <div className="h-12 w-36 bg-slate-200 dark:bg-[#2a2b32] rounded-2xl" />
        </div>
        {/* Name + email */}
        <div className="space-y-3">
          <div className="h-8 w-56 bg-slate-200 dark:bg-[#2a2b32] rounded-lg" />
          <div className="h-4 w-44 bg-slate-100 dark:bg-[#40414f] rounded" />
        </div>
      </div>
    </div>

    {/* Two-column grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left — Academic + Skills */}
      <div className="lg:col-span-2 space-y-6">
        {/* Academic block */}
        <div className="bg-white dark:bg-[#202123] border border-slate-200 dark:border-[#383942] rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 bg-slate-200 dark:bg-[#2a2b32] rounded-xl" />
            <div className="h-6 w-36 bg-slate-200 dark:bg-[#2a2b32] rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-[#40414f] rounded-2xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-20 bg-slate-100 dark:bg-[#40414f] rounded" />
                  <div className="h-5 w-28 bg-slate-200 dark:bg-[#2a2b32] rounded" />
                  <div className="h-3 w-24 bg-slate-100 dark:bg-[#40414f] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills block */}
        <div className="bg-white dark:bg-[#202123] border border-slate-200 dark:border-[#383942] rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-slate-200 dark:bg-[#2a2b32] rounded-xl" />
            <div className="h-6 w-40 bg-slate-200 dark:bg-[#2a2b32] rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[80, 100, 70, 90, 60, 110, 75].map((w, i) => (
              <div key={i} className="h-9 bg-slate-100 dark:bg-[#40414f] rounded-2xl" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right — Resume */}
      <div className="bg-white dark:bg-[#202123] border border-slate-200 dark:border-[#383942] rounded-3xl overflow-hidden shadow-sm">
        <div className="h-24 bg-slate-100 dark:bg-[#40414f]" />
        <div className="px-6 pt-6 space-y-4">
          <div className="h-5 w-24 bg-slate-200 dark:bg-[#2a2b32] rounded mx-auto" />
          <div className="h-3 w-40 bg-slate-100 dark:bg-[#40414f] rounded mx-auto" />
          <div className="h-12 bg-slate-200 dark:bg-[#2a2b32] rounded-2xl" />
          <div className="h-12 bg-slate-100 dark:bg-[#40414f] rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

export default ViewProfileSkeleton;
