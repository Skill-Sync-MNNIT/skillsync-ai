import { X, User, Code } from 'lucide-react';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  viewProject: any;
  onClose: () => void;
}

/**
 * Read-only detail view for a single project listing.
 * Extracted from ProjectBoard.tsx lines 362–416.
 */
export const ProjectDetailsModal = ({
  isOpen,
  viewProject,
  onClose,
}: ProjectDetailsModalProps) => {
  if (!isOpen || !viewProject) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#202123] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-[#383942] animate-in zoom-in-95 duration-200">
        <div className="relative h-32 bg-primary-600 flex items-end px-8 pb-6">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-md"
          >
            <X size={20} />
          </button>
          <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center absolute -bottom-10 left-8 border-[6px] border-white dark:border-slate-900 text-primary-600 font-black text-3xl">
            {viewProject.owner?.name?.charAt(0) || 'P'}
          </div>
        </div>

        <div className="px-8 pt-16 pb-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-2 tracking-tight">
                {viewProject.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#2a2b32] px-3 py-1 rounded-full">
                  <User size={14} /> {viewProject.owner?.name}
                </span>
                <span className="h-1 w-1 bg-slate-300 rounded-full" />
                <span>
                  {new Date(viewProject.createdAt).toLocaleDateString(undefined, {
                    dateStyle: 'long',
                  })}
                </span>
              </div>
            </div>
            <div className="px-5 py-2 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest border border-emerald-100">
              {viewProject.status}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#40414f] rounded-3xl p-6 mb-8 border border-slate-100 dark:border-[#565869]">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 pl-1">
              Project Description
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
              {viewProject.description}
            </p>
          </div>

          <div className="mb-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 pl-1">
              Required Expertise
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {viewProject.requiredSkills.map((skill: string) => (
                <span
                  key={skill}
                  className="flex items-center gap-2 bg-white dark:bg-[#2a2b32] text-slate-900 dark:text-white px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 dark:border-[#565869] shadow-sm"
                >
                  <Code size={14} className="text-primary-500" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
