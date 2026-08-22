import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' = red confirm button (delete/remove/deactivate). 'warning' = amber. Default = primary. */
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const VARIANT_CONFIG = {
  danger: {
    icon: <Trash2 size={22} />,
    iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white border-none',
  },
  warning: {
    icon: <AlertTriangle size={22} />,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white border-none',
  },
  default: {
    icon: <AlertTriangle size={22} />,
    iconBg: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600',
    confirmClass: '',
  },
};

/**
 * Usage:
 *   const [confirmOpen, setConfirmOpen] = useState(false);
 *   <ConfirmDialog
 *     isOpen={confirmOpen}
 *     title="Remove Connection?"
 *     description="This action cannot be undone."
 *     confirmLabel="Remove"
 *     variant="danger"
 *     onConfirm={handleRemove}
 *     onCancel={() => setConfirmOpen(false)}
 *   />
 */
export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const config = VARIANT_CONFIG[variant];

  // Focus cancel button on open (safer default)
  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#202123] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#383942] animate-slide-in-bottom p-6">
        {/* Close X */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2b32] transition-all"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
            {config.icon}
          </div>
          <div>
            <h2
              id="confirm-dialog-title"
              className="text-lg font-bold text-slate-900 dark:text-white leading-tight"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <Button
            ref={cancelRef}
            variant="outline"
            onClick={onCancel}
            className="rounded-xl"
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            className={`rounded-xl px-6 ${config.confirmClass || ''}`}
            variant={variant === 'default' ? 'primary' : variant === 'danger' ? 'danger' : 'outline'}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
