import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Send } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

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
    _id: string;
  };
  createdAt: string;
}

export const JobDetail = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${jobId}`);
        setJob(response.data);
      } catch (error) {
        console.error('Failed to fetch job details', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (jobId) fetchJob();
  }, [jobId]);

  const handleApply = async () => {
    // In a real application, this might open a modal or send a direct message.
    // For now we simulate an apply action.
    setIsApplying(true);
    setTimeout(() => {
      alert(`Application simulated for ${job?.title}. The poster will be notified.`);
      setIsApplying(false);
    }, 1000);
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-8 text-center text-slate-500 animate-pulse">Loading job...</div>;
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 bg-white rounded-xl border border-slate-200">
         <h3 className="text-xl font-medium text-slate-900 dark:text-white">Job not found</h3>
         <p className="mt-2 text-slate-500 mb-6">This job may have been removed or moderated.</p>
         <Button onClick={() => navigate('/jobs')} variant="outline">Back to Job Board</Button>
      </div>
    );
  }

  const isPoster = user?.email === job.postedBy.email;
  const isExpired = new Date(job.deadline) < new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/jobs')} 
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Jobs
      </button>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                 <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
                 <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                   {job.status.replace('_', ' ')}
                 </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                 <div className="flex items-center text-slate-600">
                    <User className="h-5 w-5 mr-3 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Posted by</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {job.postedBy.name || job.postedBy.email}
                      </p>
                    </div>
                 </div>
                 
                 <div className="flex items-center text-slate-600">
                    <Calendar className="h-5 w-5 mr-3 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Deadline</p>
                      <p className={`text-sm font-semibold ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {new Date(job.deadline).toLocaleDateString()} {isExpired && '(Expired)'}
                      </p>
                    </div>
                 </div>

                 <div className="flex items-center text-slate-600">
                    <Clock className="h-5 w-5 mr-3 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Posted On</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {new Date(job.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3 shrink-0">
               {user?.role === 'student' && (
                 <Button 
                   size="lg" 
                   onClick={handleApply} 
                   isLoading={isApplying} 
                   disabled={isExpired || job.status !== 'active'}
                   className="w-full shadow-sm"
                 >
                   <Send size={18} className="mr-2" />
                   Apply Now
                 </Button>
               )}
               {isPoster && (
                 <Button size="lg" variant="outline" className="w-full" disabled>
                   Edit Job
                 </Button>
               )}
            </div>
          </div>

          <hr className="my-8 border-slate-200" />

          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Description</h3>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-100 rounded-lg text-sm font-semibold shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobDetail;
