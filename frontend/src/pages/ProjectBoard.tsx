import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, User, Code, AlertCircle, UserPlus, Edit3, X, Search } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Pagination } from '../components/ui/Pagination';
import { NoData } from '../components/ui/NoData';
import { ListingCard } from '../components/ui/ListingCard';

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
  const [connections, setConnections] = useState<string[]>([]);

  // Pagination and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 4;

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Fetch projects first
      const projRes = await api.get('/projects');
      setProjects(projRes.data);

      // Try to fetch connections, but don't fail if it doesn't work
      try {
        const connRes = await api.get('/connections/list?limit=100');
        const connectedIds = (connRes.data.connections || []).map((c: any) =>
          c.requester._id === user?._id ? c.recipient._id : c.requester._id
        );
        setConnections(connectedIds);
      } catch (connErr) {
        console.warn('Networking data unavailable', connErr);
        // We don't toast here as it's non-critical
      }
    } catch (err) {
      toast('Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Filtering Logic
  const filteredProjects = projects.filter(project => {
    const searchLower = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.requiredSkills.some((skill: string) => skill.toLowerCase().includes(searchLower))
    );
  });

  // Pagination Logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    <div className="max-w-6xl mx-auto p-4 pt-0 sm:px-8 sm:pb-8 space-y-6 pb-24 lg:pb-8">
      {/* ── Header Area ────────────────────────────────────── */}
      {/* ── Modern Hero Header ────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-900 dark:to-[#1a1b1e] p-6 sm:p-10 rounded-[1.5rem] shadow-2xl shadow-primary-500/20 animate-fade-in">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 bg-primary-400/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
          <div className="flex items-center gap-6">

            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-2">
                Project Board
              </h1>
              <p className="text-primary-100 text-sm sm:text-base font-medium max-w-md opacity-90 leading-relaxed">
                Turn your ideas into reality by finding the perfect student teammates.
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Button
              onClick={() => {
                setIsEditing(false);
                setCurrentProject(null);
                setNewProject({ title: '', description: '', skills: '' });
                setShowAddModal(true);
              }}
              className="w-full sm:w-auto bg-white hover:bg-primary-50 text-primary-700 rounded-2xl h-11 sm:h-14 px-5 sm:px-8 font-bold sm:font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border-none"
            >
              <Plus size={window.innerWidth < 640 ? 18 : 22} className="mr-1" /> Post Project
            </Button>
          </div>
        </div>
      </div>

      {/* ── Search Bar ────────────────────────────────────── */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder={window.innerWidth < 500 ? "Search projects..." : "Search projects by title, description or skills..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white dark:bg-[#202123] border-2 border-slate-100 dark:border-[#383942] focus:border-primary-500 transition-all outline-none font-medium shadow-sm"
        />
      </div>

      {/* ── Main Layout ────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
            Available Projects
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 bg-slate-100 dark:bg-[#2a2b32] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg whitespace-nowrap">
              {filteredProjects.length} found
            </span>
          </h2>

          {/* project requests ui using inbox (add icon inbox fromLucide-react) */}
          {/* <button 
            onClick={() => window.location.href = '/network?tab=requests'}
            className="flex items-center gap-2 bg-white dark:bg-[#202123] text-slate-700 dark:text-slate-300 px-2.5 py-2 sm:px-4 sm:py-2 rounded-xl border border-slate-200 dark:border-[#383942] hover:border-primary-400 hover:text-primary-600 transition-all relative group shadow-sm ml-2"
          >
            <Inbox size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-sm font-semibold">Requests</span>
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#202123] shadow-md">
              12
            </span>
          </button> */}
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center bg-white dark:bg-[#202123] rounded-3xl border border-slate-100 dark:border-[#383942]">
            <LoadingSpinner message="Scanning for active collaborations..." />
          </div>
        ) : filteredProjects.length === 0 ? (
          <NoData
            type="search"
            title="No projects found"
            description={searchQuery ? "No projects match your search criteria. Try different keywords." : "Be the first to start something and invite others to join your journey!"}
            action={!searchQuery && (
              <Button variant="outline" onClick={() => setShowAddModal(true)} className="rounded-xl">
                Post Your First Project
              </Button>
            )}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentProjects.map((p) => {
                const isOwner = user?._id === p.owner?._id;
                const isConnected = connections.includes(p.owner?._id);
                return (
                  <ListingCard
                    key={p._id}
                    title={p.title}
                    description={p.description}
                    status={p.status}
                    statusColor={p.status === 'open' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50'}
                    posterName={p.owner?.name || 'Student'}
                    posterAvatar={p.owner?.name?.charAt(0)}
                    date={new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    skills={p.requiredSkills || []}
                    isOwner={isOwner}
                    onEdit={() => handleEditClick(p)}
                    onDelete={() => handleDeleteProject(p._id)}
                    actionText={isConnected ? undefined : "Connect"}
                    actionIcon={isConnected ? null : <UserPlus size={12} />}
                    onActionClick={isConnected ? undefined : (e) => { e.stopPropagation(); handleConnect(p.owner._id); }}
                    onCardClick={() => {
                      setViewProject(p);
                      setShowViewModal(true);
                    }}
                  />
                );
              })}
            </div>

            {/* ── Pagination Controls ────────────────────────── */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={paginate}
            />
          </>
        )}
      </div>

      {/* ── Add/Edit Modal ────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#202123] w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-[#383942] animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-[#383942]">
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
                className="p-3 rounded-2xl bg-slate-50 dark:bg-[#2a2b32] text-slate-400 hover:text-slate-600 transition-colors"
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
                    className="w-full rounded-2xl border-2 border-slate-200 dark:border-[#383942] bg-transparent p-4 text-sm focus:border-primary-500 focus:ring-0 transition-all outline-none"
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
          <div className="bg-white dark:bg-[#202123] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-[#383942] animate-in zoom-in-95 duration-200">
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
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#2a2b32] px-3 py-1 rounded-full"><User size={14} /> {viewProject.owner?.name}</span>
                    <span className="h-1 w-1 bg-slate-300 rounded-full" />
                    <span>{new Date(viewProject.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                </div>
                <div className="px-5 py-2 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest border border-emerald-100">
                  {viewProject.status}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#40414f] rounded-3xl p-6 mb-8 border border-slate-100 dark:border-[#565869]">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 pl-1">Project Description</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                  {viewProject.description}
                </p>
              </div>

              <div className="mb-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 pl-1">Required Expertise</h4>
                <div className="flex flex-wrap gap-2.5">
                  {viewProject.requiredSkills.map((skill: string) => (
                    <span key={skill} className="flex items-center gap-2 bg-white dark:bg-[#2a2b32] text-slate-900 dark:text-white px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 dark:border-[#565869] shadow-sm">
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
