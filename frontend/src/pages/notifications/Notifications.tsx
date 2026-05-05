import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Info, Briefcase, Trash2, X, CheckCheck } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { NotificationsSkeleton } from '../../components/skeletons/NotificationsSkeleton';
import { NoData } from '../../components/ui/NoData';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  jobId?: string;
  createdAt: string;
}

export const Notifications = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
       console.error('Failed to fetch notifications', error);
       toast('Failed to load notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) => 
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch (e) {
         console.error('Failed to mark as read', e);
         toast('Failed to mark notification as read', 'error');
      }
    }
    
    if (notif.jobId) {
      navigate(`/jobs/${notif.jobId}`);
    }
  };

  const markAllAsRead = async () => {
    try {
       const unread = notifications.filter(n => !n.isRead);
       if (unread.length === 0) return;
       
       // Optimization: Could use a single backend call if available, but for now this works
       await Promise.all(unread.map(n => api.patch(`/notifications/${n._id}/read`)));
       setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
       toast('All notifications marked as read', 'success');
    } catch (e) {
       console.error('Failed to mark all as read', e);
       toast('Failed to mark all as read', 'error');
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast('Notification deleted', 'success');
    } catch (e) {
      console.error('Failed to delete notification', e);
      toast('Failed to delete notification', 'error');
    }
  };

  const handleClearAll = async () => {
    setConfirmClearOpen(true);
  };

  const confirmClearAll = async () => {
    setConfirmClearOpen(false);
    try {
      await api.delete('/notifications');
      setNotifications([]);
      toast('All notifications cleared', 'success');
    } catch (e) {
      console.error('Failed to clear notifications', e);
      toast('Failed to clear notifications', 'error');
    }
  };

  if (!user) return null;
  if (isLoading) return <NotificationsSkeleton />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600">
            <Bell size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notifications</h1>
        </div>
        <div className="flex items-center gap-4">
          {notifications.length > 0 && (
            <>
              {notifications.some(n => !n.isRead) && (
                <button 
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <CheckCheck size={16} /> Mark all read
                </button>
              )}
              <button 
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 size={16} /> Clear all
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <NoData
            type="notifications"
            height="250px"
            title="All Caught Up!"
            description="You have no new notifications at the moment. We'll let you know when something important happens!"
          />
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif._id}
              className={`cursor-pointer transition-all duration-200 ${!notif.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800 shadow-sm' : 'bg-white dark:bg-[#2a2b32]/90 border-slate-100 dark:border-[#565869]'}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <CardContent className="p-4 sm:p-5 flex gap-4">
                <div className={`mt-1 shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${notif.jobId ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                  {notif.jobId ? <Briefcase size={18} /> : <Info size={18} />}
                </div>
                
                <div className="flex-1">
                  <p className={`text-sm sm:text-base ${!notif.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                    {notif.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(notif.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short', hour12: false })}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {!notif.isRead && (
                    <div className="h-2.5 w-2.5 bg-primary-600 rounded-full"></div>
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(e, notif._id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    title="Delete notification"
                  >
                    <X size={16} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmClearOpen}
        title="Clear All Notifications?"
        description="This will permanently delete all your notifications. This action cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={confirmClearAll}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};

export default Notifications;
