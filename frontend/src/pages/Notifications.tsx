import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Info, Briefcase } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Notification {
  _id: string;
  type: 'job_match' | 'system' | 'moderation_alert';
  message: string;
  isRead: boolean;
  relatedJobId?: string;
  createdAt: string;
}

export const Notifications = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
       console.error('Failed to fetch notifications', error);
       // Mock data for UI development if backend fails
       if (import.meta.env.DEV) {
         setNotifications([
            { _id: '1', type: 'job_match', message: 'You have a 92% match for Software Engineer Intern!', isRead: false, relatedJobId: '123', createdAt: new Date().toISOString() },
            { _id: '2', type: 'system', message: 'Welcome to SkillSync AI. Please complete your profile.', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() }
         ]);
       }
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
      }
    }
    if (notif.relatedJobId) {
      navigate(`/jobs/${notif.relatedJobId}`);
    }
  };

  const markAllAsRead = async () => {
    try {
       // Assuming there's a mark-all endpoint, otherwise map through them
       const unread = notifications.filter(n => !n.isRead);
       await Promise.all(unread.map(n => api.patch(`/notifications/${n._id}/read`)));
       setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
       console.error('Failed to mark all as read', e);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
             <Bell size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
             {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-xl"></div>)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
             <CheckCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
             <h3 className="text-lg font-medium text-slate-900">You're all caught up!</h3>
             <p className="mt-1 text-slate-500">No new notifications right now.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <Card 
              key={notif._id} 
              className={`cursor-pointer transition-colors ${!notif.isRead ? 'bg-indigo-50/50 border-primary-200 shadow-sm' : 'bg-white border-slate-200'}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <CardContent className="p-4 sm:p-5 flex gap-4">
                <div className={`mt-1 shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  notif.type === 'job_match' ? 'bg-green-100 text-green-600' :
                  notif.type === 'moderation_alert' ? 'bg-red-100 text-red-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {notif.type === 'job_match' ? <Briefcase size={18} /> : 
                   notif.type === 'moderation_alert' ? <Info size={18} /> :
                   <Info size={18} />}
                </div>
                
                <div className="flex-1">
                  <p className={`text-sm sm:text-base ${!notif.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {notif.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    {new Date(notif.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                {!notif.isRead && (
                   <div className="shrink-0 flex items-center justify-center">
                      <div className="h-2.5 w-2.5 bg-primary-600 rounded-full"></div>
                   </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
