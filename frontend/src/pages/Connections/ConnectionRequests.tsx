import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, UserPlus, Clock } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export const ConnectionRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchRequests = async (currentPage = page) => {
    try {
      const res = await api.get(`/connections/requests?page=${currentPage}&limit=5`);
      setRequests(res.data.requests || []);
      setTotalPages(res.data.pages || 1);
      setTotalRequests(res.data.total || 0);
    } catch (err) {
      toast('Failed to load connection requests', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(page);
  }, [page]);

  const handleRespond = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.patch('/connections/respond', { connectionId, status });
      toast(`Request ${status}`, 'success');
      fetchRequests();
    } catch (err) {
      toast('Failed to respond to request', 'error');
    }
  };

  if (isLoading) return <LoadingSpinner fullPage message="Fetching invitations..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-6 pb-12">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/connections')}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#2a2b32]"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connection Invitations</h1>
      </div>

      {requests.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-slate-50/50 dark:bg-[#202123]/50">
          <UserPlus className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No pending invitations.</p>
          <p className="text-sm text-slate-500 mt-2">When people want to connect with you, they'll appear here.</p>
          <Button 
            className="mt-6" 
            variant="secondary"
            onClick={() => navigate('/connections')}
          >
            Back to Network
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="flex justify-between items-center px-2">
            <p className="text-sm text-slate-500 font-medium">You have {totalRequests} pending requests</p>
            {requests.length > 0 && <span className="text-[10px] text-slate-400 font-medium">Page {page} of {totalPages}</span>}
          </div>
          {requests.map((req) => {
            const date = new Date(req.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            
            return (
              <Card key={req._id} className="group hover:shadow-lg transition-all duration-300 border-slate-100 dark:border-[#383942] hover:border-primary-200 dark:hover:border-primary-900/40 overflow-hidden">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div 
                      className="h-14 w-14 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-[#2a2b32] dark:to-[#383942] flex items-center justify-center font-black text-slate-600 dark:text-slate-300 border-2 border-white dark:border-[#202123] shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
                      onClick={() => navigate(`/profile/${req.requester.email?.split('@')[0] || req.requester._id}`)}
                    >
                      {req.requester.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p 
                        className="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-primary-600 transition-colors truncate"
                        onClick={() => navigate(`/profile/${req.requester.email?.split('@')[0] || req.requester._id}`)}
                      >
                        {req.requester.name || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 capitalize font-medium flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                        {req.requester.role} @ MNNIT
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 font-medium">
                        <Clock size={12} className="opacity-70" />
                        <span>Invitation sent {date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-50 dark:border-[#383942] sm:border-none">
                    <Button 
                      className="flex-1 sm:flex-none h-10 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md shadow-primary-500/10 transition-all font-bold text-sm" 
                      onClick={() => handleRespond(req._id, 'accepted')}
                    >
                      Accept
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="flex-1 sm:flex-none h-10 px-6 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all font-bold text-sm"
                      onClick={() => handleRespond(req._id, 'rejected')}
                    >
                      Ignore
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
        className="mt-8"
      />
    </div>
  );
};

export default ConnectionRequests;
