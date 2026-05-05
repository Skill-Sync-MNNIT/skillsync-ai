import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, MoreVertical, Trash2, Send, Search, Bell } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Input } from '../../components/ui/Input';
import { NetworkingSkeleton } from '../../components/skeletons/NetworkingSkeleton';
import { NoData } from '../../components/ui/NoData';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const Connections = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [totalConnections, setTotalConnections] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = async (p = page) => {
    try {
      const [connRes, pendingRes] = await Promise.all([
        // Critical — main content. If this fails, outer catch shows toast.
        api.get(`/connections/list?page=${p}&limit=10&search=${debouncedSearch}`),
        // Non-critical — just the badge count. If this fails, show 0, don't crash.
        api.get('/connections/requests').catch(() => null),
      ]);
      setConnections(connRes.data.connections || []);
      setTotalPages(connRes.data.pages || 1);
      setTotalConnections(connRes.data.total || 0);
      setTotalPending(pendingRes?.data?.total || 0); // safely null-check
    } catch (err) {
      // Only reaches here if /connections/list itself fails
      toast('Failed to load your connections', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page, debouncedSearch]);



  const handleMessage = async (recipientId: string) => {
    try {
      const res = await api.post('/chats/rooms/1on1', { recipientId });
      const roomId = res.data._id;
      navigate(`/messages?roomId=${roomId}`);
    } catch (err) {
      toast('Failed to start chat', 'error');
    }
  };

  const handleRemoveConnection = (connectionId: string) => {
    setConfirmRemoveId(connectionId);
  };

  const confirmRemove = async () => {
    if (!confirmRemoveId) return;
    setConfirmRemoveId(null);
    try {
      await api.delete(`/connections/${confirmRemoveId}`);
      toast('Connection removed', 'success');
      fetchData();
      setIsBottomSheetOpen(false);
    } catch (err) {
      toast('Failed to remove connection', 'error');
    }
  };

  if (isLoading) return <NetworkingSkeleton />;

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="text-primary-600" size={28} />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Network</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 relative group hover:border-primary-500 hover:text-primary-600 transition-all duration-300 rounded-xl px-4 py-2 bg-white dark:bg-[#202123] border-slate-200 dark:border-[#383942] shadow-sm hover:shadow-primary-500/10 hover:ring-1 hover:ring-primary-500/20"
            onClick={() => navigate('/connections/requests')}
          >
            <Bell size={18} className="group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 text-slate-500 group-hover:text-primary-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary-600">Invitations</span>
            {totalPending > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#202123] shadow-md animate-bounce">
                {totalPending > 99 ? '99+' : totalPending}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="relative group w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-300" size={20} />
        <Input
          placeholder="Search your connections."
          className="pl-11 h-12 bg-white dark:bg-[#202123] border-slate-200 dark:border-[#383942] rounded-2xl transition-all duration-300 shadow-sm focus:shadow-primary-500/5 group-hover:border-primary-400/30"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            Connections
          </h2>
          <span className="text-sm text-slate-500 font-medium">{totalConnections} connections found</span>
        </div>

        {connections.length === 0 ? (
          <NoData
            type="search"
            title={debouncedSearch ? "No Connections Match" : "Your Network is Empty"}
            description={debouncedSearch 
              ? `No connections found searching for "${debouncedSearch}". Try a different name or email prefix.` 
              : "Start building your network by connecting with students and alumni from MNNIT!"
            }
            action={null}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((conn) => {
              const otherUser = conn.requester?._id === user?._id ? conn.recipient : conn.requester;
              if (!otherUser) return null;

              const connectedAt = new Date(conn.connectedAt || conn.updatedAt || Date.now()).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              });

              return (
                <Card key={conn._id} className="hover:shadow-md transition-all group hover:border-primary-100 dark:hover:border-primary-900/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="h-14 w-14 rounded-full bg-slate-100 dark:bg-[#2a2b32] flex items-center justify-center font-bold text-xl text-slate-500 overflow-hidden border-2 border-white dark:border-[#565869] shadow-sm cursor-pointer"
                        onClick={() => navigate(`/profile/${otherUser.email?.split('@')[0] || otherUser._id}`)}
                      >
                        {otherUser.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="font-bold text-slate-900 dark:text-white truncate hover:text-primary-600 transition-colors cursor-pointer"
                          onClick={() => navigate(`/profile/${otherUser.email?.split('@')[0] || otherUser._id}`)}
                        >
                          {otherUser.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 mb-1 font-medium">{otherUser.role} • Connected {connectedAt}</p>
                        <p className="text-[11px] text-slate-400 italic truncate italic">Ready to collaborate on SkillSync!</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 p-2.5 rounded-full"
                        onClick={() => handleMessage(otherUser._id)}
                      >
                        <Send size={18} />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#2a2b32]"
                        onClick={() => {
                          setSelectedConnection({ id: conn._id, user: otherUser });
                          setIsBottomSheetOpen(true);
                        }}
                      >
                        <MoreVertical size={18} className="text-slate-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-12"
        />
      </div>

      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title="Connection Options"
      >
        <div className="space-y-2 p-4">
          <button
            onClick={() => handleRemoveConnection(selectedConnection?.id)}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600"
          >
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Trash2 size={20} />
            </div>
            <span className="font-medium">Remove connection</span>
          </button>
        </div>
      </BottomSheet>

      <ConfirmDialog
        isOpen={confirmRemoveId !== null}
        title="Remove Connection?"
        description="This will permanently remove your connection. You can always reconnect later."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmRemove}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
};

export default Connections;
