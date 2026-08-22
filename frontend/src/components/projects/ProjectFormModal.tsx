import { Plus, Edit3, X } from 'lucide-react';
import { CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ProjectFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  isPosting: boolean;
  newProject: { title: string; description: string; skills: string };
  setNewProject: (val: { title: string; description: string; skills: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

/**
 * Modal for creating or editing a project listing.
 * Extracted from ProjectBoard.tsx lines 291–359.
 */
export const ProjectFormModal = ({
  isOpen,
  isEditing,
  isPosting,
  newProject,
  setNewProject,
  onSubmit,
  onClose,
}: ProjectFormModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#202123] w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-[#383942] animate-in zoom-in-95 duration-200">
        <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-[#383942]">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                {isEditing ? (
                  <Edit3 size={20} className="text-primary-600" />
                ) : (
                  <Plus size={20} className="text-primary-600" />
                )}
              </div>
              {isEditing ? 'Edit Project' : 'Post a New Project'}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Fill in the details to find your next teammates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-[#2a2b32] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <Input
              label="What's the project title?"
              placeholder="e.g. AI Portfolio Generator"
              required
              value={newProject.title}
              className="h-12 rounded-2xl"
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                Tell us more about it
              </label>
              <textarea
                className="w-full rounded-2xl border-2 border-slate-200 dark:border-[#383942] bg-transparent p-4 text-sm focus:border-primary-500 focus:ring-0 transition-all outline-none"
                rows={4}
                placeholder="Briefly describe what you're building and who you're looking for..."
                required
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>
            <Input
              label="Skills looking for (comma separated)"
              placeholder="React, Python, Node.js"
              value={newProject.skills}
              className="h-12 rounded-2xl"
              onChange={(e) => setNewProject({ ...newProject, skills: e.target.value })}
            />
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-2xl font-bold"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-[2] h-12 rounded-2xl font-bold shadow-lg shadow-primary-500/20"
                isLoading={isPosting}
              >
                {isEditing ? 'Save Changes' : 'Launch Post'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;
