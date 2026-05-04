import { Search, Plus } from 'lucide-react';
import { BottomSheet } from '../../ui/BottomSheet';
import { EmptyState } from '../../ui/EmptyState';

interface AddMemberSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: any;
  user: any;
  myConnections: any[];
  addMemberQuery: string;
  setAddMemberQuery: (val: string) => void;
  isFetchingConnections: boolean;
  onAddMember: (userId: string, name: string) => void;
}

/**
 * Bottom sheet for searching and adding connections to a group.
 * Extracted from Messages.tsx lines 1331–1414.
 */
export const AddMemberSheet = ({
  isOpen,
  onClose,
  currentRoom,
  user,
  myConnections,
  addMemberQuery,
  setAddMemberQuery,
  isFetchingConnections,
  onAddMember,
}: AddMemberSheetProps) => {
  const eligibleConnections = myConnections
    .map((conn: any) => {
      const other =
        conn.requester?._id === user?._id ? conn.recipient : conn.requester;
      return other;
    })
    .filter(
      (u: any) =>
        u && !currentRoom?.participants?.some((p: any) => p._id === u._id)
    );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Group"
    >
      <div className="flex flex-col h-[70vh] max-h-[600px]">
        <div className="p-4 border-b dark:border-[#383942] space-y-4">
          <div className="relative group">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search connections to add..."
              className="w-full bg-slate-50 dark:bg-[#202123] border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/10 transition-all outline-none font-medium"
              value={addMemberQuery}
              onChange={(e) => setAddMemberQuery(e.target.value)}
            />
            {isFetchingConnections && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="px-1">
            <p className="text-[10px] text-slate-400">
              Only connections not already in the group are shown.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {eligibleConnections.map((u: any) => (
            <div
              key={u._id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#2a2b32]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center font-bold">
                  {u.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{u.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{u.role}</p>
                </div>
              </div>
              <button
                onClick={() => onAddMember(u._id, u.name)}
                className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
          ))}

          {eligibleConnections.length === 0 && !isFetchingConnections && (
            <EmptyState
              icon={Search}
              title="No connections found"
              description={
                addMemberQuery
                  ? `No connections matching "${addMemberQuery}"`
                  : "You've added all your connections to this group!"
              }
              className="py-12"
            />
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default AddMemberSheet;
