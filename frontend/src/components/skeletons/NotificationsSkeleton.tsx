/** Skeleton screen for the Notifications page while data is loading. */
export const NotificationsSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-slate-200 dark:bg-[#2a2b32] rounded-xl" />
        <div className="h-8 w-40 bg-slate-200 dark:bg-[#2a2b32] rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="h-5 w-24 bg-slate-100 dark:bg-[#40414f] rounded" />
        <div className="h-5 w-20 bg-slate-100 dark:bg-[#40414f] rounded" />
      </div>
    </div>

    {/* Notification rows */}
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex gap-4 p-4 sm:p-5 bg-white dark:bg-[#202123] border border-slate-100 dark:border-[#383942] rounded-2xl"
        >
          <div className="h-10 w-10 bg-slate-200 dark:bg-[#2a2b32] rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2 py-0.5">
            <div className={`h-4 bg-slate-200 dark:bg-[#2a2b32] rounded`} style={{ width: `${60 + (i % 3) * 15}%` }} />
            <div className="h-3 w-28 bg-slate-100 dark:bg-[#40414f] rounded" />
          </div>
          <div className="h-5 w-5 bg-slate-100 dark:bg-[#40414f] rounded-full shrink-0 self-center" />
        </div>
      ))}
    </div>
  </div>
);

export default NotificationsSkeleton;
