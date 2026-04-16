import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Send, MessageSquare, Plus, Users, Hash, Trash2, Smile, MoreVertical, LogOut, Check, CheckCheck, X, Edit3, Image as ImageIcon, FileText, ChevronLeft, Search } from 'lucide-react';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { useSocket } from '../hooks/useSocket';
import { BottomSheet } from '../components/ui/BottomSheet';
import { MessageActions } from '../components/chat/MessageActions';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { cn } from '../components/ui/Button';
import { NoData } from '../components/ui/NoData';
import { useNavigate } from 'react-router-dom';

export const Messages = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState<any[]>([]);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [roomOptionsOpen, setRoomOptionsOpen] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [userStatuses, setUserStatuses] = useState<Record<string, { isOnline: boolean, lastSeen?: string }>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [myConnections, setMyConnections] = useState<any[]>([]);
  const [isFetchingConnections, setIsFetchingConnections] = useState(false);
  const [addMemberQuery, setAddMemberQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastFetchTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isAddMemberModalOpen) {
      setAddMemberQuery('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsFetchingConnections(true);
        const res = await api.get(`/connections/list?search=${addMemberQuery}&limit=50`);
        setMyConnections(res.data.connections || []);
      } catch (err) {
        toast('Failed to search connections', 'error');
      } finally {
        setIsFetchingConnections(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [addMemberQuery, isAddMemberModalOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (messageId: string) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('animate-message-highlight');
      setTimeout(() => element.classList.remove('animate-message-highlight'), 2000);
    }
  };

  const fetchRooms = async () => {
    // Prevent fetching more than once every 5 seconds (debouncing socket reconnections)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) return;
    lastFetchTimeRef.current = now;

    try {
      const res = await api.get('/chats/rooms');
      const roomsData = res.data;

      // Sort rooms manually just in case
      roomsData.sort((a: any, b: any) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.updatedAt).getTime();
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
      setRooms(roomsData);

      // Global Connectivity: Join all rooms and sync delivery status
      if (socket) {
        roomsData.forEach((room: any) => {
          socket.emit('join_room', room._id);
        });
      }

      // Catch-up: Acknowledge delivery in bulk (Optimized)
      if (socket && user?._id && roomsData.length > 0) {
        roomsData.forEach((room: any) => {
          const lastMsg = room.lastMessageDetails;
          if (lastMsg) {
            const senderId = typeof lastMsg.senderId === 'object' ? lastMsg.senderId._id : lastMsg.senderId;
            const isFromOther = String(senderId) !== String(user._id);
            const isNotDelivered = !lastMsg.deliveredTo?.includes(String(user._id));

            if (isFromOther && isNotDelivered) {
              socket.emit('message_delivered', { messageId: lastMsg._id, roomId: room._id });
            }
          }
        });
      }

      // Initialize user statuses
      const initialStatuses: any = {};
      roomsData.forEach((room: any) => {
        room.participants?.forEach((p: any) => {
          initialStatuses[p._id] = { isOnline: p.isOnline, lastSeen: p.lastSeen };
        });
      });
      setUserStatuses(prev => ({ ...initialStatuses, ...prev }));
    } catch (err) {
      console.error('Fetch rooms error:', err);
      toast('Failed to load chat rooms', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const res = await api.get(`/chats/messages/${roomId}`);
      setMessages(res.data);

      // Acknowledge delivery for fetched messages
      if (socket && res.data.length > 0) {
        const undeliveredIds = res.data
          .filter((m: any) => {
            const senderId = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
            return String(senderId) !== String(user?._id) && !m.deliveredTo?.includes(String(user?._id));
          })
          .map((m: any) => m._id);

        if (undeliveredIds.length > 0) {
          socket.emit('message_delivered_bulk', { messageIds: undeliveredIds, roomId });
        }
      }
    } catch (err) {
      toast('Failed to load messages', 'error');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    const roomId = searchParams.get('roomId');
    if (roomId && rooms.length > 0) {
      if (currentRoom?._id !== roomId) {
        const room = rooms.find(r => r._id === roomId);
        if (room) {
          setCurrentRoom(room);
        }
      }
    }
  }, [searchParams, rooms, currentRoom?._id]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message) => {
      // Acknowledge delivery globally if I am the recipient
      const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
      if (String(senderId) !== String(user?._id)) {
        socket.emit('message_delivered', { messageId: message._id, roomId: message.chatRoomId });
      }

      if (currentRoom?._id === message.chatRoomId) {
        setMessages((prev) => [...prev, message]);
        // Update room preview locally even when room is active to keep sidebar in sync
        setRooms((prev) => prev.map(room =>
          room._id === message.chatRoomId
            ? { ...room, lastMessageAt: message.createdAt || new Date().toISOString(), lastMessage: message.content, lastMessageDetails: message }
            : room
        ));
      } else {
        // Increment unread count for background rooms locally
        setRooms((prev) => prev.map(room =>
          room._id === message.chatRoomId
            ? { ...room, unreadCount: (room.unreadCount || 0) + 1, lastMessageAt: message.createdAt || new Date().toISOString(), lastMessage: message.content, lastMessageDetails: message }
            : room
        ));
      }
    });

    socket.on('message_edited', (updatedMessage) => {
      setMessages((prev) => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
    });

    socket.on('message_deleted_everyone', ({ messageId }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, content: 'This message was deleted', isDeletedForEveryone: true } : m));
    });

    socket.on('user_status_change', ({ userId, isOnline, lastSeen }) => {
      setUserStatuses(prev => ({
        ...prev,
        [userId]: { isOnline, lastSeen }
      }));
    });

    socket.on('group_renamed', ({ roomId, name }) => {
      if (currentRoom?._id === roomId) {
        setCurrentRoom((prev: any) => prev ? { ...prev, name } : null);
        fetchRooms();
      }
    });

    socket.on('user_typing', ({ userId: typingId, isTyping: typingStatus, roomId: typingRoomId, userName }) => {
      // Only show typing for the active room
      if (String(currentRoom?._id) === String(typingRoomId) && String(typingId) !== String(user?._id)) {
        if (typingStatus) {
          setTypingUser(userName || 'Someone');
        } else {
          setTypingUser(null);
        }
      }
    });

    socket.on('connect', () => {
      console.log('Socket reconnected, fetching rooms for status catch-up...');
      fetchRooms();
    });

    socket.on('message_status_update', ({ messageId, deliveredTo, readBy }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deliveredTo, readBy } : m));
    });

    socket.on('messages_marked_read', ({ roomId, userId }) => {
      setRooms((prev) => prev.map(room =>
        room._id === roomId
          ? { ...room, unreadCount: 0 }
          : room
      ));
      setMessages(prev => prev.map(m => {
        const pid = String(userId);
        const messageRoomId = String(m.chatRoomId);
        const eventRoomId = String(roomId);
        const senderId = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;

        if (messageRoomId === eventRoomId && String(senderId) === String(user?._id) && !m.readBy?.includes(pid)) {
          return { ...m, readBy: [...(m.readBy || []), pid] };
        }
        return m;
      }));
    });

    socket.on('room_discarded', ({ roomId, adminId }) => {
      setRooms((prev) => prev.filter(r => r._id !== roomId));
      if (typeof currentRoom === 'object' && currentRoom?._id === roomId) {
        setCurrentRoom(null);
        setMessages([]);
        setSearchParams({});
        // Only show the alert to non-admins (Admins get the API success toast instead)
        if (String(adminId) !== String(user?._id)) {
          toast('This group has been discarded by the admin', 'info');
        }
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('message_edited');
      socket.off('message_deleted_everyone');
      socket.off('user_status_change');
      socket.off('group_renamed');
      socket.off('user_typing');
      socket.off('message_status_update');
      socket.off('messages_marked_read');
      socket.off('room_discarded');
    };
  }, [socket, currentRoom, user?._id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentRoom) {
      fetchMessages(currentRoom?._id);
      setTypingUser(null);

      // Clear unread count locally for the active room
      setRooms((prev) => prev.map(room =>
        room._id === currentRoom?._id ? { ...room, unreadCount: 0 } : room
      ));

      // Join socket room for real-time updates
      if (socket) {
        socket.emit('join_room', currentRoom?._id);
        socket.emit('mark_read', { roomId: currentRoom?._id });
      }
    } else {
      setMessages([]);
    }
  }, [currentRoom, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (socket && currentRoom) {
      const myName = user?.name || user?.email?.split('@')[0] || 'Someone';
      socket.emit('typing', { roomId: currentRoom?._id, isTyping: true, userName: myName });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomId: currentRoom?._id, isTyping: false, userName: myName });
      }, 3000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom) return;

    try {
      if (editingMessage) {
        await api.patch(`/chats/messages/${editingMessage._id}`, { content: newMessage });
        setEditingMessage(null);
      } else {
        await api.post('/chats/messages', {
          roomId: currentRoom?._id,
          content: newMessage,
          replyTo: replyTo?._id,
        });
      }
      setNewMessage('');
      setReplyTo(null);
      setShowEmojis(false);
      try {
        if (socket) {
          const myName = user?.name || user?.email?.split('@')[0] || 'Someone';
          socket.emit('typing', { roomId: currentRoom?._id, isTyping: false, userName: myName });
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to send message';
        toast(errorMsg, 'error');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to send message';
      toast(errorMsg, 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentRoom) return;

    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be less than 5MB', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('roomId', currentRoom?._id);

    try {
      await api.post('/chats/messages/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast('Image sent', 'success');
    } catch (err) {
      toast('Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const handleRenameRoom = async () => {
    if (!newNameInput.trim() || !currentRoom) return;
    try {
      await api.patch(`/chats/rooms/${currentRoom?._id}`, { name: newNameInput });
      toast('Group renamed', 'success');
      setIsRenaming(false);
      setRoomOptionsOpen(false);
    } catch (err: any) {
      toast(err.response?.data?.error || err.response?.data?.message || 'Failed to rename', 'error');
    }
  };

  const handleEditMessage = (msg: any) => {
    setEditingMessage(msg);
    setNewMessage(msg.content);
    setReplyTo(null);
  };

  const handleDeleteForEveryone = async (msgId: string) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      await api.delete(`/chats/messages/${msgId}/everyone`);
      toast('Message deleted for everyone', 'success');
    } catch (err) {
      toast('Failed to delete message', 'error');
    }
  };

  const handleDeleteForMe = async (msgId: string) => {
    try {
      await api.delete(`/chats/messages/${msgId}/me`);
      setMessages(prev => prev.filter(m => m._id !== msgId));
      toast('Deleted for me', 'success');
    } catch (err) {
      toast('Failed to delete message', 'error');
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const ReplyPreview = ({ msg, onClear }: { msg: any, onClear?: () => void }) => {
    if (!msg) return null;
    const isImage = msg.messageType === 'image';
    return (
      <div className={`flex items-stretch gap-3 p-2 rounded-xl bg-black/5 dark:bg-white/5 border-l-4 ${isImage ? 'border-primary-500' : 'border-primary-600'} overflow-hidden relative group/reply min-h-[50px]`}>
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-[11px] font-bold text-primary-600 truncate">
            {msg.senderId?.name || 'User'}
          </p>
          {isImage ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ImageIcon size={14} /> <span>Photo</span>
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">{msg.content}</p>
          )}
        </div>
        {isImage && (
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shrink-0">
            <img src={msg.content} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        {onClear && (
          <button onClick={onClear} className="absolute top-1 right-1 p-1 bg-white/50 dark:bg-slate-800/50 rounded-full opacity-0 group-hover/reply:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        )}
      </div>
    );
  };

  const getRoomStatus = () => {
    if (!currentRoom) return null;

    if (currentRoom?.isGroup) {
      const onlineCount = currentRoom?.participants?.filter((p: any) => {
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
      return <span className="text-slate-500">{currentRoom?.participants?.length || 0} members</span>;
    }

    const otherParticipant = currentRoom?.participants?.find((p: any) => String(p._id) !== String(user?._id));
    if (!otherParticipant) return null;

    const status = userStatuses[String(otherParticipant._id)];
    const isOnline = status ? status.isOnline : otherParticipant.isOnline;

    if (isOnline) return <span className="text-green-500 font-medium">Online</span>;

    const lastSeen = status?.lastSeen || otherParticipant.lastSeen;
    if (!lastSeen) return <span className="text-slate-400">Offline</span>;

    const date = new Date(lastSeen);
    const isToday = new Date().toDateString() === date.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <span className="text-slate-500">
        Last seen {isToday ? 'today' : date.toLocaleDateString()} at {timeStr}
      </span>
    );
  };

  const handleLeaveGroup = async () => {
    if (!currentRoom || !window.confirm('Leave this group?')) return;
    try {
      await api.delete(`/chats/rooms/${currentRoom?._id}/leave`);
      toast('Left group', 'success');
      setCurrentRoom(null);
      fetchRooms();
      setRoomOptionsOpen(false);
    } catch (err) {
      toast('Failed to leave group', 'error');
    }
  };

  const handleDeleteChat = async () => {
    if (!currentRoom) return;

    const confirmMsg = currentRoom.isGroup
      ? `Discard "${currentRoom.name || 'this group'}"? This will permanently remove all members and delete all chat history for everyone. This cannot be undone.`
      : "Are you sure you want to delete this conversation? This action cannot be undone.";

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/chats/rooms/${currentRoom?._id}`);
      toast(currentRoom.isGroup ? 'Group discarded' : 'Chat deleted', 'success');
      setCurrentRoom(null);
      fetchRooms();
      setRoomOptionsOpen(false);
    } catch (err) {
      toast('Failed to delete', 'error');
    }
  };

  const handleClearChat = async () => {
    if (!currentRoom || !window.confirm('Clear all messages in this group? History will be lost.')) return;
    try {
      await api.delete(`/chats/rooms/${currentRoom?._id}/messages`);
      toast('Messages cleared', 'success');
      setMessages([]);
      fetchRooms();
      setRoomOptionsOpen(false);
    } catch (err) {
      toast('Failed to clear messages', 'error');
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-slate-950 overflow-hidden relative">
      {/* Sidebar: Rooms */}
      <div className={cn(
        "w-full md:w-[380px] border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/30 dark:bg-slate-900/40 transition-all duration-300",
        showMobileChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 bg-white dark:bg-slate-950/80 backdrop-blur-md space-y-4">
          <div className="flex justify-between items-center text-slate-900 dark:text-white">
            <h2 className="font-extrabold flex items-center gap-2 text-xl tracking-tight">
              <MessageSquare size={22} className="text-primary-600" /> Messages
            </h2>
            <Button
              size="sm"
              variant="ghost"
              className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-primary-600 shadow-none border border-slate-100 dark:border-slate-800"
              onClick={() => setIsGroupModalOpen(true)}
            >
              <Plus size={22} />
            </Button>
          </div>

          <div className="relative group px-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 shadow-sm focus:shadow-lg focus:shadow-primary-500/5 focus:-translate-y-0.5 transition-all duration-300 placeholder:text-slate-400 font-medium"
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 text-slate-900 dark:text-white">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 p-3 text-slate-900 dark:text-white">
                  <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl shrink-0 text-slate-900 dark:text-white" />
                  <div className="flex-1 space-y-2 py-1 text-slate-900 dark:text-white">
                    <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 animate-pulse rounded text-slate-900 dark:text-white" />
                    <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded text-slate-900 dark:text-white" />
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.filter(r => {
            const other = r.participants.find((p: any) => String(p._id) !== String(user?._id));
            const name = r.isGroup ? r.name : (other?.name || 'Quick Chat');
            return name.toLowerCase().includes(roomSearch.toLowerCase());
          }).length === 0 ? (
            <NoData
              type="chat"
              title={roomSearch ? "No Search Results" : "No Messages Yet"}
              description={roomSearch
                ? `Couldn't find any conversations matching "${roomSearch}".`
                : "Your inbox is empty. Start a new conversation to get connected!"
              }
              height="180px"
              action={
                !roomSearch && (
                  <Button size="sm" onClick={() => navigate('/networking')} variant="outline">
                    Start a Chat
                  </Button>
                )
              }
            />
          ) : (
            rooms.filter(r => {
              const other = r.participants.find((p: any) => String(p._id) !== String(user?._id));
              const name = r.isGroup ? r.name : (other?.name || 'Quick Chat');
              return name.toLowerCase().includes(roomSearch.toLowerCase());
            }).map((room) => {
              const otherParticipant = room.participants.find((p: any) => String(p._id) !== String(user?._id));
              const otherId = otherParticipant?._id;
              const isActive = currentRoom?._id === room._id;

              return (
                <div
                  key={room._id}
                  onClick={() => { setCurrentRoom(room); setShowMobileChat(true); setSearchParams({ roomId: room._id }); }}
                  className={cn(
                    "group relative mx-2 mb-1 px-4 py-3 cursor-pointer transition-all duration-300 rounded-2xl text-slate-900 dark:text-white overflow-hidden",
                    isActive
                      ? "bg-primary-50/60 dark:bg-primary-900/30 ring-1 ring-primary-100/50 dark:ring-primary-800/40 shadow-sm"
                      : "hover:bg-primary-50/30 dark:hover:bg-white/[0.04]"
                  )}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary-600 rounded-r-full shadow-[0_0_12px_rgba(37,99,235,0.6)] z-20" />
                  )}

                  {/* Subtle Hover Background Shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400/10 dark:from-primary-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="flex items-center gap-3 text-slate-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1 relative z-10">
                    <div className="relative h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold overflow-hidden shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                      {room.isGroup ? (
                        <div className="bg-primary-100 dark:bg-primary-900/20 w-full h-full flex items-center justify-center">
                          <Users size={24} className="text-primary-600" />
                        </div>
                      ) : (
                        <div className="bg-slate-100 dark:bg-slate-800 w-full h-full flex items-center justify-center text-lg uppercase tracking-tighter">
                          {otherParticipant?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      {!room.isGroup && otherId && (userStatuses[otherId] ? userStatuses[otherId].isOnline : otherParticipant?.isOnline) && (
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] border-white dark:border-slate-950 rounded-full z-10" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className={cn(
                          "font-bold text-sm truncate transition-colors duration-300",
                          isActive ? "text-primary-700 dark:text-primary-400" : "text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400"
                        )}>
                          {room.isGroup ? room.name : otherParticipant?.name || 'Quick Chat'}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight">
                          {room.lastMessageAt ? new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-900 dark:text-white">
                        <p className="text-xs text-slate-500 truncate flex-1 flex items-center gap-1.5 min-w-0 pr-2">
                          {(room.lastMessageDetails?.senderId === user?._id || room.lastMessageDetails?.senderId?._id === user?._id) && (
                            <CheckCheck size={14} className={cn("shrink-0", room.lastMessageDetails?.readBy?.length > 0 ? "text-blue-400" : "text-slate-300")} />
                          )}
                          <span className="truncate">
                            {(room.lastMessage?.startsWith('http') && room.lastMessage?.includes('cloudinary')) || room.lastMessage === '📷 Photo' ? (
                              <span className="flex items-center gap-1"><ImageIcon size={12} className="shrink-0" /> Photo</span>
                            ) : (room.lastMessage?.startsWith('http') && room.lastMessage?.includes('chat_files')) || room.lastMessage === '📎 Document' ? (
                              <span className="flex items-center gap-1"><FileText size={12} className="shrink-0" /> Document</span>
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
      {/* Main: Messages */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden transition-all duration-300",
        !showMobileChat ? "hidden md:flex" : "flex"
      )}>
        {currentRoom ? (
          <>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between shadow-sm z-20">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                  onClick={() => setShowMobileChat(false)}
                >
                  <ChevronLeft size={22} className="text-slate-600 dark:text-slate-400" />
                </Button>

                <div
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary-600 font-bold cursor-pointer shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-900"
                  onClick={() => {
                    const other = currentRoom?.participants.find((p: any) => String(p._id) !== String(user?._id));
                    if (other && !currentRoom?.isGroup) {
                      window.open(`/profile/${other.email?.split('@')[0] || other._id}`, '_blank');
                    }
                  }}
                >
                  {currentRoom?.isGroup ? <Users size={22} /> : currentRoom?.participants.find((p: any) => p._id !== user?._id)?.name?.charAt(0) || 'U'}
                </div>

                <div
                  className={cn("min-w-0 flex flex-col justify-center", !currentRoom?.isGroup && "cursor-pointer hover:opacity-80 transition-opacity")}
                  onClick={() => {
                    const other = currentRoom?.participants.find((p: any) => String(p._id) !== String(user?._id));
                    if (other && !currentRoom?.isGroup) {
                      window.open(`/profile/${other.email?.split('@')[0] || other._id}`, '_blank');
                    }
                  }}
                >
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate leading-tight">
                    {currentRoom?.isGroup ? currentRoom?.name : currentRoom?.participants.find((p: any) => p._id !== user?._id)?.name || 'Direct Message'}
                  </h3>
                  <div className="flex items-center gap-1.5 h-4 mt-0.5 text-slate-900 dark:text-white">
                    {getRoomStatus() ? (
                      <>
                        {!currentRoom?.isGroup && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full ring-1 ring-white dark:ring-slate-900",
                            (userStatuses[String(currentRoom?.participants.find((p: any) => String(p._id) !== String(user?._id))?._id)]?.isOnline ?? currentRoom?.participants.find((p: any) => String(p._id) !== String(user?._id))?.isOnline)
                              ? 'bg-green-500 animate-pulse'
                              : 'bg-slate-300'
                          )} />
                        )}
                        <p className="text-[10px] text-slate-500 font-medium leading-none truncate">{getRoomStatus()}</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-medium leading-none italic animate-pulse">Syncing status...</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setRoomOptionsOpen(true)}
                >
                  <MoreVertical size={20} className="text-slate-500" />
                </Button>
              </div>
            </div>

            {/* Message Area with Wallpaper Background */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 bg-slate-50/30 dark:bg-[#0b141a]/20 relative">
              {/* Wallpaper Pattern Overlay */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0" />

              <div className="relative z-10 flex flex-col space-y-4 pt-2">
                {messages.filter(m => !m.deletedBy?.includes(user?._id)).map((msg, idx) => {
                  const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                  const prevMsg = messages[idx - 1];
                  const isConsecutive = prevMsg?.senderId?._id === (msg.senderId?._id || msg.senderId);

                  if (msg.messageType === 'system') {
                    return (
                      <div key={msg._id} className="flex justify-center my-2 animate-in fade-in zoom-in duration-500">
                        <div className="bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-1 rounded-full text-[11px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200/30 dark:border-slate-700/30 shadow-sm transition-all">
                          <span className="opacity-40 mr-2">—</span>
                          {msg.content}
                          <span className="opacity-40 ml-2">—</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id}
                      ref={(el) => { messageRefs.current[msg._id] = el; }}
                      className={cn(
                        "flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-300 relative",
                        "hover:z-[60] focus-within:z-[60]",
                        isMe ? 'items-end' : 'items-start',
                        isConsecutive ? "mt-1" : "mt-4"
                      )}
                    >


                      <div className="relative max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
                        <div
                          className={cn(
                            "p-2.5 rounded-2xl shadow-sm relative transition-all",
                            isMe
                              ? 'bg-[#E7FFDB] dark:bg-[#056162] text-slate-900 dark:text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none',
                            isConsecutive && (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl"),
                            msg.isDeletedForEveryone && 'italic opacity-60'
                          )}
                        >
                          {/* Tail Effect - Only for first msg in a group */}
                          {!isConsecutive && (
                            <div className={cn(
                              "absolute top-0 w-3 h-3 block",
                              isMe ? "-right-1.5" : "-left-1.5"
                            )}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d={isMe ? "M0 0C6 0 12 0 12 0V12C12 12 6 6 0 0Z" : "M12 0C6 0 0 0 0 0V12C0 12 6 6 12 0Z"}
                                  fill={isMe ? (typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? "#056162" : "#E7FFDB") : (typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? "#1e293b" : "#ffffff")} />
                              </svg>
                            </div>
                          )}

                          {/* Group Sender Name (Inside Bubble) */}
                          {!isMe && currentRoom?.isGroup && !isConsecutive && (
                            <div className="text-[12px] font-bold text-primary-500 dark:text-[#53bdeb] mb-0.5 truncate max-w-[200px] sm:max-w-[250px]">
                              ~ {msg.senderId?.name || 'Team Member'}
                            </div>
                          )}
                          {/* Reply Quote UI */}
                          {msg.replyTo && !msg.isDeletedForEveryone && (
                            <div
                              onClick={() => {
                                const parentId = typeof msg.replyTo === 'string' ? msg.replyTo : msg.replyTo._id;
                                scrollToMessage(parentId);
                              }}
                              className={`mb-2 p-2 rounded-lg text-xs border-l-4 overflow-hidden cursor-pointer transition-opacity hover:opacity-80 ${isMe ? 'bg-[#C8E6C9]/50 border-primary-500 text-slate-800 dark:text-slate-300' : 'bg-slate-50 dark:bg-slate-900/50 border-primary-500 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                              <p className="font-bold mb-1 truncate text-primary-600">
                                {msg.replyTo.senderId?.name || (typeof msg.replyTo === 'object' ? 'User' : 'Original message')}
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

                          {msg.messageType === 'image' && !msg.isDeletedForEveryone ? (
                            <div className="mb-1">
                              <img
                                src={msg.content}
                                alt="Shared"
                                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity min-w-[200px]"
                                onClick={() => window.open(msg.content, '_blank')}
                              />
                            </div>
                          ) : msg.messageType === 'file' && !msg.isDeletedForEveryone ? (
                            <div className={`mb-1 p-3 rounded-xl border flex items-center gap-3 ${isMe ? 'bg-white/20 border-white/20' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                              }`}>
                              <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-primary-50 dark:bg-primary-900/20'} text-primary-600`}>
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

                          <div className="mt-1 flex items-center justify-end gap-1.5 opacity-80">
                            <span className="text-[10px] leading-none">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && !msg.isDeletedForEveryone && (
                              <div className="flex">
                                {(() => {
                                  const isRead = currentRoom?.isGroup
                                    ? (currentRoom?.participants.length > 1 && (msg.readBy?.length || 0) >= currentRoom?.participants.length - 1)
                                    : (msg.readBy?.length > 0);

                                  const isDelivered = currentRoom?.isGroup
                                    ? (currentRoom?.participants.length > 1 && (msg.deliveredTo?.length || 0) >= currentRoom?.participants.length - 1)
                                    : (msg.deliveredTo?.length > 0);

                                  if (isRead) return <CheckCheck size={14} className="text-blue-400 -ml-1 first:ml-0" />;
                                  if (isDelivered) return <CheckCheck size={14} className="text-slate-400 -ml-1 first:ml-0" />;
                                  return <Check size={14} className="text-slate-400" />;
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Interaction Actions */}
                          {!msg.isDeletedForEveryone && (
                            <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all z-10 ${isMe ? '-left-12' : '-right-12'
                              }`}>
                              <MessageActions
                                isMe={isMe}
                                onReply={() => setReplyTo(msg)}
                                onEdit={(isMe && msg.messageType === 'text' && (Date.now() - new Date(msg.createdAt).getTime() < 30 * 60 * 1000)) ? () => handleEditMessage(msg) : undefined}
                                onDeleteMe={() => handleDeleteForMe(msg._id)}
                                onDeleteEveryone={(isMe && (Date.now() - new Date(msg.createdAt).getTime() < 5 * 60 * 60 * 1000)) ? () => handleDeleteForEveryone(msg._id) : undefined}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {typingUser && (
                  <div className="px-6 py-2 flex items-center animate-fade-in">
                    <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm">
                      <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-typing-dot"></div>
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-typing-dot [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-typing-dot [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-slate-600 dark:text-slate-300 font-medium text-xs ml-1">{typingUser} is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Overlays: Edit / Reply (Flex Sibling, not absolute) */}
            {(replyTo || editingMessage) && (
              <div className="px-2 sm:px-4 pb-2 space-y-2 z-10 bg-transparent flex flex-col items-center">
                <div className="w-full max-w-full lg:max-w-4xl">
                  {replyTo && (
                    <div className="pointer-events-auto">
                      <ReplyPreview msg={replyTo} onClear={() => setReplyTo(null)} />
                    </div>
                  )}
                  {editingMessage && (
                    <div className="p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl border-l-[6px] border-amber-500 shadow-xl flex items-center justify-between pointer-events-auto ring-1 ring-slate-200 dark:ring-slate-800">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-500 shrink-0">
                          <Edit3 size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">Editing message</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate italic">{editingMessage.content}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0">
                        <X size={18} className="text-slate-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="p-2 sm:p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 relative z-20 shrink-0">
              <div className="flex items-center gap-1 sm:gap-3 bg-slate-50 dark:bg-slate-800 p-1 sm:p-1.5 rounded-[28px] ring-1 ring-inset ring-slate-200 dark:ring-slate-700/50">
                <div className="relative flex items-center shrink-0" ref={emojiRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojis(!showEmojis)}
                    className={cn(
                      "p-1.5 sm:p-2 ml-0.5 sm:ml-1 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700",
                      showEmojis ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20" : "text-slate-400 hover:text-primary-600"
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
                  placeholder={editingMessage ? "Edit message..." : "Type message..."}
                  className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-[14px] sm:text-[15px] text-slate-900 dark:text-white py-2 px-1 placeholder:text-slate-400 focus:outline-none outline-none"
                  value={newMessage}
                  onChange={handleTyping}
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
                        handleImageUpload(e);
                      } else {
                        toast('Only images (JPG, PNG) are allowed for now.', 'info');
                      }
                    }}
                    accept=".jpg,.jpeg,.png"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "p-1.5 sm:p-2 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700",
                      isUploading ? "animate-spin text-primary-600" : "text-slate-400 hover:text-primary-600"
                    )}
                    disabled={isUploading}
                  >
                    <ImageIcon size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </button>

                  <Button type="submit" size="sm" className="rounded-full h-9 w-9 sm:h-11 sm:w-11 p-0 flex items-center justify-center bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 transform active:scale-95 transition-all shrink-0">
                    <Send size={18} className="ml-0.5 sm:ml-1 sm:w-[22px] sm:h-[22px]" />
                  </Button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <NoData
            type="chat"
            title="SkillSync Messaging"
            description="Send and receive messages with your network securely and in real-time."
          />
        )}
      </div>

      {/* Room Options BottomSheet */}
      <BottomSheet
        isOpen={roomOptionsOpen}
        onClose={() => { setRoomOptionsOpen(false); setIsRenaming(false); }}
        title={currentRoom?.isGroup ? "Group Settings" : "Chat Settings"}
      >
        <div className="p-4 space-y-4">
          {currentRoom?.isGroup && (
            <div className={cn(
              "p-4 rounded-2xl transition-all duration-300",
              isRenaming ? "bg-primary-50 dark:bg-primary-900/10 ring-1 ring-primary-500/20" : "bg-slate-50 dark:bg-slate-800"
            )}>
              {isRenaming ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Rename Group</p>
                    <button onClick={() => setIsRenaming(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-white dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 transition-all shadow-inner"
                      value={newNameInput}
                      onChange={(e) => setNewNameInput(e.target.value)}
                      placeholder="Enter new group name..."
                      autoFocus
                    />
                    <Button size="sm" onClick={handleRenameRoom} className="px-5 shadow-lg shadow-primary-500/25">Save</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setIsRenaming(true); setNewNameInput(currentRoom?.name || ''); }}
                  className="w-full flex items-center gap-4 text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-all group/rename py-1"
                >
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm group-hover/rename:scale-110 transition-transform">
                    <Edit3 size={18} className="text-slate-400 group-hover/rename:text-primary-600" />
                  </div>
                  <span className="font-semibold">Rename Group</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => { handleClearChat(); setRoomOptionsOpen(false); }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 group"
          >
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors"><Hash size={20} className="group-hover:text-primary-600" /></div>
            <span className="font-semibold">Clear chat history</span>
          </button>

          {currentRoom?.isGroup && (
            <button
              onClick={() => { setIsMembersModalOpen(true); setRoomOptionsOpen(false); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 group"
            >
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors"><Users size={20} className="group-hover:text-primary-600" /></div>
              <span className="font-semibold">Group members</span>
            </button>
          )}

          {currentRoom?.isGroup && currentRoom?.admins?.some((a: any) => String(a._id || a) === String(user?._id)) && (
            <button
              onClick={() => {
                setIsAddMemberModalOpen(true);
                setRoomOptionsOpen(false);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 group"
            >
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors"><Plus size={20} className="group-hover:text-primary-600" /></div>
              <span className="font-semibold">Add members</span>
            </button>
          )}

          {currentRoom?.isGroup && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to leave this group?')) {
                  handleLeaveGroup();
                  setRoomOptionsOpen(false);
                }
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 group"
            >
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"><LogOut size={20} /></div>
              <span className="font-semibold">Leave group</span>
            </button>
          )}

          {currentRoom?.isGroup && currentRoom?.admins?.some((a: any) => String(a._id || a) === String(user?._id)) && (
            <button
              onClick={() => {
                handleDeleteChat();
                setRoomOptionsOpen(false);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600 group"
            >
              <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl transition-colors"><Trash2 size={20} /></div>
              <span className="font-semibold">Discard group</span>
            </button>
          )}

          {!currentRoom?.isGroup && (
            <button
              onClick={() => { handleDeleteChat(); setRoomOptionsOpen(false); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600 group"
            >
              <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl transition-colors"><Trash2 size={20} /></div>
              <span className="font-semibold">Delete conversation</span>
            </button>
          )}
        </div>
      </BottomSheet>

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSuccess={(newRoom) => {
          fetchRooms();
          setCurrentRoom(newRoom);
          setShowMobileChat(true);
        }}
      />

      {/* Group Members Modal */}
      <BottomSheet
        isOpen={isMembersModalOpen}
        onClose={() => { setIsMembersModalOpen(false); setMemberSearch(''); }}
        title="Group Members"
      >
        <div className="flex flex-col h-[70vh] max-h-[600px]">
          <div className="p-4 border-b dark:border-slate-800 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search group members..."
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {currentRoom?.participants
              ?.filter((p: any) => p.name.toLowerCase().includes(memberSearch.toLowerCase()))
              .map((participant: any) => {
                const isAdmin = currentRoom?.admins?.some((a: any) => (a._id || a) === participant._id);
                const isCurrentUserAdmin = currentRoom?.admins?.some((a: any) => (a._id || a) === user?._id);
                const isMe = participant._id === user?._id;

                return (
                  <div key={participant._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                        {participant.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold flex items-center gap-2">
                          {participant.name} {isMe && <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-600 px-1.5 py-0.5 rounded text-xs">You</span>}
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
                            onClick={async () => {
                              try {
                                await api.post('/chats/members/manage', {
                                  roomId: currentRoom?._id,
                                  userId: participant._id,
                                  action: isAdmin ? 'demote' : 'promote'
                                });
                                toast(isAdmin ? 'Removed admin role' : 'Promoted to admin', 'success');
                                fetchRooms();
                              } catch (err: any) {
                                toast(err.response?.data?.message || 'Failed to update role', 'error');
                              }
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary-600 transition-colors"
                            title={isAdmin ? "Dismiss as Admin" : "Make Group Admin"}
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Remove ${participant.name} from group?`)) {
                                try {
                                  await api.post('/chats/members/manage', {
                                    roomId: currentRoom?._id,
                                    userId: participant._id,
                                    action: 'remove'
                                  });
                                  toast('Member removed', 'success');
                                  fetchRooms();
                                } catch (err: any) {
                                  toast('Failed to remove member', 'error');
                                }
                              }
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
          </div>
        </div>
      </BottomSheet>

      {/* Add Member Modal */}
      <BottomSheet
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Add to Group"
      >
        <div className="flex flex-col h-[70vh] max-h-[600px]">
          <div className="p-4 border-b dark:border-slate-800 space-y-4">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search connections to add..."
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/10 transition-all outline-none font-medium"
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
              <p className="text-[10px] text-slate-400">Only connections not already in the group are shown.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {myConnections
              .map((conn: any) => {
                const other = conn.requester?._id === user?._id ? conn.recipient : conn.requester;
                return other;
              })
              .filter((u: any) => u && !currentRoom?.participants?.some((p: any) => p._id === u._id))
              .map((u: any) => (
                <div key={u._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
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
                    onClick={async () => {
                      try {
                        await api.post('/chats/members/manage', {
                          roomId: currentRoom?._id,
                          userId: u._id,
                          action: 'add'
                        });
                        toast(`${u.name} added to group`, 'success');
                        fetchRooms();
                        setIsAddMemberModalOpen(false);
                      } catch (err: any) {
                        toast(err.response?.data?.message || 'Failed to add member', 'error');
                      }
                    }}
                    className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}

            {myConnections.length === 0 && !isFetchingConnections && (
              <div className="text-center p-8">
                <p className="text-slate-500 text-sm">No connections found.</p>
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default Messages;
