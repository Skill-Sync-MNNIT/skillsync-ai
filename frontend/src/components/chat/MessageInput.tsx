import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image as ImageIcon, X, Edit3 } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Button } from '../ui/Button';
import { cn } from '../ui/Button';
import { ReplyPreview } from './ReplyPreview';

interface MessageInputProps {
  newMessage: string;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEmojiClick: (emojiData: any) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  editingMessage: any;
  replyTo: any;
  onCancelEdit: () => void;
  onCancelReply: () => void;
}

/**
 * The full message composition area: text input, emoji picker, image attachment,
 * reply preview, and edit-mode indicator.
 * Extracted from Messages.tsx lines 981–1081.
 */
export const MessageInput = ({
  newMessage,
  onMessageChange,
  onSubmit,
  onEmojiClick,
  onImageUpload,
  isUploading,
  editingMessage,
  replyTo,
  onCancelEdit,
  onCancelReply,
}: MessageInputProps) => {
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Overlays: Edit / Reply (Flex Sibling, not absolute) */}
      {(replyTo || editingMessage) && (
        <div className="px-2 sm:px-4 pb-2 space-y-2 z-10 bg-transparent flex flex-col items-center">
          <div className="w-full max-w-full lg:max-w-4xl">
            {replyTo && (
              <div className="pointer-events-auto">
                <ReplyPreview msg={replyTo} onClear={onCancelReply} />
              </div>
            )}
            {editingMessage && (
              <div className="p-3 bg-white/95 dark:bg-[#202123]/95 backdrop-blur rounded-xl border-l-[6px] border-amber-500 shadow-xl flex items-center justify-between pointer-events-auto ring-1 ring-slate-200 dark:ring-slate-800">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-500 shrink-0">
                    <Edit3 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">
                      Editing message
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate italic">
                      {editingMessage.content}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#2a2b32] rounded-full transition-colors shrink-0"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="p-2 sm:p-4 bg-white dark:bg-[#202123] border-t dark:border-[#383942] relative z-20 shrink-0"
      >
        <div className="flex items-center gap-1 sm:gap-3 bg-slate-50 dark:bg-[#2a2b32] p-1 sm:p-1.5 rounded-[28px] ring-1 ring-inset ring-slate-200 dark:ring-slate-700/50">
          <div className="relative flex items-center shrink-0" ref={emojiRef}>
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              className={cn(
                'p-1.5 sm:p-2 ml-0.5 sm:ml-1 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-[#343541]',
                showEmojis
                  ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-slate-400 hover:text-primary-600'
              )}
            >
              <Smile size={22} className="sm:w-6 sm:h-6" />
            </button>
            {showEmojis && (
              <div className="absolute bottom-full left-0 mb-4 shadow-2xl z-[100] scale-90 sm:scale-100 origin-bottom-left max-w-[90vw]">
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    onEmojiClick(emojiData);
                    if (window.innerWidth < 640) setShowEmojis(false);
                  }}
                  theme={Theme.AUTO}
                  width={320}
                  height={400}
                  lazyLoadEmojis={true}
                />
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder={editingMessage ? 'Edit message...' : 'Type message...'}
            className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-[14px] sm:text-[15px] text-slate-900 dark:text-white py-2 px-1 placeholder:text-slate-400 focus:outline-none outline-none"
            value={newMessage}
            onChange={onMessageChange}
          />

          <div className="flex items-center gap-0.5 sm:gap-1 pr-1 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                // Strictly only allow images in chat
                if (file.type.startsWith('image/')) {
                  onImageUpload(e);
                } else {
                  alert('Only images (JPG, PNG) are allowed for now.');
                }
              }}
              accept=".jpg,.jpeg,.png"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'p-1.5 sm:p-2 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-[#343541]',
                isUploading ? 'animate-spin text-primary-600' : 'text-slate-400 hover:text-primary-600'
              )}
              disabled={isUploading}
            >
              <ImageIcon size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>

            <Button
              type="submit"
              size="sm"
              className="rounded-full h-9 w-9 sm:h-11 sm:w-11 p-0 flex items-center justify-center bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 transform active:scale-95 transition-all shrink-0"
            >
              <Send size={18} className="ml-0.5 sm:ml-1 sm:w-[22px] sm:h-[22px]" />
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};

export default MessageInput;
