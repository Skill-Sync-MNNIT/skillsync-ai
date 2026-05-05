import { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const SearchHistorySidebar = () => {
  const { conversations, fetchConversations, activeId, setActiveConversation, deleteConversation } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="w-full md:w-64 bg-transparent md:bg-slate-50 dark:md:bg-[#202123] border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#383942] flex flex-col h-full sticky top-0 md:top-16 shrink-0 pt-2 md:pt-6">
      <div className="px-4 mb-6">
        <Button 
          className="w-full justify-start shadow-sm" 
          onClick={() => setActiveConversation(null)}
        >
          <Plus size={16} className="mr-2" />
          New Agent Session
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <p className="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-4">
          Recent Searches
        </p>
        {conversations.length === 0 ? (
          <p className="text-sm text-slate-500 px-2 py-4">No recent sessions.</p>
        ) : (
          conversations.map((c) => (
            <div 
              key={c._id} 
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeId === c._id 
                  ? 'bg-primary-100 dark:bg-[#343541] text-primary-900 dark:text-white' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a2b32]'
              }`}
              onClick={() => setActiveConversation(c._id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={14} className="shrink-0 opacity-70" />
                <span className="text-sm font-medium truncate">{c.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(c._id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
