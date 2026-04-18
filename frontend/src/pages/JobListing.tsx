import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/ui/Pagination';
import { NoData } from '../components/ui/NoData';
import { ListingCard } from '../components/ui/ListingCard';

interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  deadline: string;
  status: string;
  createdAt: string;
  postedBy: {
    name?: string;
    email: string;
    _id: string;
  };
}

export const JobListing = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my-jobs'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 4;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const endpoint = activeTab === 'all' ? '/jobs' : '/jobs/my';
        const response = await api.get(endpoint);
        setJobs(response.data.jobs || []);
      } catch (error) {
        console.error('Failed to fetch jobs', error);
        toast('Failed to load job listings', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [activeTab, toast]);

  // Filtering Logic
  const filteredJobs = jobs.filter(job => {
    const searchLower = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.description.toLowerCase().includes(searchLower) ||
      job.requiredSkills.some((skill: string) => skill.toLowerCase().includes(searchLower)) ||
      (job.postedBy?.name || '').toLowerCase().includes(searchLower)
    );
  });

  // Pagination Logic
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Reset to page 1 when searching or changing tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  return (
    <div className="max-w-6xl mx-auto p-4 pt-0 sm:px-8 sm:pb-8 space-y-6 pb-24 lg:pb-8">
      {/* ── Header Area ────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-900 dark:to-[#1a1b1e] p-6 sm:p-10 rounded-[1.5rem] shadow-2xl shadow-primary-500/20 animate-fade-in">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 bg-primary-400/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-2">
                Job Board
              </h1>
              <p className="text-primary-100 text-sm sm:text-base font-medium max-w-md opacity-90 leading-relaxed">
                {user?.role === 'student' 
                  ? "Discover exclusive opportunities posted by MNNIT Alumni & Professors." 
                  : user?.role === 'alumni'
                  ? "Empower the community by sharing career opportunities with MNNIT students."
                  : "Connect your students with premium research and industry opportunities."}
              </p>
            </div>
          </div>
          {(user?.role === 'alumni' || user?.role === 'professor') && (
            <div className="flex items-center">
              <Button
                onClick={() => navigate('/jobs/create')}
                className="w-full sm:w-auto bg-white hover:bg-primary-50 text-primary-700 rounded-2xl h-11 sm:h-14 px-5 sm:px-8 font-bold sm:font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border-none"
              >
                <Plus size={window.innerWidth < 640 ? 18 : 22} className="mr-1" /> Post a Job
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Search Bar ────────────────────────────────────── */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder={isMobile ? "Search Jobs.." : "Search jobs by title, skills or poster name..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white dark:bg-[#202123] border-2 border-slate-100 dark:border-[#383942] focus:border-primary-500 transition-all outline-none font-medium shadow-sm"
        />
      </div>

      {/* ── Tabs for Poster ────────────────────────────────── */}
      {(user?.role === 'alumni' || user?.role === 'professor') && (
        <div className="bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl flex gap-1 w-fit border border-slate-200/50 dark:border-white/5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-[#2a2b32] text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            All Active Jobs
          </button>
          <button
            onClick={() => setActiveTab('my-jobs')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'my-jobs'
                ? 'bg-white dark:bg-[#2a2b32] text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            My Posted Jobs
          </button>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
            Available Opportunities
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 bg-slate-100 dark:bg-[#2a2b32] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg whitespace-nowrap">
              {filteredJobs.length} found
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center bg-white dark:bg-[#202123] rounded-3xl border border-slate-100 dark:border-[#383942]">
            <LoadingSpinner message="Scanning for active opportunities..." />
          </div>
        ) : filteredJobs.length === 0 ? (
          <NoData 
            type="search"
            title={activeTab === 'my-jobs' ? "No Jobs Posted" : "No Jobs Found"}
            description={activeTab === 'my-jobs' 
              ? "You haven't posted any opportunities yet. Start by posting a new job to help students!" 
              : (searchQuery ? `No opportunities match "${searchQuery}". Try a broader search.` : "There are currently no active job postings.")
            }
            action={
              activeTab !== 'my-jobs' && (user?.role === 'alumni' || user?.role === 'professor') && (
                <Button variant="outline" onClick={() => navigate('/jobs/create')} className="rounded-xl">
                  Post Your First Job
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentJobs.map((job) => {
                const isExpired = new Date(job.deadline) < new Date() || job.status === 'expired';
                return (
                  <ListingCard
                    key={job._id}
                    title={job.title}
                    description={job.description}
                    status={isExpired ? 'Expired' : job.status}
                    statusColor={
                      isExpired ? 'bg-red-50 text-red-600' :
                      job.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-amber-50 text-amber-600'
                    }
                    posterName={job.postedBy?.name || 'Alumni'}
                    posterAvatar={job.postedBy?.name?.charAt(0)}
                    date={new Date(job.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    skills={job.requiredSkills || []}
                    onCardClick={() => navigate(`/jobs/${job._id}`)}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={paginate}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default JobListing;
