import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Plus, AlertCircle, UserPlus, Search } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Pagination } from '../components/ui/Pagination';
import { NoData } from '../components/ui/NoData';
import { ListingCard } from '../components/ui/ListingCard';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import { ProjectDetailsModal } from '../components/projects/ProjectDetailsModal';
import { usePagination } from '../hooks/usePagination';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Fire both independent requests at the same time — saves ~300ms vs sequential
      const [projRes, connRes] = await Promise.all([
        api.get('/projects'),
        api.get('/connections/list?limit=100').catch((err) => {
          console.warn('Networking data unavailable', err);
          return null; // connections are non-critical, don't block projects
        }),
      ]);

      setProjects(projRes.data);

      if (connRes) {
        const connectedIds = (connRes.data.connections || []).map((c: any) =>
          c.requester._id === user?._id ? c.recipient._id : c.requester._id
        );
        setConnections(connectedIds);
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

  // Filtering
  const filteredProjects = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.requiredSkills.some((skill: string) =>
        skill.toLowerCase().includes(searchLower)
      )
    );
  });

  // Pagination via hook
  const { currentItems: currentProjects, currentPage, totalPages, setPage } =
    usePagination(filteredProjects, 4);

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

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${projectToDelete}`);
      toast('Project closed successfully', 'success');
      fetchProjects();
    } catch (err) {
      toast('Failed to close project', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
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
          The Student Collaboration Board is strictly limited to students to encourage safe and
          peer-to-peer project discovery.
        </p>
        <Button className="mt-6" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pt-0 sm:px-8 sm:pb-8 space-y-6 pb-24 lg:pb-8">
      {/* ── Modern Hero Header ────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-900 dark:to-[#1a1b1e] p-6 sm:p-10 rounded-[1.5rem] shadow-2xl shadow-primary-500/20 animate-fade-in">
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
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors"
          size={20}
        />
        <input
          type="text"
          placeholder={
            window.innerWidth < 500
              ? 'Search projects...'
              : 'Search projects by title, description or skills...'
          }
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
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center bg-white dark:bg-[#202123] rounded-3xl border border-slate-100 dark:border-[#383942]">
            <LoadingSpinner message="Scanning for active collaborations..." />
          </div>
        ) : filteredProjects.length === 0 ? (
          <NoData
            type="search"
            title="No projects found"
            description={
              searchQuery
                ? 'No projects match your search criteria. Try different keywords.'
                : 'Be the first to start something and invite others to join your journey!'
            }
            action={
              !searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(true)}
                  className="rounded-xl"
                >
                  Post Your First Project
                </Button>
              )
            }
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
                    statusColor={
                      p.status === 'open'
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-slate-500 bg-slate-50'
                    }
                    posterName={p.owner?.name || 'Student'}
                    posterAvatar={p.owner?.name?.charAt(0)}
                    date={new Date(p.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                    skills={p.requiredSkills || []}
                    isOwner={isOwner}
                    onEdit={() => handleEditClick(p)}
                    onDelete={() => {
                      setProjectToDelete(p._id);
                      setShowDeleteConfirm(true);
                    }}
                    actionText={isConnected ? undefined : 'Connect'}
                    actionIcon={isConnected ? null : <UserPlus size={12} />}
                    onActionClick={
                      isConnected
                        ? undefined
                        : (e) => {
                            e.stopPropagation();
                            handleConnect(p.owner._id);
                          }
                    }
                    onCardClick={() => {
                      setViewProject(p);
                      setShowViewModal(true);
                    }}
                  />
                );
              })}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* ── Extracted Modals ───────────────────────────────── */}
      <ProjectFormModal
        isOpen={showAddModal}
        isEditing={isEditing}
        isPosting={isPosting}
        newProject={newProject}
        setNewProject={setNewProject}
        onSubmit={handlePostProject}
        onClose={() => {
          setShowAddModal(false);
          setIsEditing(false);
          setCurrentProject(null);
        }}
      />

      <ProjectDetailsModal
        isOpen={showViewModal}
        viewProject={viewProject}
        onClose={() => setShowViewModal(false)}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDeleteProject}
        title="Close Project"
        description="Are you sure you want to close this project? This will permanently remove the listing."
        confirmLabel="Close Project"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProjectBoard;
