import { MessageSquare, Plus, Search, Users, CheckCheck, Image as ImageIcon, FileText, MessageCirclePlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { useNavigate } from 'react-router-dom';

interface ChatSidebarProps {
  rooms: any[];
  currentRoom: any;
  user: any;
  userStatuses: Record<string, { isOnline: boolean; lastSeen?: string }>;
  isLoading: boolean;
  roomSearch: string;
  setRoomSearch: (val: string) => void;
  onSelectRoom: (room: any) => void;
  onNewGroup: () => void;
  showMobileChat: boolean;
}

/**
 * The left panel of the Messages page: room list, search bar, new-group button.
 * Extracted from Messages.tsx lines 574–719.
 */
export const ChatSidebar = ({
  rooms,
  currentRoom,
  user,
  userStatuses,
  isLoading,
  roomSearch,
  setRoomSearch,
  onSelectRoom,
  onNewGroup,
  showMobileChat,
}: ChatSidebarProps) => {
  const navigate = useNavigate();

  const filteredRooms = rooms.filter((r) => {
    const other = r.participants.find((p: any) => String(p._id) !== String(user?._id));
    const name = r.isGroup ? r.name : other?.name || 'Quick Chat';
    return name.toLowerCase().includes(roomSearch.toLowerCase());
  });

  return (
    <div
      className={cn(
        'w-full md:w-[380px] border-r border-slate-100 dark:border-[#383942] flex flex-col bg-slate-50/30 dark:bg-[#202123]/40 transition-all duration-300',
        showMobileChat ? 'hidden md:flex' : 'flex'
      )}
    >
      <div className="p-4 bg-white dark:bg-[#202123] backdrop-blur-md space-y-4">
        <div className="flex justify-between items-center text-slate-900 dark:text-white">
          <h2 className="font-extrabold flex items-center gap-2 text-xl tracking-tight">
            <MessageSquare size={22} className="text-primary-600" /> Messages
          </h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2b32] text-primary-600 shadow-none border border-slate-100 dark:border-[#383942]"
            onClick={onNewGroup}
          >
            <Plus size={22} />
          </Button>
        </div>

        <div className="relative group px-1">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300"
            size={16}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-white dark:bg-[#202123] border border-slate-200 dark:border-[#383942] rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 shadow-sm focus:shadow-lg focus:shadow-primary-500/5 focus:-translate-y-0.5 transition-all duration-300 placeholder:text-slate-400 font-medium"
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#202123] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-[#383942] text-slate-900 dark:text-white">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 p-3 text-slate-900 dark:text-white">
                <div className="h-12 w-12 bg-slate-100 dark:bg-[#2a2b32] animate-pulse rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-1/2 bg-slate-100 dark:bg-[#2a2b32] animate-pulse rounded" />
                  <div className="h-3 w-3/4 bg-slate-100 dark:bg-[#2a2b32] animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <EmptyState
            icon={MessageCirclePlus}
            title={roomSearch ? 'No Search Results' : 'No chats yet'}
            description={
              roomSearch
                ? `Couldn't find any conversations matching "${roomSearch}".`
                : 'Connect with the MNNIT community to start your first conversation!'
            }
            actionLabel={!roomSearch ? 'Explore Network' : undefined}
            onAction={() => navigate('/networking')}
            className="mt-10"
          />
        ) : (
          filteredRooms.map((room) => {
            const otherParticipant = room.participants.find(
              (p: any) => String(p._id) !== String(user?._id)
            );
            const otherId = otherParticipant?._id;
            const isActive = currentRoom?._id === room._id;

            return (
              <div
                key={room._id}
                onClick={() => onSelectRoom(room)}
                className={cn(
                  'group relative mx-2 mb-1 px-4 py-3 cursor-pointer transition-all duration-300 rounded-2xl text-slate-900 dark:text-white overflow-hidden',
                  isActive
                    ? 'bg-primary-50/60 dark:bg-primary-900/30 ring-1 ring-primary-100/50 dark:ring-primary-800/40 shadow-sm'
                    : 'hover:bg-primary-50/30 dark:hover:bg-white/[0.04]'
                )}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary-600 rounded-r-full shadow-[0_0_12px_rgba(37,99,235,0.6)] z-20" />
                )}

                {/* Subtle Hover Background Shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400/10 dark:from-primary-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="flex items-center gap-3 text-slate-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1 relative z-10">
                  <div className="relative h-12 w-12 rounded-2xl bg-white dark:bg-[#2a2b32] flex items-center justify-center text-slate-500 font-bold overflow-hidden shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                    {room.isGroup ? (
                      <div className="bg-primary-100 dark:bg-primary-900/20 w-full h-full flex items-center justify-center">
                        <Users size={24} className="text-primary-600" />
                      </div>
                    ) : (
                      <div className="bg-slate-100 dark:bg-[#2a2b32] w-full h-full flex items-center justify-center text-lg uppercase tracking-tighter">
                        {otherParticipant?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    {!room.isGroup &&
                      otherId &&
                      (userStatuses[otherId]
                        ? userStatuses[otherId].isOnline
                        : otherParticipant?.isOnline) && (
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] border-white dark:border-slate-950 rounded-full z-10" />
                      )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p
                        className={cn(
                          'font-bold text-sm truncate transition-colors duration-300',
                          isActive
                            ? 'text-primary-700 dark:text-primary-400'
                            : 'text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
                        )}
                      >
                        {room.isGroup ? room.name : otherParticipant?.name || 'Quick Chat'}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight">
                        {room.lastMessageAt
                          ? new Date(room.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })
                          : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-900 dark:text-white">
                      <p className="text-xs text-slate-500 truncate flex-1 flex items-center gap-1.5 min-w-0 pr-2">
                        {(room.lastMessageDetails?.senderId === user?._id ||
                          room.lastMessageDetails?.senderId?._id === user?._id) && (
                          <CheckCheck
                            size={14}
                            className={cn(
                              'shrink-0',
                              room.lastMessageDetails?.readBy?.length > 0
                                ? 'text-blue-400'
                                : 'text-slate-300'
                            )}
                          />
                        )}
                        <span className="truncate">
                          {(room.lastMessage?.startsWith('http') &&
                            room.lastMessage?.includes('cloudinary')) ||
                          room.lastMessage === '📷 Photo' ? (
                            <span className="flex items-center gap-1">
                              <ImageIcon size={12} className="shrink-0" /> Photo
                            </span>
                          ) : (room.lastMessage?.startsWith('http') &&
                              room.lastMessage?.includes('chat_files')) ||
                            room.lastMessage === '📎 Document' ? (
                            <span className="flex items-center gap-1">
                              <FileText size={12} className="shrink-0" /> Document
                            </span>
                          ) : (
                            room.lastMessage || 'Click to message'
                          )}
                        </span>
                      </p>
                      {room.unreadCount > 0 && (
                        <div className="ml-2 bg-primary-600 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-lg shadow-primary-500/20 ring-2 ring-white dark:ring-slate-950">
                          {room.unreadCount > 99 ? '99+' : room.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
