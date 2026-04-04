import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, LogIn, UserPlus } from 'lucide-react';
import { Button } from './ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingQuery?: string;
}

export const AuthModal = ({ isOpen, onClose, pendingQuery }: AuthModalProps) => {
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const redirectParam = pendingQuery
    ? `?redirect=${encodeURIComponent('/')}&q=${encodeURIComponent(pendingQuery)}`
    : `?redirect=${encodeURIComponent('/')}`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-violet-500 to-primary-500 animate-gradient-shift" />

        {/* Content */}
        <div className="px-8 py-10 text-center">
          {/* Icon */}
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-primary-500" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sign in to discover talent
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Create a free account to unlock AI-powered search and find the perfect candidates from the MNNIT talent pool.
          </p>

          {pendingQuery && (
            <div className="mt-5 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-left">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Your search</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{pendingQuery}"</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-8 space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate(`/auth/login${redirectParam}`)}
            >
              <LogIn size={18} className="mr-2" />
              Sign In
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate(`/auth/register${redirectParam}`)}
            >
              <UserPlus size={18} className="mr-2" />
              Create Account
            </Button>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Free for all MNNIT students, alumni, and professors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
