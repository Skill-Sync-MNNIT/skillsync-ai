import React from 'react';
import { ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { Card, CardContent } from './Card';

interface ListingCardProps {
  title: string;
  description: string;
  status: string;
  statusColor?: string;
  posterName: string;
  posterAvatar?: string;
  date: string;
  skills: string[];
  actionText?: string;
  actionIcon?: React.ReactNode;
  onActionClick?: (e: React.MouseEvent) => void;
  onCardClick?: () => void;
  isOwner?: boolean;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  className?: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  title,
  description,
  status,
  statusColor,
  posterName,
  posterAvatar,
  date,
  skills,
  actionText = "View Details",
  actionIcon = <ChevronRight size={14} />,
  onActionClick,
  onCardClick,
  isOwner,
  onEdit,
  onDelete,
  className = ""
}) => {
  return (
    <Card
      className={`group hover:shadow-xl hover:border-primary-400/50 transition-all duration-300 rounded-3xl overflow-hidden animate-fade-in-up border-slate-200 dark:border-[#383942] cursor-pointer ${className}`}
      onClick={onCardClick}
    >
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors leading-tight mb-1">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-[#2a2b32] flex items-center justify-center text-[9px] font-bold text-primary-600">
                {posterAvatar || posterName.charAt(0) || 'U'}
              </div>
              <span className="truncate max-w-[100px]">{posterName}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span>{date}</span>
            </div>
          </div>
          <div className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${statusColor || 'bg-slate-50 text-slate-600'}`}>
            {status}
          </div>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 line-clamp-1 italic">
          "{description}"
        </p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 dark:border-[#383942]">
          <div className="flex gap-1.5">
            {skills.slice(0, 2).map((skill) => (
              <span key={skill} className="text-[10px] font-semibold bg-slate-50 dark:bg-[#2a2b32] text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-100 dark:border-[#383942]">
                {skill}
              </span>
            ))}
            {skills.length > 2 && (
              <span className="text-[9px] font-bold text-slate-400 self-center">+{skills.length - 2}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(e); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div 
                className="flex items-center gap-1 text-[11px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all"
                onClick={onActionClick}
              >
                {actionText}
                {actionIcon}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
