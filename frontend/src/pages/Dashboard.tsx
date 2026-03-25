import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Briefcase, Bell, TrendingUp, Users, ArrowUpRight, Clock,
  FileText, Search, ChevronRight, Sparkles, Eye, MapPin
} from 'lucide-react';
import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// ─── Helpers ────────────────────────────────────────────────
const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getGreetingEmoji = (): string => {
  const h = new Date().getHours();
  if (h < 12) return '☀️';
  if (h < 17) return '🌤️';
  return '🌙';
};

// ─── Mock data (structured for easy API swap) ───────────────
const MOCK_STATS = {
  student: [
    { label: 'Profile Views', value: 24, change: '+12% this week', icon: Eye, color: 'blue' },
    { label: 'Unread Notifications', value: 3, change: '2 new today', icon: Bell, color: 'amber' },
    { label: 'Matching Jobs', value: 7, change: 'Based on your skills', icon: Briefcase, color: 'emerald' },
    { label: 'Trending Skills', value: 12, change: 'Found in job posts', icon: TrendingUp, color: 'violet' },
  ],
  alumni: [
    { label: 'Active Job Posts', value: 2, change: '1 closing soon', icon: Briefcase, color: 'blue' },
    { label: 'Applications', value: 18, change: '+5 this week', icon: Users, color: 'emerald' },
    { label: 'Unread Notifications', value: 3, change: '2 new today', icon: Bell, color: 'amber' },
    { label: 'Trending Skills', value: 12, change: 'In demand now', icon: TrendingUp, color: 'violet' },
  ],
  professor: [
    { label: 'Active Projects', value: 3, change: '1 needs attention', icon: Briefcase, color: 'blue' },
    { label: 'Student Matches', value: 15, change: 'Based on criteria', icon: Users, color: 'emerald' },
    { label: 'Unread Notifications', value: 3, change: '2 new today', icon: Bell, color: 'amber' },
    { label: 'Trending Skills', value: 12, change: 'In student pool', icon: TrendingUp, color: 'violet' },
  ],
};

const MOCK_ACTIVITY = [
  { id: 1, text: 'Your profile was viewed by Dr. Sharma', time: '2 hours ago', icon: Eye },
  { id: 2, text: 'New job posted: ML Research Intern at IIT Delhi', time: '5 hours ago', icon: Briefcase },
  { id: 3, text: 'Resume embedding indexed successfully', time: '1 day ago', icon: FileText },
  { id: 4, text: 'You were shortlisted for Frontend Developer role', time: '2 days ago', icon: Sparkles },
];

const TRENDING_SKILLS = [
  { name: 'React / Next.js', demand: 92, color: 'bg-blue-500' },
  { name: 'Python / ML', demand: 87, color: 'bg-emerald-500' },
  { name: 'Node.js', demand: 78, color: 'bg-amber-500' },
  { name: 'Docker / K8s', demand: 65, color: 'bg-violet-500' },
  { name: 'System Design', demand: 58, color: 'bg-rose-500' },
];

// ─── Color map for stat cards ───────────────────────────────
const COLOR_MAP: Record<string, { bg: string; iconBg: string; text: string; border: string }> = {
  blue:    { bg: 'bg-blue-50',    iconBg: 'bg-blue-100',    text: 'text-blue-600',    border: 'border-blue-100' },
  amber:   { bg: 'bg-amber-50',   iconBg: 'bg-amber-100',   text: 'text-amber-600',   border: 'border-amber-100' },
  emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-100' },
  violet:  { bg: 'bg-violet-50',  iconBg: 'bg-violet-100',  text: 'text-violet-600',  border: 'border-violet-100' },
};

// ─── Sub-components ─────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  change: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  delay: number;
}

