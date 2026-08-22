import { Search, Check, X } from 'lucide-react';
import { BottomSheet } from '../../ui/BottomSheet';
import { EmptyState } from '../../ui/EmptyState';

interface MembersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: any;
  user: any;
  memberSearch: string;
  setMemberSearch: (val: string) => void;
  onManageMember: (participantId: string, action: 'promote' | 'demote' | 'remove', isAdmin: boolean) => void;
}

/**
 * Bottom sheet that lists all group members with admin promote/remove controls.
 * Extracted from Messages.tsx lines 1222–1329.
 */
export const MembersSheet = ({
  isOpen,
  onClose,
  currentRoom,
  user,
  memberSearch,
  setMemberSearch,
  onManageMember,
}: MembersSheetProps) => {
  const filteredParticipants = currentRoom?.participants?.filter(
    (p: any) => p.name.toLowerCase().includes(memberSearch.toLowerCase())
  ) || [];

  const isCurrentUserAdmin = currentRoom?.admins?.some(
    (a: any) => (a._id || a) === user?._id
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => { onClose(); setMemberSearch(''); }}
      title="Group Members"
    >
      <div className="flex flex-col h-[70vh] max-h-[600px]">
        <div className="p-4 border-b dark:border-[#383942] space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search group members..."
              className="w-full bg-slate-50 dark:bg-[#202123] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredParticipants.map((participant: any) => {
            const isAdmin = currentRoom?.admins?.some(
              (a: any) => (a._id || a) === participant._id
            );
            const isMe = participant._id === user?._id;

            return (
              <div
                key={participant._id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#2a2b32]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                    {participant.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      {participant.name}{' '}
                      {isMe && (
                        <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-600 px-1.5 py-0.5 rounded text-xs">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{participant.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full uppercase tracking-tighter">
                      Admin 👑
                    </span>
                  )}

                  {isCurrentUserAdmin && !isMe && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onManageMember(participant._id, isAdmin ? 'demote' : 'promote', isAdmin)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-[#343541] rounded-lg text-slate-400 hover:text-primary-600 transition-colors"
                        title={isAdmin ? 'Dismiss as Admin' : 'Make Group Admin'}
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => {
                          onManageMember(participant._id, 'remove', isAdmin);
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove from Group"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredParticipants.length === 0 && (
            <EmptyState
              icon={Search}
              title="No members found"
              description={`No results matching "${memberSearch}"`}
              className="py-12"
            />
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default MembersSheet;
