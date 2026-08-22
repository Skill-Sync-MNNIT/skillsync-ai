import { Check, CheckCheck, Image as ImageIcon, FileText } from 'lucide-react';
import { MessageActions } from './MessageActions';
import { cn } from '../ui/Button';

interface MessageBubbleProps {
  msg: any;
  isMe: boolean;
  isConsecutive: boolean;
  currentRoom: any;
  onReply: () => void;
  onEdit?: () => void;
  onDeleteMe: () => void;
  onDeleteEveryone?: () => void;
  onScrollToMessage: (messageId: string) => void;
  onSetRef: (el: HTMLDivElement | null) => void;
}

/**
 * Renders a single chat message bubble with all its sub-elements:
 * group sender name, reply context, content (text/image/file/deleted),
 * timestamp, delivery ticks, and the MessageActions context menu.
 * Extracted from Messages.tsx lines 832–962.
 */
export const MessageBubble = ({
  msg,
  isMe,
  isConsecutive,
  currentRoom,
  onReply,
  onEdit,
  onDeleteMe,
  onDeleteEveryone,
  onScrollToMessage,
  onSetRef,
}: MessageBubbleProps) => {
  // Delivery tick logic
  const isRead = currentRoom?.isGroup
    ? currentRoom?.participants.length > 1 &&
      (msg.readBy?.length || 0) >= currentRoom?.participants.length - 1
    : msg.readBy?.length > 0;

  const isDelivered = currentRoom?.isGroup
    ? currentRoom?.participants.length > 1 &&
      (msg.deliveredTo?.length || 0) >= currentRoom?.participants.length - 1
    : msg.deliveredTo?.length > 0;

  return (
    <div
      ref={onSetRef}
      className={cn(
        'flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-300 relative',
        'hover:z-[60] focus-within:z-[60]',
        isMe ? 'items-end' : 'items-start',
        isConsecutive ? 'mt-0.5' : 'mt-2.5'
      )}
    >
      <div className="relative max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
        <div
          className={cn(
            'p-2.5 rounded-2xl shadow-sm relative transition-all',
            isMe
              ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white'
              : 'bg-white dark:bg-[#2a2b32] text-slate-900 dark:text-white',
            msg.isDeletedForEveryone && 'italic opacity-60'
          )}
        >
          {/* Group Sender Name (Inside Bubble) */}
          {!isMe && currentRoom?.isGroup && !isConsecutive && (
            <div className="text-[12px] font-bold text-primary-500 dark:text-[#53bdeb] mb-0.5 truncate max-w-[200px] sm:max-w-[250px]">
              ~ {msg.senderId?.name || 'Team Member'}
            </div>
          )}

          {/* Reply context */}
          {msg.replyTo && !msg.isDeletedForEveryone && (
            <div
              onClick={() => {
                const parentId =
                  typeof msg.replyTo === 'string' ? msg.replyTo : msg.replyTo._id;
                onScrollToMessage(parentId);
              }}
              className={cn(
                'mb-2 p-2 rounded-lg text-xs border-l-[3px] overflow-hidden cursor-pointer transition-opacity hover:opacity-80',
                isMe
                  ? 'bg-black/5 dark:bg-white/5 border-primary-500 text-slate-800 dark:text-slate-300'
                  : 'bg-black/5 dark:bg-white/5 border-pink-500 text-slate-600 dark:text-slate-400'
              )}
            >
              <p className="font-bold mb-1 truncate text-primary-600">
                {msg.replyTo.senderId?.name ||
                  (typeof msg.replyTo === 'object' ? 'User' : 'Original message')}
              </p>
              {msg.replyTo.messageType === 'image' ? (
                <div className="flex items-center gap-2 opacity-80">
                  <ImageIcon size={12} /> <span>Photo</span>
                </div>
              ) : (
                <p className="truncate opacity-80">{msg.replyTo.content || 'Original message'}</p>
              )}
            </div>
          )}

          {/* Message content */}
          {msg.messageType === 'image' && !msg.isDeletedForEveryone ? (
            <div className="mb-1">
              <img
                src={msg.content}
                alt="Shared"
                className="rounded-lg max-w-xs sm:max-w-md w-full max-h-[300px] object-contain cursor-pointer hover:opacity-95 transition-all shadow-sm"
                onClick={() => window.open(msg.content, '_blank')}
              />
            </div>
          ) : msg.messageType === 'file' && !msg.isDeletedForEveryone ? (
            <div
              className={`mb-1 p-3 rounded-xl border flex items-center gap-3 ${
                isMe
                  ? 'bg-white/20 border-white/20'
                  : 'bg-slate-50 dark:bg-[#202123] border-slate-100 dark:border-[#383942]'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  isMe ? 'bg-white/20' : 'bg-primary-50 dark:bg-primary-900/20'
                } text-primary-600`}
              >
                <FileText size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{msg.fileName || 'Document'}</p>
                <button
                  type="button"
                  onClick={() => window.open(msg.content, '_blank')}
                  className="text-[10px] uppercase font-bold text-primary-600 hover:underline mt-0.5 block"
                >
                  Open File
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[14px] leading-relaxed break-words">{msg.content}</p>
          )}

          {/* Timestamp + delivery ticks */}
          <div className="mt-1 flex items-center justify-end gap-1.5 opacity-60 select-none">
            {msg.isEdited && (
              <span className="text-[10px] font-medium italic mr-1">Edited</span>
            )}
            <span className="text-[10px] leading-none font-medium">
              {new Date(msg.isEdited ? msg.updatedAt : msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
            {isMe && !msg.isDeletedForEveryone && (
              <div className="flex">
                {isRead ? (
                  <CheckCheck size={14} className="text-sky-500 -ml-1 first:ml-0" />
                ) : isDelivered ? (
                  <CheckCheck size={14} className="text-slate-400 -ml-1 first:ml-0" />
                ) : (
                  <Check size={14} className="text-slate-400" />
                )}
              </div>
            )}
          </div>

          {/* Interaction Actions */}
          {!msg.isDeletedForEveryone && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all z-10 ${
                isMe ? '-left-12' : '-right-12'
              }`}
            >
              <MessageActions
                isMe={isMe}
                onReply={onReply}
                onEdit={
                  isMe &&
                  msg.messageType === 'text' &&
                  Date.now() - new Date(msg.createdAt).getTime() < 30 * 60 * 1000
                    ? onEdit
                    : undefined
                }
                onDeleteMe={onDeleteMe}
                onDeleteEveryone={
                  isMe &&
                  Date.now() - new Date(msg.createdAt).getTime() < 5 * 60 * 60 * 1000
                    ? onDeleteEveryone
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
