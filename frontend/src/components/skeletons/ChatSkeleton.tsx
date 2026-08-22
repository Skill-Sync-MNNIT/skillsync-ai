/**
 * ChatSkeleton
 * Mimics the sidebar + chat area placeholder while rooms are loading.
 */
export const ChatSkeleton = () => (
  <div className="flex h-[calc(100vh-64px)] overflow-hidden animate-pulse">
    {/* Sidebar skeleton */}
    <div className="w-full md:w-[380px] border-r border-slate-100 dark:border-[#383942] flex flex-col bg-white dark:bg-[#202123]">
      {/* Header */}
      <div className="p-4 space-y-3 border-b border-slate-100 dark:border-[#383942]">
        <div className="flex justify-between items-center">
          <div className="h-6 w-28 rounded bg-slate-200 dark:bg-[#2a2b32]" />
          <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-[#2a2b32]" />
        </div>
        <div className="h-10 rounded-2xl bg-slate-100 dark:bg-[#383942]" />
      </div>

      {/* Room list rows */}
      <div className="flex-1 p-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 p-3 rounded-2xl">
            <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-[#2a2b32] shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-[#2a2b32]" />
              <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-[#383942]" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Chat area skeleton (desktop only) */}
    <div className="hidden md:flex flex-1 flex-col bg-[#F8FAFC] dark:bg-[#343541]">
      <div className="h-16 border-b border-slate-100 dark:border-[#383942] bg-white dark:bg-[#202123] px-4 flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-slate-200 dark:bg-[#2a2b32]" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-[#2a2b32]" />
          <div className="h-3 w-20 rounded bg-slate-100 dark:bg-[#383942]" />
        </div>
      </div>
      <div className="flex-1" />
      <div className="h-20 border-t border-slate-100 dark:border-[#383942] bg-white dark:bg-[#202123]" />
    </div>
  </div>
);

export default ChatSkeleton;
