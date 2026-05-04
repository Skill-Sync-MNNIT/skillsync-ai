import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  Briefcase, Bell, Users, ArrowUpRight,
  Flame, BarChart3, Lightbulb,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';

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

// ─── Constants ───────────────────────────────────────────────
const SKILL_COLORS = [
  'bg-emerald-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-sky-500'
];

interface TrendingSkill {
  name: string;
  count: number;
}

const ROLE_CARDS = {
  student: [
    { label: 'Notifications', sublabel: 'Check your inbox', icon: Bell, color: 'amber', to: '/notifications' },
    { label: 'Browse Jobs', sublabel: 'Opportunities for you', icon: Briefcase, color: 'emerald', to: '/jobs' },
    { label: 'Search Network', sublabel: 'Find alumni & professors', icon: Users, color: 'teal', to: '/search' },
  ],
  alumni: [
    { label: 'Browse Jobs', sublabel: 'Explore MNNIT opportunities', icon: Briefcase, color: 'emerald', to: '/jobs' },
    { label: 'Notifications', sublabel: 'Check your inbox', icon: Bell, color: 'amber', to: '/notifications' },
    { label: 'Search Students', sublabel: 'Browse AI-ranked profiles', icon: Users, color: 'teal', to: '/search' },
  ],
  professor: [
    { label: 'Browse Jobs', sublabel: 'View all active postings', icon: Briefcase, color: 'emerald', to: '/jobs' },
    { label: 'Notifications', sublabel: 'Check your inbox', icon: Bell, color: 'amber', to: '/notifications' },
    { label: 'Find Students', sublabel: 'Browse by skills', icon: Users, color: 'teal', to: '/search' },
  ],
};

const COLOR_MAP: Record<string, { bg: string; iconBg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/50', iconBg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/30' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-950/50', iconBg: 'bg-teal-100 dark:bg-teal-900/50', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-teal-900/30' },
};

// ─── Nav card ─────────────────────────────────────────────────
interface NavCardProps {
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  to: string;
  delay: number;
}

const NavCard = ({ label, sublabel, icon: Icon, color, to, delay }: NavCardProps) => {
  const c = COLOR_MAP[color] || COLOR_MAP.emerald;
  return (
    <Link to={to}>
      <Card
        className={`group flex items-center gap-4 p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${c.border} animate-fade-in-up`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className={`h-11 w-11 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110`}>
          <Icon size={20} className={c.text} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 group-hover:text-primary-600 transition-colors">{label}</p>
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
  const { toast } = useToast();
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const response = await api.get('/api/dashboard');
        setTrendingSkills(response.data.trendingSkills || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        toast('Failed to load dashboard insights', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  if (!user) return null;
  if (isLoading) return <DashboardSkeleton />;

  const cards = ROLE_CARDS[user.role] ?? ROLE_CARDS.student;
  const userName = user.name || user.email.split('@')[0];


  return (
    <div className="space-y-8 pb-8">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#14b8a6] p-8 md:p-12 animate-fade-in-up shadow-[0_20px_48px_rgba(34,197,94,0.15)]">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none blur-xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.06] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none blur-xl" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-teal-400/10 rounded-full pointer-events-none blur-2xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-4">
            <span>{getGreetingEmoji()}</span>
            <span>{getGreeting()}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-[-0.02em] text-white mb-2">
            Welcome back, <span className="text-white/80">{userName}</span>
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-lg mb-6">
            Here's a quick look at what's happening in the MNNIT network.
          </p>
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
        <CardHeader className="border-b border-slate-100 dark:border-[#383942]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Flame size={14} className="text-white" />
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
          <div className="grid gap-5 sm:grid-cols-2">
            {trendingSkills.length > 0 ? (
              trendingSkills.map((skill, i) => {
                const maxCount = Math.max(...trendingSkills.map(s => s.count), 1);
                const demand = Math.round((skill.count / maxCount) * 100);
                const badge = i === 0 ? 'Hot' : i === 1 ? 'Rising' : null;
                const badgeColor = i === 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100';

                return (
                  <div key={skill.name} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {skill.name}
                        </span>
                        {badge && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${badgeColor} dark:bg-opacity-20`}>
                            {badge}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{demand}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-[#2a2b32] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${SKILL_COLORS[i % SKILL_COLORS.length]} animate-progress-fill transition-all duration-300 group-hover:brightness-110`}
                        style={{ width: `${demand}%`, animationDelay: `${400 + i * 80}ms` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center text-slate-500 italic">
                No active job trends to display yet.
              </div>
            )}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-slate-50 dark:from-slate-900 to-emerald-50/50 dark:to-emerald-900/10 border border-slate-100 dark:border-[#383942] flex items-start gap-3">
            <Lightbulb size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tip:</span>{' '}
              Adding in-demand skills to your profile boosts your visibility in AI-powered searches.
            </p>
          </div>

        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;
