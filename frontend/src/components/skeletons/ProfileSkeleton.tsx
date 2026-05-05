/**
 * ProfileSkeleton
 * Mimics the 4-card layout of the MyProfile page.
 * Shown while the profile API call is in-flight.
 */
export const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0 animate-pulse">
    {/* Page header */}
    <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-[#383942]">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-[#2a2b32]" />
        <div className="h-6 w-32 rounded bg-slate-200 dark:bg-[#2a2b32]" />
      </div>
      <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-[#2a2b32]" />
    </div>

    {/* Account Info card */}
    <div className="rounded-2xl border border-slate-100 dark:border-[#383942] bg-white dark:bg-[#202123] p-6 space-y-4">
      <div className="h-5 w-40 rounded bg-slate-200 dark:bg-[#2a2b32]" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-16 rounded bg-slate-100 dark:bg-[#383942]" />
            <div className="h-10 rounded-xl bg-slate-100 dark:bg-[#383942]" />
          </div>
        ))}
      </div>
    </div>

    {/* Academic card */}
    <div className="rounded-2xl border border-slate-100 dark:border-[#383942] bg-white dark:bg-[#202123] p-6 space-y-4">
      <div className="h-5 w-40 rounded bg-slate-200 dark:bg-[#2a2b32]" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-[#383942]" />
        ))}
      </div>
    </div>

    {/* Skills card */}
    <div className="rounded-2xl border border-slate-100 dark:border-[#383942] bg-white dark:bg-[#202123] p-6 space-y-4">
      <div className="h-5 w-24 rounded bg-slate-200 dark:bg-[#2a2b32]" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-slate-100 dark:bg-[#383942]" />
        ))}
      </div>
    </div>

    {/* Resume card */}
    <div className="rounded-2xl border border-slate-100 dark:border-[#383942] bg-white dark:bg-[#202123] p-6">
      <div className="h-5 w-24 rounded bg-slate-200 dark:bg-[#2a2b32] mb-4" />
      <div className="h-16 rounded-xl bg-slate-100 dark:bg-[#383942]" />
    </div>
  </div>
);

export default ProfileSkeleton;
