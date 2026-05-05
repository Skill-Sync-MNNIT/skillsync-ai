import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { Button, cn } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  height?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  height
}) => {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center animate-fade-in", 
        className
      )}
      style={height ? { height } : undefined}
    >
      <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/10 rounded-3xl flex items-center justify-center mb-6 text-primary-600 shadow-sm ring-1 ring-primary-100 dark:ring-primary-900/30">
        <Icon size={40} className="animate-pulse" />
      </div>
      <h3 className="font-extrabold text-slate-900 dark:text-white mb-2 text-lg leading-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 max-w-[240px] leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          size="sm" 
          onClick={onAction} 
          variant="outline"
          className="rounded-xl px-6 border-primary-200 text-primary-600 hover:bg-primary-50 transition-all duration-300"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
