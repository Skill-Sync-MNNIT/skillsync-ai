import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Briefcase, Bell, TrendingUp, Users, ArrowUpRight,
  Flame, BarChart3, Lightbulb, ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

// ─── Static curated skill data ───────────────────────────────
// Reflects real demand trends visible in MNNIT job posts.
// Will be replaced by a live /api/trending endpoint when available.
const TRENDING_SKILLS = [
  { name: 'React / Next.js',  demand: 92, color: 'bg-blue-500',    badge: 'Hot',    badgeColor: 'bg-red-100 text-red-600' },
  { name: 'Python / ML',      demand: 87, color: 'bg-emerald-500', badge: 'Rising', badgeColor: 'bg-emerald-100 text-emerald-600' },
  { name: 'Node.js',          demand: 78, color: 'bg-amber-500',   badge: null,     badgeColor: '' },
  { name: 'Docker / K8s',     demand: 65, color: 'bg-violet-500',  badge: null,     badgeColor: '' },
  { name: 'System Design',    demand: 58, color: 'bg-rose-500',    badge: null,     badgeColor: '' },
  { name: 'TypeScript',       demand: 54, color: 'bg-sky-500',     badge: null,     badgeColor: '' },
];

// ─── Role-specific insight cards ────────────────────────────
// Values here are UI placeholders; replace with real API data
// (e.g. GET /notifications/unread-count, GET /jobs?mine=true) as those
// endpoints are built. Kept minimal to avoid misleading the user.
const ROLE_CARDS = {
  student: [
    { label: 'Notifications', sublabel: 'Check your inbox', icon: Bell,       color: 'amber',  to: '/notifications' },
    { label: 'Browse Jobs',   sublabel: 'Opportunities for you', icon: Briefcase,  color: 'blue',   to: '/jobs' },
    { label: 'Search Network', sublabel: 'Find alumni & professors', icon: Users, color: 'emerald', to: '/search' },
  ],
  alumni: [
    { label: 'Post a Job',    sublabel: 'Reach MNNIT talent', icon: Briefcase,  color: 'blue',   to: '/jobs/create' },
    { label: 'Notifications', sublabel: 'Check your inbox',   icon: Bell,       color: 'amber',  to: '/notifications' },
    { label: 'Search Students', sublabel: 'Browse AI-ranked profiles', icon: Users, color: 'emerald', to: '/search' },
  ],
  professor: [
    { label: 'Post a Project', sublabel: 'Open research positions', icon: Briefcase, color: 'blue',   to: '/jobs/create' },
    { label: 'Notifications',  sublabel: 'Check your inbox',        icon: Bell,      color: 'amber',  to: '/notifications' },
    { label: 'Find Students',  sublabel: 'Browse by skills',        icon: Users,     color: 'emerald', to: '/search' },
  ],
};

const COLOR_MAP: Record<string, { bg: string; iconBg: string; text: string; border: string }> = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/50',    iconBg: 'bg-blue-100 dark:bg-blue-900/50',    text: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-100 dark:border-blue-900/30' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/50',   iconBg: 'bg-amber-100 dark:bg-amber-900/50',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-100 dark:border-amber-900/30' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
};

// ─── Skeleton ───────────────────────────────────────────────
const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton-shimmer ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <SkeletonBlock className="h-40 w-full rounded-2xl" />
    <div className="grid gap-5 sm:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-6 space-y-3">
          <div className="flex justify-between">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-9 w-9 rounded-lg" />
          </div>
          <SkeletonBlock className="h-4 w-36" />
        </Card>
      ))}
    </div>
    <Card className="p-6 space-y-4">
      <SkeletonBlock className="h-5 w-44" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-4 w-10" />
          </div>
          <SkeletonBlock className="h-2.5 w-full rounded-full" />
        </div>
      ))}
    </Card>
  </div>
);

// ─── Nav card (navigates to a page section) ─────────────────
interface NavCardProps {
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  to: string;
  delay: number;
}

const NavCard = ({ label, sublabel, icon: Icon, color, to, delay }: NavCardProps) => {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <Link to={to}>
      <Card
        className={`group flex items-center gap-4 p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${c.border} animate-fade-in-up`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className={`h-10 w-10 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110`}>
          <Icon size={20} className={c.text} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 group-hover:text-primary-700 transition-colors">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sublabel}</p>
        </div>
        <ArrowUpRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-primary-500 transition-colors shrink-0" />
      </Card>
    </Link>
  );
};

// ─── Dashboard ───────────────────────────────────────────────
export const Dashboard = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await api.get('/api/dashboard');
      } catch {
        // API exists but returns minimal data — that's fine
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    init();
  }, []);

  if (!user) return null;
  if (isLoading) return <DashboardSkeleton />;

  const cards = ROLE_CARDS[user.role] ?? ROLE_CARDS.student;
  const userName = user.email.split('@')[0];

  return (
    <div className="space-y-7 pb-8">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-violet-700 p-6 md:p-8 animate-fade-in-up">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-3">
              <span>{getGreetingEmoji()}</span>
              <span>{getGreeting()}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome back, <span className="text-white/85">{userName}</span>
            </h1>
            <p className="mt-1.5 text-white/65 text-sm md:text-base max-w-md">
              Here's a quick look at what's happening in the MNNIT network.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {(user.role === 'alumni' || user.role === 'professor') && (
              <Link to="/jobs/create">
                <Button size="md" className="bg-white text-primary-700 hover:bg-white/90 shadow-lg shadow-primary-900/20">
                  <Briefcase size={15} className="mr-2" />
                  Post a Job
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick-nav cards ───────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c, i) => (
          <NavCard key={c.label} {...c} delay={i * 70} />
        ))}
      </div>

      {/* ── Trending Skills ───────────────────────────────────── */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '280ms' }}>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Flame size={13} className="text-white" />
              </div>
              <CardTitle className="text-base">Trending Skills in MNNIT</CardTitle>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <BarChart3 size={13} />
              <span>Demand Index</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {TRENDING_SKILLS.map((skill, i) => (
              <div key={skill.name} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {skill.name}
                    </span>
                    {skill.badge && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${skill.badgeColor} dark:bg-opacity-20`}>
                        {skill.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{skill.demand}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${skill.color} animate-progress-fill transition-all duration-300 group-hover:brightness-110`}
                    style={{ width: `${skill.demand}%`, animationDelay: `${400 + i * 80}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 rounded-xl bg-gradient-to-r from-slate-50 dark:from-slate-900 to-blue-50/50 dark:to-blue-900/10 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
            <Lightbulb size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tip:</span>{' '}
              Adding in-demand skills to your{' '}
              <Link to="/profile" className="text-primary-600 hover:underline font-medium">profile</Link>{' '}
              boosts your visibility in AI-powered searches.
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <Link
              to="/search"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
            >
              Explore the talent pool <ChevronRight size={13} />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ── "Trending Skills" stat card for context ───────────── */}
      <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '380ms' }}>
        <Card className="flex items-center gap-4 p-5 border-violet-100 dark:border-violet-900/30">
          <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {TRENDING_SKILLS.length}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Skills trending now</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 border-blue-100 dark:border-blue-900/30">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Briefcase size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Looking for work?</p>
            <Link
              to="/jobs"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Browse open jobs →
            </Link>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 border-emerald-100 dark:border-emerald-900/30">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Users size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Grow your network</p>
            <Link
              to="/search"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Search people →
            </Link>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;
