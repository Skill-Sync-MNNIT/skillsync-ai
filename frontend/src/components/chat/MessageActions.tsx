import { MoreHorizontal, Reply, Edit2, Trash2, UserMinus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MessageActionsProps {
  isMe: boolean;
  onReply: () => void;
  onEdit?: () => void;
  onDeleteMe: () => void;
  onDeleteEveryone?: () => void;
}

export const MessageActions = ({ isMe, onReply, onEdit, onDeleteMe, onDeleteEveryone }: MessageActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('top');
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // If button is in the bottom half of the screen, pop UP. Otherwise pop DOWN.
      if (rect.top > windowHeight / 2) {
        setMenuPosition('top'); // renders bottom-full
      } else {
        setMenuPosition('bottom'); // renders top-full
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        ref={buttonRef}
        onClick={handleToggle}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#2a2b32] rounded-full transition-colors text-slate-400 hover:text-slate-600"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div 
          className={`absolute z-[50] ${
            menuPosition === 'top' 
              ? 'bottom-full mb-2 origin-bottom' 
              : 'top-full mt-2 origin-top'
          } w-48 bg-white dark:bg-[#2a2b32] rounded-xl shadow-xl border border-slate-100 dark:border-[#565869] py-1 animate-in fade-in zoom-in-95 ${
            isMe ? 'right-0 origin-right' : 'left-0 origin-left'
          }`}
        >
          <button 
            onClick={() => { onReply(); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#343541] transition-colors"
          >
            <Reply size={14} /> Reply
          </button>
          
          {isMe && onEdit && (
            <button 
              onClick={() => { onEdit(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#343541] transition-colors"
            >
              <Edit2 size={14} /> Edit
            </button>
          )}

          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

          <button 
            onClick={() => { onDeleteMe(); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <UserMinus size={14} /> Delete for me
          </button>

          {isMe && onDeleteEveryone && (
            <button 
              onClick={() => { onDeleteEveryone(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <Trash2 size={14} /> Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
};
