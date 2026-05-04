import { X, Star } from 'lucide-react';

interface SkillBadgeProps {
  label: string;
  /**
   * default     — plain badge (most pages)
   * highlighted — AI-matched skill with star icon (ViewProfile)
   * removable   — has X button to delete (Settings, JobCreate)
   */
  variant?: 'default' | 'highlighted' | 'removable';
  onRemove?: () => void;
}

export const SkillBadge = ({ label, variant = 'default', onRemove }: SkillBadgeProps) => {
  if (variant === 'highlighted') {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-200 dark:ring-primary-800 transition-all">
        <Star size={14} className="fill-primary-500 text-primary-500 shrink-0" />
        {label}
      </span>
    );
  }

  if (variant === 'removable') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
        {label}
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 text-primary-400 hover:text-primary-700 dark:hover:text-primary-200 transition-colors"
          aria-label={`Remove ${label}`}
        >
          <X size={14} />
        </button>
      </span>
    );
  }

  // default
  return (
    <span className="inline-flex items-center px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800 rounded-lg text-sm font-semibold shadow-sm transition-all hover:bg-primary-100 dark:hover:bg-primary-900/40">
      {label}
    </span>
  );
};

export default SkillBadge;
