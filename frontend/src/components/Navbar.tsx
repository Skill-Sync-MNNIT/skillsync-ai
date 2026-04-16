import { useState, useRef, useEffect } from 'react';
import {
  LogOut, User as UserIcon, ChevronDown, Menu, X, Sun, Moon,
  LayoutDashboard, Search, Briefcase, Users, MessageSquare, Rocket, Bell, Settings,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from './ui/Button';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      const response = await api.post('/auth/logout').catch(() => null);
      const msg = response?.data?.message || 'Logged out successfully';
      toast(msg, 'success');
    } finally {
      logout();
      navigate('/auth/login', { replace: true });
    }
  };

  const userName = user?.name || user?.email?.split('@')[0] || '';
  const initials = userName.split(/[\s.]+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const isLoggedIn = isAuthenticated();

  // Mobile nav links
  const mobileNavLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/search', icon: Search, label: 'AI Search', show: true },
    { to: '/jobs', icon: Briefcase, label: 'Jobs', show: true },
    { to: '/networking', icon: Users, label: 'Network', show: true },
    { to: '/messages', icon: MessageSquare, label: 'Messages', show: true },
    { to: '/projects', icon: Rocket, label: 'Projects', show: user?.role === 'student' },
    { to: '/profile', icon: UserIcon, label: 'My Profile', show: true },
    { to: '/notifications', icon: Bell, label: 'Notifications', show: true },
    { to: '/settings', icon: Settings, label: 'Settings', show: true },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass ghost-border-visible transition-colors duration-200">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 font-bold text-white text-sm shadow-[0_4px_12px_rgba(34,197,94,0.25)] group-hover:shadow-[0_6px_20px_rgba(34,197,94,0.35)] transition-shadow">
            S
          </div>
          <span className="text-lg font-bold tracking-[-0.02em] text-slate-900 dark:text-white hidden sm:block">
            SkillSync <span className="text-primary-600">AI</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#2a2b32] transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {isLoggedIn ? (
            <>
              {/* Desktop: Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#2a2b32] border border-slate-100 dark:border-[#383942] hover:bg-slate-100 dark:hover:bg-[#343541] transition-all duration-200"
                >
                  <div className="h-7 w-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-400">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                    {userName}
                  </span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#202123] rounded-2xl border border-slate-100 dark:border-[#383942] ambient-shadow py-1.5 animate-scale-in origin-top-right z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-[#383942]">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{userName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                      <span className="mt-1.5 inline-flex items-center rounded-lg bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
                        {user?.role}
                      </span>
                    </div>

                    {/* Quick Link */}
                    <div className="py-1.5">
                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2b32] hover:text-primary-600 transition-colors"
                      >
                        <LayoutDashboard size={16} className="text-slate-400" />
                        Dashboard
                      </Link>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-slate-100 dark:border-[#383942] pt-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile: Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-[#2a2b32] transition-colors"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isLoggedIn && mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 dark:border-[#383942] bg-white dark:bg-[#202123] animate-fade-in">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-[#383942] flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-400">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{userName}</p>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {user?.role}
              </span>
            </div>
          </div>
          <div className="py-2">
            {mobileNavLinks.filter(l => l.show).map((link) => {
              const active = location.pathname === link.to || (link.to === '/jobs' && location.pathname.startsWith('/jobs'));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${active
                    ? 'text-primary-700 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2b32]'
                    }`}
                >
                  <link.icon size={18} className={active ? 'text-primary-600' : 'text-slate-400'} />
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-t border-slate-100 dark:border-[#383942] mt-1"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
