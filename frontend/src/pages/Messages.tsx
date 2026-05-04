import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { MessageCirclePlus } from 'lucide-react';
import { cn } from '../components/ui/Button';
import { CreateGroupModal } from '../components/chat/CreateGroupModal';
import { useSocket } from '../hooks/useSocket';
import { EmptyState } from '../components/ui/EmptyState';
import { ChatSkeleton } from '../components/skeletons/ChatSkeleton';

// ── Extracted Components ──────────────────────────────────────
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageBubble } from '../components/chat/MessageBubble';
import { MessageInput } from '../components/chat/MessageInput';
import { GroupSettingsSheet } from '../components/chat/ChatModals/GroupSettingsSheet';
import { MembersSheet } from '../components/chat/ChatModals/MembersSheet';
import { AddMemberSheet } from '../components/chat/ChatModals/AddMemberSheet';

export const Messages = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
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
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [userStatuses, setUserStatuses] = useState<Record<string, { isOnline: boolean; lastSeen?: string }>>({});
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

  const typingTimeoutRef = useRef<any>(null);
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastFetchTimeRef = useRef<number>(0);

  // ─── Connections search for Add Member ───────────────────
  useEffect(() => {
    if (!isAddMemberModalOpen) { setAddMemberQuery(''); return; }
    const timer = setTimeout(async () => {
      try {
        setIsFetchingConnections(true);
        const res = await api.get(`/connections/list?search=${addMemberQuery}&limit=50`);
        setMyConnections(res.data.connections || []);
      } catch {
        toast('Failed to search connections', 'error');
      } finally {
        setIsFetchingConnections(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [addMemberQuery, isAddMemberModalOpen]);

  // ─── Scroll helpers ───────────────────────────────────────
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const scrollToMessage = (messageId: string) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('animate-message-highlight');
      setTimeout(() => element.classList.remove('animate-message-highlight'), 2000);
    }
  };

  // ─── API calls ────────────────────────────────────────────
  const fetchRooms = async () => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) return;
    lastFetchTimeRef.current = now;
    try {
      const res = await api.get('/chats/rooms');
      const roomsData = res.data;
      roomsData.sort((a: any, b: any) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.updatedAt).getTime();
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
      setRooms(roomsData);
      if (socket) roomsData.forEach((room: any) => socket.emit('join_room', room._id));
      if (socket && user?._id && roomsData.length > 0) {
        roomsData.forEach((room: any) => {
          const lastMsg = room.lastMessageDetails;
          if (lastMsg) {
            const senderId = typeof lastMsg.senderId === 'object' ? lastMsg.senderId._id : lastMsg.senderId;
            if (String(senderId) !== String(user._id) && !lastMsg.deliveredTo?.includes(String(user._id))) {
              socket.emit('message_delivered', { messageId: lastMsg._id, roomId: room._id });
            }
          }
        });
      }
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
    } catch {
      toast('Failed to load messages', 'error');
    }
  };

  // ─── Initial load + URL param routing ────────────────────
  useEffect(() => { fetchRooms(); }, []);
  useEffect(() => {
    const roomId = searchParams.get('roomId');
    if (roomId && rooms.length > 0 && currentRoom?._id !== roomId) {
      const room = rooms.find(r => r._id === roomId);
      if (room) setCurrentRoom(room);
    }
  }, [searchParams, rooms, currentRoom?._id]);

  // ─── Socket listeners ─────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message) => {
      const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
      if (String(senderId) !== String(user?._id)) {
        socket.emit('message_delivered', { messageId: message._id, roomId: message.chatRoomId });
      }
      if (currentRoom?._id === message.chatRoomId) {
        setMessages(prev => [...prev, message]);
        setRooms(prev => prev.map(room =>
          room._id === message.chatRoomId
            ? { ...room, lastMessageAt: message.createdAt || new Date().toISOString(), lastMessage: message.content, lastMessageDetails: message }
            : room
        ));
      } else {
        setRooms(prev => prev.map(room =>
          room._id === message.chatRoomId
            ? { ...room, unreadCount: (room.unreadCount || 0) + 1, lastMessageAt: message.createdAt || new Date().toISOString(), lastMessage: message.content, lastMessageDetails: message }
            : room
        ));
      }
    });

    socket.on('message_edited', (updatedMessage) => {
      setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
    });

    socket.on('message_deleted_everyone', ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, content: 'This message was deleted', isDeletedForEveryone: true } : m
      ));
    });

    socket.on('user_status_change', ({ userId, isOnline, lastSeen }) => {
      setUserStatuses(prev => ({ ...prev, [userId]: { isOnline, lastSeen } }));
    });

    socket.on('group_renamed', ({ roomId, name }) => {
      if (currentRoom?._id === roomId) {
        setCurrentRoom((prev: any) => prev ? { ...prev, name } : null);
        fetchRooms();
      }
    });

    socket.on('user_typing', ({ userId: typingId, isTyping: typingStatus, roomId: typingRoomId, userName }) => {
      if (String(currentRoom?._id) === String(typingRoomId) && String(typingId) !== String(user?._id)) {
        setTypingUser(typingStatus ? (userName || 'Someone') : null);
      }
    });

    socket.on('connect', () => { fetchRooms(); });

    socket.on('message_status_update', ({ messageId, deliveredTo, readBy }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deliveredTo, readBy } : m));
    });

    socket.on('messages_marked_read', ({ roomId, userId }) => {
      setRooms(prev => prev.map(room => room._id === roomId ? { ...room, unreadCount: 0 } : room));
      setMessages(prev => prev.map(m => {
        const pid = String(userId);
        const senderId = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
        if (String(m.chatRoomId) === String(roomId) && String(senderId) === String(user?._id) && !m.readBy?.includes(pid)) {
          return { ...m, readBy: [...(m.readBy || []), pid] };
        }
        return m;
      }));
    });

    socket.on('room_discarded', ({ roomId, adminId }) => {
      setRooms(prev => prev.filter(r => r._id !== roomId));
      if (currentRoom?._id === roomId) {
        setCurrentRoom(null);
        setMessages([]);
        setSearchParams({});
        if (String(adminId) !== String(user?._id)) toast('This group has been discarded by the admin', 'info');
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

  // ─── Room change effect ───────────────────────────────────
  useEffect(() => {
    if (currentRoom) {
      fetchMessages(currentRoom._id);
      setTypingUser(null);
      setRooms(prev => prev.map(room => room._id === currentRoom._id ? { ...room, unreadCount: 0 } : room));
      if (socket) {
        socket.emit('join_room', currentRoom._id);
        socket.emit('mark_read', { roomId: currentRoom._id });
      }
    } else {
      setMessages([]);
    }
  }, [currentRoom, socket]);

  useEffect(() => { scrollToBottom(); }, [messages, typingUser]);

  // ─── Message handlers ─────────────────────────────────────
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (socket && currentRoom) {
      const myName = user?.name || user?.email?.split('@')[0] || 'Someone';
      socket.emit('typing', { roomId: currentRoom._id, isTyping: true, userName: myName });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomId: currentRoom._id, isTyping: false, userName: myName });
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
          roomId: currentRoom._id,
          content: newMessage,
          replyTo: replyTo?._id,
        });
      }
      setNewMessage('');
      setReplyTo(null);
      if (socket) {
        const myName = user?.name || user?.email?.split('@')[0] || 'Someone';
        socket.emit('typing', { roomId: currentRoom._id, isTyping: false, userName: myName });
      }
    } catch (err: any) {
      toast(err.response?.data?.error || err.response?.data?.message || 'Failed to send message', 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentRoom) return;
    if (file.size > 5 * 1024 * 1024) { toast('Image must be less than 5MB', 'error'); return; }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('roomId', currentRoom._id);
    try {
      await api.post('/chats/messages/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('Image sent', 'success');
    } catch {
      toast('Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleEditMessage = (msg: any) => {
    setEditingMessage(msg);
    setNewMessage(msg.content);
    setReplyTo(null);
  };

  const handleDeleteForEveryone = async (msgId: string) => {
    try {
      await api.delete(`/chats/messages/${msgId}/everyone`);
      toast('Message deleted for everyone', 'success');
    } catch {
      toast('Failed to delete message', 'error');
    }
  };

  const handleDeleteForMe = async (msgId: string) => {
    try {
      await api.delete(`/chats/messages/${msgId}/me`);
      setMessages(prev => prev.filter(m => m._id !== msgId));
      toast('Deleted for me', 'success');
    } catch {
      toast('Failed to delete message', 'error');
    }
  };

  const onEmojiClick = (emojiData: any) => setNewMessage(prev => prev + emojiData.emoji);

  // ─── Room action handlers ──────────────────────────────────
  const handleRenameRoom = async () => {
    if (!newNameInput.trim() || !currentRoom) return;
    try {
      await api.patch(`/chats/rooms/${currentRoom._id}`, { name: newNameInput });
      toast('Group renamed', 'success');
      setIsRenaming(false);
      setRoomOptionsOpen(false);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to rename', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentRoom) return;
    try {
      await api.delete(`/chats/rooms/${currentRoom._id}/leave`);
      toast('Left group', 'success');
      setCurrentRoom(null);
      fetchRooms();
      setRoomOptionsOpen(false);
    } catch {
      toast('Failed to leave group', 'error');
    }
  };

  const handleDeleteChat = async () => {
    if (!currentRoom) return;
    try {
      await api.delete(`/chats/rooms/${currentRoom._id}`);
      toast(currentRoom.isGroup ? 'Group discarded' : 'Chat deleted', 'success');
      setCurrentRoom(null);
      fetchRooms();
      setRoomOptionsOpen(false);
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const handleClearChat = async () => {
    if (!currentRoom) return;
    try {
      await api.delete(`/chats/rooms/${currentRoom._id}/messages`);
      toast('Messages cleared', 'success');
      setMessages([]);
      fetchRooms();
      setRoomOptionsOpen(false);
    } catch {
      toast('Failed to clear messages', 'error');
    }
  };

  const handleManageMember = async (participantId: string, action: 'promote' | 'demote' | 'remove', isAdmin: boolean) => {
    if (!currentRoom) return;
    try {
      if (action === 'remove') {
        await api.delete(`/chats/rooms/${currentRoom._id}/participants/${participantId}`);
        toast('Member removed', 'success');
      } else {
        await api.patch(`/chats/rooms/${currentRoom._id}/admins`, {
          participantId,
          action: isAdmin ? 'demote' : 'promote',
        });
        toast(`Member ${isAdmin ? 'demoted' : 'promoted to admin'}`, 'success');
      }
      fetchRooms();
      setCurrentRoom((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          participants: action === 'remove'
            ? prev.participants.filter((p: any) => p._id !== participantId)
            : prev.participants,
          admins: action === 'promote'
            ? [...(prev.admins || []), { _id: participantId }]
            : prev.admins?.filter((a: any) => (a._id || a) !== participantId),
        };
      });
    } catch (err: any) {
      toast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleAddMember = async (userId: string, name: string) => {
    if (!currentRoom) return;
    try {
      await api.post(`/chats/rooms/${currentRoom._id}/participants`, { userId });
      toast(`${name} added to group`, 'success');
      fetchRooms();
      setCurrentRoom((prev: any) =>
        prev ? { ...prev, participants: [...prev.participants, { _id: userId, name }] } : null
      );
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to add member', 'error');
    }
  };

  // ─── Render ───────────────────────────────────────────────
  if (isLoading) return <ChatSkeleton />;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-[#202123] overflow-hidden relative">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <ChatSidebar
        rooms={rooms}
        currentRoom={currentRoom}
        user={user}
        userStatuses={userStatuses}
        isLoading={isLoading}
        roomSearch={roomSearch}
        setRoomSearch={setRoomSearch}
        showMobileChat={showMobileChat}
        onSelectRoom={(room) => {
          setCurrentRoom(room);
          setShowMobileChat(true);
          setSearchParams({ roomId: room._id });
        }}
        onNewGroup={() => setIsGroupModalOpen(true)}
      />

      {/* ── Main Chat Panel ─────────────────────────────────── */}
      <div className={cn(
        'flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#343541] relative overflow-hidden transition-all duration-300',
        !showMobileChat ? 'hidden md:flex' : 'flex'
      )}>
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              currentRoom={currentRoom}
              user={user}
              userStatuses={userStatuses}
              onOpenSettings={() => setRoomOptionsOpen(true)}
              onBack={() => setShowMobileChat(false)}
            />

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-[#383942] bg-slate-50/30 dark:bg-[#2a2b32]/30 relative">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0" />
              <div className="relative z-10 flex flex-col space-y-1 pt-2 min-h-full">
                {(() => {
                  const filteredMessages = messages.filter(m => !m.deletedBy?.includes(user?._id));
                  if (filteredMessages.length === 0) {
                    return (
                      <EmptyState
                        icon={MessageCirclePlus}
                        title="Your New Conversation!"
                        description="The best projects start with a simple hello. Say something amazing to get things moving! 👋"
                        className="min-h-[60vh]"
                      />
                    );
                  }
                  return filteredMessages.map((msg, idx) => {
                    const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                    const prevMsg = messages[idx - 1];
                    const isConsecutive = prevMsg?.senderId?._id === (msg.senderId?._id || msg.senderId);

                    if (msg.messageType === 'system') {
                      return (
                        <div key={msg._id} className="flex justify-center my-2 animate-in fade-in zoom-in duration-500">
                          <div className="bg-slate-100/50 dark:bg-[#40414f] backdrop-blur-sm px-4 py-1 rounded-full text-[11px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200/30 dark:border-[#565869]/30 shadow-sm">
                            <span className="opacity-40 mr-2">—</span>
                            {msg.content}
                            <span className="opacity-40 ml-2">—</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <MessageBubble
                        key={msg._id}
                        msg={msg}
                        isMe={isMe}
                        isConsecutive={isConsecutive}
                        currentRoom={currentRoom}
                        onReply={() => setReplyTo(msg)}
                        onEdit={isMe ? () => handleEditMessage(msg) : undefined}
                        onDeleteMe={() => handleDeleteForMe(msg._id)}
                        onDeleteEveryone={() => handleDeleteForEveryone(msg._id)}
                        onScrollToMessage={scrollToMessage}
                        onSetRef={(el) => { messageRefs.current[msg._id] = el; }}
                      />
                    );
                  });
                })()}

                {/* Typing indicator */}
                {typingUser && (
                  <div className="flex items-start mt-1">
                    <div className="bg-white dark:bg-[#2a2b32] text-slate-500 text-xs px-4 py-2 rounded-2xl rounded-bl-none shadow-sm border dark:border-[#383942] flex items-center gap-2">
                      <span className="flex gap-1">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </span>
                      <span className="font-medium text-slate-500">{typingUser} is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <MessageInput
              newMessage={newMessage}
              onMessageChange={handleTyping}
              onSubmit={handleSendMessage}
              onEmojiClick={onEmojiClick}
              onImageUpload={handleImageUpload}
              isUploading={isUploading}
              editingMessage={editingMessage}
              replyTo={replyTo}
              onCancelEdit={() => { setEditingMessage(null); setNewMessage(''); }}
              onCancelReply={() => setReplyTo(null)}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageCirclePlus}
              title="Select a conversation"
              description="Choose a chat from the sidebar to get started."
            />
          </div>
        )}
      </div>

      {/* ── Create Group Modal ───────────────────────────────── */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSuccess={(newRoom: any) => {
          fetchRooms();
          setCurrentRoom(newRoom);
          setShowMobileChat(true);
        }}
      />

      {/* ── Group Settings Sheet ─────────────────────────────── */}
      <GroupSettingsSheet
        isOpen={roomOptionsOpen}
        onClose={() => setRoomOptionsOpen(false)}
        currentRoom={currentRoom}
        user={user}
        isRenaming={isRenaming}
        setIsRenaming={setIsRenaming}
        newNameInput={newNameInput}
        setNewNameInput={setNewNameInput}
        onRename={handleRenameRoom}
        onClearChat={handleClearChat}
        onViewMembers={() => setIsMembersModalOpen(true)}
        onAddMembers={() => setIsAddMemberModalOpen(true)}
        onLeaveGroup={handleLeaveGroup}
        onDeleteChat={handleDeleteChat}
      />

      {/* ── Members Sheet ───────────────────────────────────── */}
      <MembersSheet
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        currentRoom={currentRoom}
        user={user}
        memberSearch={memberSearch}
        setMemberSearch={setMemberSearch}
        onManageMember={handleManageMember}
      />

      {/* ── Add Member Sheet ─────────────────────────────────── */}
      <AddMemberSheet
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        currentRoom={currentRoom}
        user={user}
        myConnections={myConnections}
        addMemberQuery={addMemberQuery}
        setAddMemberQuery={setAddMemberQuery}
        isFetchingConnections={isFetchingConnections}
        onAddMember={handleAddMember}
      />

    </div>
  );
};

export default Messages;
