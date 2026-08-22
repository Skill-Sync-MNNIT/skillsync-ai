import { X, Image as ImageIcon } from 'lucide-react';

interface ReplyPreviewProps {
  msg: any;
  onClear?: () => void;
}

/**
 * Inline reply context strip shown above the message input or inside a bubble.
 * Extracted verbatim from the inline ReplyPreview component in Messages.tsx.
 */
export const ReplyPreview = ({ msg, onClear }: ReplyPreviewProps) => {
  if (!msg) return null;
  const isImage = msg.messageType === 'image';
  return (
    <div
      className={`flex items-stretch gap-3 p-2 rounded-xl bg-black/5 dark:bg-white/5 border-l-4 ${
        isImage ? 'border-primary-500' : 'border-primary-600'
      } overflow-hidden relative group/reply min-h-[50px]`}
    >
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-[11px] font-bold text-primary-600 truncate">
          {msg.senderId?.name || 'User'}
        </p>
        {isImage ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ImageIcon size={14} /> <span>Photo</span>
          </div>
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
            {msg.content}
          </p>
        )}
      </div>
      {isImage && (
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shrink-0">
          <img src={msg.content} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
      {onClear && (
        <button
          onClick={onClear}
          className="absolute top-1 right-1 p-1 bg-white/50 dark:bg-[#40414f] rounded-full opacity-0 group-hover/reply:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default ReplyPreview;
