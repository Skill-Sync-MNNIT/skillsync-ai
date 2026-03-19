import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.tsx';
import { Briefcase, Bell, TrendingUp, Users } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {user.email.split('@')[0]}
          </h1>
          <p className="mt-1 text-slate-500">
            Here's what's happening with you and your network today.
          </p>
        </div>
        {user.role === 'alumni' && (
          <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
            Post a new job
          </button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Quick Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Unread Notifications</CardTitle>
             <Bell size={20} className="text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">3</div>
            <p className="text-xs text-slate-500 mt-1">2 new since yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Trending Skills</CardTitle>
            <TrendingUp size={20} className="text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">12</div>
            <p className="text-xs text-slate-500 mt-1">Found in recent job posts</p>
          </CardContent>
        </Card>

        {user.role === 'student' && (
           <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-slate-500">Profile Views</CardTitle>
               <Users size={20} className="text-slate-400" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-slate-900">8</div>
               <p className="text-xs text-slate-500 mt-1">By professors and alumni</p>
             </CardContent>
           </Card>
        )}

        {(user.role === 'alumni' || user.role === 'professor') && (
           <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-slate-500">Active Jobs</CardTitle>
               <Briefcase size={20} className="text-slate-400" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-slate-900">1</div>
               <p className="text-xs text-slate-500 mt-1">Software Engineer Intern</p>
             </CardContent>
           </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
           {/* Section 1 */}
           <Card className="h-full min-h-[400px]">
             <CardHeader>
               <CardTitle>Recent Activity</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-slate-500 text-sm">No recent activity to show yet.</div>
             </CardContent>
           </Card>
        </div>

        {/* Sidebar Activity */}
        <div className="space-y-6">
          <Card>
             <CardHeader>
               <CardTitle>Trending Skills in MNNIT</CardTitle>
             </CardHeader>
             <CardContent>
                 {/* Placeholders for analytics */}
                 <div className="space-y-4">
                    {['React', 'Node.js', 'Python', 'Machine Learning', 'Docker'].map((skill, i) => (
                      <div key={skill} className="flex items-center justify-between">
                         <span className="text-sm font-medium text-slate-700">{skill}</span>
                         <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full">{100 - i * 15}%</span>
                      </div>
                    ))}
                 </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
