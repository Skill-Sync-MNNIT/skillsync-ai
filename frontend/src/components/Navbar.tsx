import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import api from '../services/api';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Best effort to tell server we logged out to revoke refresh token
      await api.post('/auth/logout').catch(() => {});
    } finally {
      logout();
      navigate('/auth/login', { replace: true });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 font-bold text-white">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">SkillSync AI</span>
        </div>

        <div className="flex items-center gap-4">
          {user && (
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
               <UserIcon size={16} className="text-slate-500" />
               <span className="text-sm font-medium text-slate-700">{user.email.split('@')[0]}</span>
               <span className="ml-1 rounded-md bg-white px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm border border-slate-200">
                 {user.role}
               </span>
             </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-red-600 hover:bg-red-50">
            <LogOut size={18} className="mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