const StatCard = ({ label, value, change, icon: Icon, color, delay }: StatCardProps) => {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${c.border} animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
        <div className={`h-9 w-9 rounded-lg ${c.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={18} className={c.text} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900 tabular-nums">{value}</div>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <ArrowUpRight size={12} className="text-emerald-500" />
          {change}
        </p>
      </CardContent>
      {/* Subtle gradient overlay on hover */}
      <div className={`absolute inset-0 ${c.bg} opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none rounded-xl`} />
    </Card>
  );
};

const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton-shimmer ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <SkeletonBlock className="h-8 w-72" />
      <SkeletonBlock className="h-4 w-96" />
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-6 space-y-3">
          <div className="flex justify-between">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-9 w-9 rounded-lg" />
          </div>
          <SkeletonBlock className="h-8 w-16" />
          <SkeletonBlock className="h-3 w-32" />
        </Card>
      ))}
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="p-6 space-y-4">
          <SkeletonBlock className="h-5 w-36" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
            </div>
          ))}
        </Card>
      </div>
      <Card className="p-6 space-y-4">
        <SkeletonBlock className="h-5 w-44" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-4 w-10" />
            </div>
            <SkeletonBlock className="h-2 w-full rounded-full" />
          </div>
        ))}
      </Card>
    </div>
  </div>
);

// ─── Quick Action Item ──────────────────────────────────────
const QuickAction = ({ to, icon: Icon, label, desc }: { to: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; desc: string }) => (
  <Link to={to} className="group flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
    <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
      <Icon size={18} className="text-primary-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-900 group-hover:text-primary-700 transition-colors">{label}</p>
      <p className="text-xs text-slate-500 truncate">{desc}</p>
    </div>
    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-500 transition-colors shrink-0" />
  </Link>
);

// ─── Main Dashboard Component ───────────────────────────────
export const Dashboard = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        await api.get('/api/dashboard');
      } catch (err) {
        // Dashboard API may not exist yet — that's fine
      } finally {
        // Simulate minimum load time for skeleton visibility
        setTimeout(() => setIsLoading(false), 600);
      }
    };
    fetchDashboard();
  }, []);

  if (!user) return null;
  if (isLoading) return <DashboardSkeleton />;

  const stats = MOCK_STATS[user.role] || MOCK_STATS.student;
  const userName = user.email.split('@')[0];

  return (
    <div className="space-y-8 pb-8">
      {/* ── Hero Greeting ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-fade-in-up">
        <div>
          <p className="text-sm font-medium text-primary-600 mb-1">{getGreetingEmoji()} {getGreeting()}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Welcome back, <span className="text-primary-600">{userName}</span>
          </h1>
          <p className="mt-2 text-slate-500 max-w-lg">
            Here's a snapshot of your activity and the latest trends in the MNNIT network.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {(user.role === 'alumni' || user.role === 'professor') && (
            <Link to="/jobs/create">
              <Button size="md">
                <Briefcase size={16} className="mr-2" />
                Post a Job
              </Button>
            </Link>
          )}
          <Link to="/profile">
            <Button variant="outline" size="md">
              <Users size={16} className="mr-2" />
              View Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 80} />
        ))}
      </div>

      {/* ── Main Content Grid ────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Activity + Quick Actions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Activity Timeline */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <Link to="/notifications" className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1">
                  View all <ChevronRight size={14} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-1">
                {MOCK_ACTIVITY.map((item, i) => (
                  <div key={item.id} className="group relative flex items-start gap-4 py-3 px-2 rounded-lg hover:bg-slate-50/80 transition-colors duration-200">
                    {/* Timeline connector */}
                    {i < MOCK_ACTIVITY.length - 1 && (
                      <div className="absolute left-[1.3rem] top-12 w-px h-[calc(100%-1.5rem)] bg-slate-200" />
                    )}
                    {/* Dot */}
                    <div className="relative z-10 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary-50 transition-colors">
                      <item.icon size={14} className="text-slate-500 group-hover:text-primary-600 transition-colors" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm text-slate-700 leading-snug">{item.text}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={11} />
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '450ms' }}>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-slate-100">
              <QuickAction to="/search" icon={Search} label="Search Students" desc="Find talent by skills, branch, or keywords" />
              <QuickAction to="/profile" icon={FileText} label="Update Resume" desc="Keep your profile optimized for AI matching" />
              <QuickAction to="/jobs" icon={Briefcase} label="Browse Jobs" desc="Explore opportunities posted by alumni & professors" />
              {(user.role === 'alumni' || user.role === 'professor') && (
                <QuickAction to="/jobs/create" icon={MapPin} label="Post a New Job" desc="Create a new job listing for students" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Trending Skills */}
        <div className="space-y-6">
          <Card className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Trending in MNNIT</CardTitle>
                <span className="text-xs font-medium text-slate-400">Demand %</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                {TRENDING_SKILLS.map((skill, i) => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{skill.name}</span>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">{skill.demand}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${skill.color} animate-progress-fill`}
                        style={{ width: `${skill.demand}%`, animationDelay: `${600 + i * 120}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Network Summary */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base">Your Network</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">156</p>
                  <p className="text-xs text-slate-500 mt-1">Students</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">23</p>
                  <p className="text-xs text-slate-500 mt-1">Alumni</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">12</p>
                  <p className="text-xs text-slate-500 mt-1">Professors</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">8</p>
                  <p className="text-xs text-slate-500 mt-1">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
