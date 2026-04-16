import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Search, Briefcase, Users, MessageSquare,
  Rocket, User, Bell, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  show: boolean;
}

export const AppSidebar = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/search', icon: Search, label: 'AI Search', show: true },
    { to: '/jobs', icon: Briefcase, label: 'Jobs', show: true },
    { to: '/networking', icon: Users, label: 'Network', show: true },
    { to: '/messages', icon: MessageSquare, label: 'Messages', show: true },
    { to: '/projects', icon: Rocket, label: 'Projects', show: user?.role === 'student' },
    { to: '/profile', icon: User, label: 'Profile', show: true },
    { to: '/notifications', icon: Bell, label: 'Notifications', show: true },
    { to: '/settings', icon: Settings, label: 'Settings', show: true },
  ];

  const isActive = (path: string) => {
    if (path === '/jobs') return location.pathname.startsWith('/jobs');
    return location.pathname === path;
  };

  return (
    <aside
      className={`hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-16 bg-bg-surface-low dark:bg-slate-900/80 ghost-border-visible sidebar-transition shrink-0 z-30 ${
        collapsed ? 'w-16' : 'w-[220px]'
      }`}
    >
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.filter(item => item.show).map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                active
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm shadow-primary-100/50 cursor-default'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 hover:text-primary-700 dark:hover:text-primary-400 hover:translate-x-1 hover:shadow-sm'
              }`}
            >
              <item.icon
                size={20}
                className={`shrink-0 transition-all duration-300 group-hover:scale-110 ${
                  active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-primary-500'
                }`}
              />
              {!collapsed && (
                <span className="truncate transition-all duration-300 font-semibold tracking-tight">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 py-3 border-t border-border-ghost dark:border-slate-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-all"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
