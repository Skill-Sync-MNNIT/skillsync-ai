import { ChevronLeft, Users, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../ui/Button';

interface ChatHeaderProps {
  currentRoom: any;
  user: any;
  userStatuses: Record<string, { isOnline: boolean; lastSeen?: string }>;
  onOpenSettings: () => void;
  onBack: () => void;
}

/**
 * The top bar of an active chat: avatar, name, online/last-seen status, and settings.
 * Extracted from Messages.tsx lines 727–793.
 * getRoomStatus logic is copied verbatim from the original.
 */
export const ChatHeader = ({
  currentRoom,
  user,
  userStatuses,
  onOpenSettings,
  onBack,
}: ChatHeaderProps) => {
  const getRoomStatus = () => {
    if (!currentRoom) return null;

    if (currentRoom?.isGroup) {
      const onlineCount =
        currentRoom?.participants?.filter((p: any) => {
          const pid = String(p._id);
          const uid = String(user?._id);
          if (pid === uid) return false;
          const status = userStatuses[pid];
          return status ? status.isOnline : p.isOnline;
        }).length || 0;

      if (onlineCount > 0) {
        return (
          <span className="text-green-500 flex items-center gap-1 font-medium">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            {onlineCount} {onlineCount === 1 ? 'member' : 'members'} online
          </span>
        );
      }
      return (
        <span className="text-slate-500">
          {currentRoom?.participants?.length || 0} members
        </span>
      );
    }

    const otherParticipant = currentRoom?.participants?.find(
      (p: any) => String(p._id) !== String(user?._id)
    );
    if (!otherParticipant) return null;

    const status = userStatuses[String(otherParticipant._id)];
    const isOnline = status ? status.isOnline : otherParticipant.isOnline;

    if (isOnline) return <span className="text-green-500 font-medium">Online</span>;

    const lastSeen = status?.lastSeen || otherParticipant.lastSeen;
    if (!lastSeen) return <span className="text-slate-400">Offline</span>;

    const date = new Date(lastSeen);
    const isToday = new Date().toDateString() === date.toDateString();
    const timeStr = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return (
      <span className="text-slate-500">
        Last seen {isToday ? 'today' : date.toLocaleDateString()} at {timeStr}
      </span>
    );
  };

  const otherParticipant = currentRoom?.participants?.find(
    (p: any) => String(p._id) !== String(user?._id)
  );
  const otherParticipantId = String(otherParticipant?._id);
  const isOtherOnline = userStatuses[otherParticipantId]?.isOnline ?? otherParticipant?.isOnline;

  return (
    <div className="p-3 sm:p-4 border-b dark:border-[#383942] bg-white/80 dark:bg-[#202123]/80 backdrop-blur-md flex items-center justify-between shadow-sm z-20">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-[#2a2b32] rounded-full"
          onClick={onBack}
        >
          <ChevronLeft size={22} className="text-slate-600 dark:text-slate-400" />
        </Button>

        <div
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-slate-100 dark:bg-[#2a2b32] flex items-center justify-center text-primary-600 font-bold cursor-pointer shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-900"
          onClick={() => {
            if (otherParticipant && !currentRoom?.isGroup) {
              window.open(
                `/profile/${otherParticipant.email?.split('@')[0] || otherParticipant._id}`,
                '_blank'
              );
            }
          }}
        >
          {currentRoom?.isGroup
            ? <Users size={22} />
            : currentRoom?.participants.find((p: any) => p._id !== user?._id)?.name?.charAt(0) || 'U'}
        </div>

        <div
          className={cn(
            'min-w-0 flex flex-col justify-center',
            !currentRoom?.isGroup && 'cursor-pointer hover:opacity-80 transition-opacity'
          )}
          onClick={() => {
            if (otherParticipant && !currentRoom?.isGroup) {
              window.open(
                `/profile/${otherParticipant.email?.split('@')[0] || otherParticipant._id}`,
                '_blank'
              );
            }
          }}
        >
          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate leading-tight">
            {currentRoom?.isGroup
              ? currentRoom?.name
              : currentRoom?.participants.find((p: any) => p._id !== user?._id)?.name ||
                'Direct Message'}
          </h3>
          <div className="flex items-center gap-1.5 h-4 mt-0.5 text-slate-900 dark:text-white">
            {getRoomStatus() ? (
              <>
                {!currentRoom?.isGroup && (
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full ring-1 ring-white dark:ring-slate-900',
                      isOtherOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'
                    )}
                  />
                )}
                <p className="text-[10px] text-slate-500 font-medium leading-none truncate">
                  {getRoomStatus()}
                </p>
              </>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium leading-none italic animate-pulse">
                Syncing status...
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="p-2 w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-[#2a2b32]"
          onClick={onOpenSettings}
        >
          <MoreVertical size={20} className="text-slate-500" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
