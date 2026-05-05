import { Edit3, Hash, Users, LogOut, Trash2, Plus, X } from 'lucide-react';
import { BottomSheet } from '../../ui/BottomSheet';
import { Button } from '../../ui/Button';
import { cn } from '../../ui/Button';

interface GroupSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: any;
  user: any;
  isRenaming: boolean;
  setIsRenaming: (val: boolean) => void;
  newNameInput: string;
  setNewNameInput: (val: string) => void;
  onRename: () => void;
  onClearChat: () => void;
  onViewMembers: () => void;
  onAddMembers: () => void;
  onLeaveGroup: () => void;
  onDeleteChat: () => void;
}

/**
 * The room settings bottom sheet containing group management actions.
 * Extracted from Messages.tsx lines 1095–1210.
 */
export const GroupSettingsSheet = ({
  isOpen,
  onClose,
  currentRoom,
  user,
  isRenaming,
  setIsRenaming,
  newNameInput,
  setNewNameInput,
  onRename,
  onClearChat,
  onViewMembers,
  onAddMembers,
  onLeaveGroup,
  onDeleteChat,
}: GroupSettingsSheetProps) => {
  const isAdmin = currentRoom?.admins?.some(
    (a: any) => String(a._id || a) === String(user?._id)
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => { onClose(); setIsRenaming(false); }}
      title={currentRoom?.isGroup ? 'Group Settings' : 'Chat Settings'}
    >
      <div className="p-4 space-y-4">
        {currentRoom?.isGroup && (
          <div
            className={cn(
              'p-4 rounded-2xl transition-all duration-300',
              isRenaming
                ? 'bg-primary-50 dark:bg-primary-900/10 ring-1 ring-primary-500/20'
                : 'bg-slate-50 dark:bg-[#2a2b32]'
            )}
          >
            {isRenaming ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">
                    Rename Group
                  </p>
                  <button
                    onClick={() => setIsRenaming(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-white dark:bg-[#202123] border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 transition-all shadow-inner"
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    placeholder="Enter new group name..."
                    autoFocus
                  />
                  <Button size="sm" onClick={onRename} className="px-5 shadow-lg shadow-primary-500/25">
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setIsRenaming(true); setNewNameInput(currentRoom?.name || ''); }}
                className="w-full flex items-center gap-4 text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-all group/rename py-1"
              >
                <div className="p-2 bg-white dark:bg-[#202123] rounded-lg shadow-sm group-hover/rename:scale-110 transition-transform">
                  <Edit3 size={18} className="text-slate-400 group-hover/rename:text-primary-600" />
                </div>
                <span className="font-semibold">Rename Group</span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => { onClearChat(); onClose(); }}
          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#2a2b32] transition-colors text-slate-700 dark:text-slate-300 group"
        >
          <div className="p-2.5 bg-slate-100 dark:bg-[#2a2b32] rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
            <Hash size={20} className="group-hover:text-primary-600" />
          </div>
          <span className="font-semibold">Clear chat history</span>
        </button>

        {currentRoom?.isGroup && (
          <button
            onClick={() => { onViewMembers(); onClose(); }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#2a2b32] transition-colors text-slate-700 dark:text-slate-300 group"
          >
            <div className="p-2.5 bg-slate-100 dark:bg-[#2a2b32] rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
              <Users size={20} className="group-hover:text-primary-600" />
            </div>
            <span className="font-semibold">Group members</span>
          </button>
        )}

        {currentRoom?.isGroup && isAdmin && (
          <button
            onClick={() => { onAddMembers(); onClose(); }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#2a2b32] transition-colors text-slate-700 dark:text-slate-300 group"
          >
            <div className="p-2.5 bg-slate-100 dark:bg-[#2a2b32] rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
              <Plus size={20} className="group-hover:text-primary-600" />
            </div>
            <span className="font-semibold">Add members</span>
          </button>
        )}

        {currentRoom?.isGroup && (
          <button
            onClick={() => {
              onLeaveGroup();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#2a2b32] transition-colors text-slate-700 dark:text-slate-300 group"
          >
            <div className="p-2.5 bg-slate-100 dark:bg-[#2a2b32] rounded-xl transition-colors">
              <LogOut size={20} />
            </div>
            <span className="font-semibold">Leave group</span>
          </button>
        )}

        {currentRoom?.isGroup && isAdmin && (
          <button
            onClick={() => { onDeleteChat(); onClose(); }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600 group"
          >
            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl transition-colors">
              <Trash2 size={20} />
            </div>
            <span className="font-semibold">Discard group</span>
          </button>
        )}

        {!currentRoom?.isGroup && (
          <button
            onClick={() => { onDeleteChat(); onClose(); }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600 group"
          >
            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl transition-colors">
              <Trash2 size={20} />
            </div>
            <span className="font-semibold">Delete conversation</span>
          </button>
        )}
      </div>
    </BottomSheet>
  );
};

export default GroupSettingsSheet;
