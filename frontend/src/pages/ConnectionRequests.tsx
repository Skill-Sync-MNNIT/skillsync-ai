import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, X, ArrowLeft, UserPlus, Clock } from 'lucide-react';
import { Pagination } from '../components/ui/Pagination';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

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
      const res = await api.get(`/connections/requests?page=${currentPage}&limit=10`);
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
    <div className="max-w-3xl mx-auto space-y-8 p-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/networking')}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connection Invitations</h1>
      </div>

      {requests.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-slate-50/50 dark:bg-slate-900/50">
          <UserPlus className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No pending invitations.</p>
          <p className="text-sm text-slate-500 mt-2">When people want to connect with you, they'll appear here.</p>
          <Button 
            className="mt-6" 
            variant="secondary"
            onClick={() => navigate('/networking')}
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
            <Card key={req._id} className="hover:shadow-md transition-shadow border-primary-100 dark:border-primary-900/30">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 cursor-pointer"
                    onClick={() => navigate(`/profile/${req.requester.email?.split('@')[0] || req.requester._id}`)}
                  >
                    {req.requester.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p 
                      className="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-primary-600 transition-colors"
                      onClick={() => navigate(`/profile/${req.requester.email?.split('@')[0] || req.requester._id}`)}
                    >
                      {req.requester.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 capitalize font-medium">{req.requester.role} at MNNIT</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                      <Clock size={12} />
                      <span>Sent {date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="gap-2 px-4" 
                    onClick={() => handleRespond(req._id, 'accepted')}
                  >
                    <Check size={16} />
                    <span className="hidden sm:inline">Accept</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 px-4"
                    onClick={() => handleRespond(req._id, 'rejected')}
                  >
                    <X size={16} />
                    <span className="hidden sm:inline">Ignore</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )})}
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
