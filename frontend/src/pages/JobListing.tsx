import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, PlusCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { NoData } from '../components/ui/NoData';

interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  deadline: string;
  status: string;
  postedBy: {
    name?: string;
    email: string;
  };
}

export const JobListing = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my-jobs'>('all');

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Job Board</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Discover exclusive opportunities posted by MNNIT Alumni & Professors.</p>
        </div>

        {(user?.role === 'alumni' || user?.role === 'professor') && (
          <Button onClick={() => navigate('/jobs/create')}>
            <PlusCircle size={18} className="mr-2" />
            Post a Job
          </Button>
        )}
      </div>

      {(user?.role === 'alumni' || user?.role === 'professor') && (
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${activeTab === 'all'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-700'
                }`}
            >
              All Active Jobs
            </button>
            <button
              onClick={() => setActiveTab('my-jobs')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${activeTab === 'my-jobs'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-700'
                }`}
            >
              My Posted Jobs
            </button>
          </nav>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner fullPage message="Finding the best opportunities for you..." />
      ) : jobs.length === 0 ? (
        <NoData
          title={activeTab === 'my-jobs' ? "No Jobs Posted" : "No Jobs Found"}
          description={activeTab === 'my-jobs' ? "You haven't posted any opportunities yet. Start by posting a new job!" : "There are currently no active job postings matching your filters."}
          action={
            activeTab === 'my-jobs' && (user?.role === 'alumni' || user?.role === 'professor') && (
              <Button onClick={() => navigate('/jobs/create')}>
                Post Your First Job
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job._id} className="hover:shadow-md transition-all duration-200 flex flex-col h-full cursor-pointer hover:-translate-y-0.5" onClick={() => navigate(`/jobs/${job._id}`)}>
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2">{job.title}</h3>
                    {activeTab === 'my-jobs' && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${job.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : job.status === 'pending_moderation' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {job.status === 'withdrawn' ? 'Closed' : job.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-4">{job.postedBy?.name || job.postedBy?.email?.split('@')[0] || 'Unknown'}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requiredSkills.slice(0, 4).map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-slate-100 dark:bg-[#2a2b32] text-slate-600 dark:text-slate-300 rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#2a2b32] text-slate-600 dark:text-slate-300 rounded text-xs font-medium">+{job.requiredSkills.length - 4} more</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#383942] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1.5" />
                    Due {new Date(job.deadline).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-primary-600 hover:text-primary-700">
                    <span className="mr-1">View Details</span>
                    <Clock size={14} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobListing;
