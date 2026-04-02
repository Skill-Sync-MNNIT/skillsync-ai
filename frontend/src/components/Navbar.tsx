import { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon, LayoutDashboard, Briefcase, ChevronDown, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/Button';
import api from '../services/api';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      logout();
      navigate('/auth/login', { replace: true });
    }
  };

  const userName = user?.email?.split('@')[0] || '';
  const initials = userName.split('.').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const isLoggedIn = isAuthenticated();

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/profile', icon: UserIcon, label: 'My Profile', show: true },
    { to: '/jobs', icon: Briefcase, label: 'Browse Jobs', show: true },
    { to: '/jobs/create', icon: Briefcase, label: 'Post a Job', show: user?.role === 'alumni' || user?.role === 'professor' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 font-bold text-white text-sm group-hover:bg-primary-700 transition-colors">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">
            SkillSync <span className="text-primary-600">AI</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Desktop: Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200"
                >
                  <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {userName}
                  </span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Desktop Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 py-1.5 animate-scale-in origin-top-right z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{userName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                      <span className="mt-1.5 inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-600 border border-primary-100">
                        {user?.role}
                      </span>
                    </div>

                    {/* Links */}
                    <div className="py-1.5">
                      {navLinks.filter(l => l.show).map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors"
                        >
                          <link.icon size={16} className="text-slate-400" />
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-slate-100 pt-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </>
          ) : (
            /* Unauthenticated: Sign In / Get Started */
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
        <div className="sm:hidden border-t border-slate-200 bg-white animate-fade-in">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{userName}</p>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600">
                {user?.role}
              </span>
            </div>
          </div>
          <div className="py-2">
            {navLinks.filter(l => l.show).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <link.icon size={16} className="text-slate-400" />
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
