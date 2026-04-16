import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Card, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Rocket, Plus, User, Code, AlertCircle, UserPlus, Edit3, Trash2, X, Info } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const ProjectBoard = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [viewProject, setViewProject] = useState<any>(null);
  const [newProject, setNewProject] = useState({ title: '', description: '', skills: '' });
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      toast('Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'student') {
      fetchProjects();
    }
  }, [user]);

  const handlePostProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);
    try {
      if (isEditing && currentProject) {
        await api.put(`/projects/${currentProject._id}`, {
          title: newProject.title,
          description: newProject.description,
          requiredSkills: newProject.skills.split(',').map((s) => s.trim()).filter((s) => s),
        });
        toast('Project updated successfully!', 'success');
      } else {
        await api.post('/projects', {
          title: newProject.title,
          description: newProject.description,
          requiredSkills: newProject.skills.split(',').map((s) => s.trim()).filter((s) => s),
        });
        toast('Project posted successfully!', 'success');
      }
      setNewProject({ title: '', description: '', skills: '' });
      setIsEditing(false);
      setCurrentProject(null);
      setShowAddModal(false);
      fetchProjects();
    } catch (err) {
      toast('Failed to save project', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditClick = (project: any) => {
    setCurrentProject(project);
    setNewProject({
      title: project.title,
      description: project.description,
      skills: project.requiredSkills.join(', '),
    });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to close this project? This will permanently remove the listing.')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      toast('Project closed successfully', 'success');
      fetchProjects();
    } catch (err) {
      toast('Failed to close project', 'error');
    }
  };

  const handleConnect = async (ownerId: string) => {
    try {
      await api.post('/connections/request', { recipientId: ownerId });
      toast('Connection request sent to project owner!', 'success');
      fetchProjects(); 
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to send request', 'error');
    }
  };

  if (user?.role !== 'student') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-slate-500 mt-2 max-w-md">
          The Student Collaboration Board is strictly limited to students to encourage safe and peer-to-peer project discovery.
        </p>
        <Button className="mt-6" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 pb-24 lg:pb-8">
      {/* ── Header Area ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <Rocket className="text-primary-600" size={32} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Project Collaboration</h1>
            <p className="text-sm text-slate-500 font-medium">Find teammates and build something amazing together</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <p className="hidden sm:flex text-xs font-bold uppercase tracking-widest text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl border border-primary-100 dark:border-primary-800 items-center gap-2">
              <span className="h-2 w-2 bg-primary-500 rounded-full animate-pulse"></span>
              Student Space
            </p>
            <Button 
                onClick={() => {
                    setIsEditing(false);
                    setCurrentProject(null);
                    setNewProject({ title: '', description: '', skills: '' });
                    setShowAddModal(true);
                }}
                className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary-500/20"
            >
                <Plus size={18} className="mr-2" /> Post Project
            </Button>
        </div>
      </div>

      {/* ── Main Layout ────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Available Opportunities
                <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {projects.length} Total
                </span>
            </h2>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <LoadingSpinner message="Scanning for active collaborations..." />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center p-16 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-fade-in">
            <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No projects found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm">Be the first to start something and invite others to join your journey!</p>
            <Button variant="outline" onClick={() => setShowAddModal(true)}>
                Post the first project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((p) => {
              const isOwner = user?._id === p.owner?._id;
              return (
                <Card 
                    key={p._id} 
                    className="group hover:shadow-xl hover:border-primary-400/50 transition-all duration-300 rounded-3xl overflow-hidden animate-fade-in-up border-slate-200 dark:border-slate-800 cursor-pointer"
                    onClick={() => {
                        setViewProject(p);
                        setShowViewModal(true);
                    }}
                >
                  <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                    <div className="flex justify-between items-start gap-4 mb-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                                {p.title}
                            </h3>
                            {isOwner && (
                                <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">My Post</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5 font-medium">
                            <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                {p.owner?.name?.charAt(0) || 'U'}
                            </div>
                            <span>{p.owner?.name || 'Fellow Student'}</span>
                          </div>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="text-xs">{new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider ${p.status === 'open' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50'}`}>
                        {p.status}
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed italic">
                        "{p.description}"
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8 mt-auto">
                      {p.requiredSkills.slice(0, 4).map((skill: string) => (
                        <span key={skill} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-100 dark:border-slate-700">
                          <Code size={12} className="text-slate-400" /> {skill}
                        </span>
                      ))}
                      {p.requiredSkills.length > 4 && (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center px-1">+{p.requiredSkills.length - 4} more</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-5 border-t border-slate-100 dark:border-slate-800">
                      {isOwner ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(p);
                            }}
                            className="flex-1 rounded-xl h-11 font-bold dark:border-slate-700 hover:bg-slate-50"
                          >
                            <Edit3 size={16} className="mr-2" /> Edit
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(p._id);
                            }}
                            className="rounded-xl h-11 w-11 p-0 flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      ) : (
                        <Button 
                            className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 transition-all" 
                            size="sm" 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleConnect(p.owner._id);
                            }}
                        >
                          <UserPlus size={16} className="mr-2" /> Connect to Collaborate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    {isEditing ? <Edit3 size={20} className="text-primary-600" /> : <Plus size={20} className="text-primary-600" />}
                  </div>
                  {isEditing ? 'Edit Project' : 'Post a New Project'}
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">Fill in the details to find your next teammates</p>
              </div>
              <button 
                onClick={() => {
                    setShowAddModal(false);
                    setIsEditing(false);
                    setCurrentProject(null);
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
              <form onSubmit={handlePostProject} className="space-y-5">
                <Input
                  label="What's the project title?"
                  placeholder="e.g. AI Portfolio Generator"
                  required
                  value={newProject.title}
                  className="h-12 rounded-2xl"
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                />
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest pl-1">Tell us more about it</label>
                  <textarea
                    className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-transparent p-4 text-sm focus:border-primary-500 focus:ring-0 transition-all outline-none"
                    rows={4}
                    placeholder="Briefly describe what you're building and who you're looking for..."
                    required
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  ></textarea>
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
                        onClick={() => setShowAddModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-[2] h-12 rounded-2xl font-bold shadow-lg shadow-primary-500/20" isLoading={isPosting}>
                      {isEditing ? 'Save Changes' : 'Launch Post'}
                    </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── View Details Modal ────────────────────────────── */}
      {showViewModal && viewProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <div className="relative h-32 bg-primary-600 flex items-end px-8 pb-6">
                 <button 
                   onClick={() => setShowViewModal(false)}
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
                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"><User size={14} /> {viewProject.owner?.name}</span>
                            <span className="h-1 w-1 bg-slate-300 rounded-full" />
                            <span>{new Date(viewProject.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                        </div>
                    </div>
                    <div className="px-5 py-2 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest border border-emerald-100">
                        {viewProject.status}
                    </div>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 mb-8 border border-slate-100 dark:border-slate-700">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 pl-1">Project Description</h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                        {viewProject.description}
                    </p>
                 </div>

                 <div className="mb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 pl-1">Required Expertise</h4>
                    <div className="flex flex-wrap gap-2.5">
                        {viewProject.requiredSkills.map((skill: string) => (
                            <span key={skill} className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                                <Code size={14} className="text-primary-500" />
                                {skill}
                            </span>
                        ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;
