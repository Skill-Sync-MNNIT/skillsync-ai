import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Send } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { NoData } from '../components/ui/NoData';
import { JobDetailSkeleton } from '../components/skeletons/JobDetailSkeleton';
import { SkillBadge } from '../components/ui/SkillBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

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
  jobLink?: string;
  createdAt: string;
  hasApplied?: boolean;
}

export const JobDetail = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchJob = async () => {
    try {
      // Fire both requests simultaneously — saves ~300ms
      // /applications is non-critical: only posters see it, so .catch(() => null)
      const [jobRes, appsRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/jobs/${jobId}/applications`).catch(() => null),
      ]);

      setJob(jobRes.data);

      // Only use applications data if the current user is the poster
      if (appsRes && user?.email === jobRes.data.postedBy.email) {
        setApplications(appsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch job details', error);
      toast('Failed to load job details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) fetchJob();
  }, [jobId, user]);

  const handleApply = async () => {
    if (job?.jobLink) {
      window.open(job.jobLink, '_blank', 'noopener,noreferrer');
      return;
    }

    setIsApplying(true);
    try {
      const response = await api.post(`/jobs/${jobId}/apply`);
      toast(response.data.message || 'Application submitted successfully!', 'success');
      setJob(prev => prev ? { ...prev, hasApplied: true } : null);
    } catch (error: any) {
      toast(error.response?.data?.message || 'Failed to apply for this job', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      const response = await api.delete(`/jobs/${jobId}`);
      toast(response.data.message || 'Job closed successfully', 'success');
      fetchJob(); // Refresh to show new status
    } catch (error: any) {
      toast(error.response?.data?.message || 'Failed to close application', 'error');
    } finally {
      setIsWithdrawing(false);
      setShowConfirm(false);
    }
  };

  const updateApplicationStatus = async (appId: string, status: string) => {
    setProcessingId(appId);
    try {
      const response = await api.patch(`/jobs/applications/${appId}/status`, { status });
      toast(response.data.message || `Application marked as ${status}`, 'success');
      fetchJob(); // Refresh list
    } catch (error) {
      toast('Failed to update status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) return <JobDetailSkeleton />;

  if (!job) {
    return (
      <NoData
        title="Job Opportunity Not Found"
        description="This job may have been removed, moderated, or has already closed."
        action={
          <Button onClick={() => navigate(-1)} variant="outline" className="group hover:border-primary-500 hover:text-primary-600 transition-all duration-300">
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
        }
      />
    );
  }

  const isPoster = user?.email === job.postedBy.email;
  const isExpired = new Date(job.deadline) < new Date();
  const isClosed = job.status === 'withdrawn' || job.status === 'expired' || job.status === 'rejected';

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
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${(job.status === 'active' && !isExpired) ? 'bg-green-100 text-green-700' :
                  (job.status === 'withdrawn' || job.status === 'expired' || isExpired) ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                  {(isExpired || job.status === 'expired') ? 'Expired' : job.status === 'withdrawn' ? 'Closed' : job.status.replace('_', ' ')}
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
                    <p className={`text-sm font-semibold ${isExpired || isClosed ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {new Date(job.deadline).toLocaleDateString()} {(isExpired || isClosed) && `(${isExpired ? 'Expired' : 'Closed'})`}
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
              {user?.role === 'student' && !isExpired && job.status === 'active' && (
                <Button
                  size="lg"
                  onClick={handleApply}
                  isLoading={isApplying}
                  disabled={job.hasApplied}
                  variant={job.hasApplied ? "outline" : "primary"}
                  className={`w-full shadow-sm ${job.hasApplied ? 'border-emerald-200 text-emerald-600 bg-emerald-50/50' : ''}`}
                >
                  <Send size={18} className="mr-2" />
                  {job.hasApplied ? 'Already Applied' : job.jobLink ? 'Apply on External Site' : 'Apply Now'}
                </Button>
              )}
              {isPoster && !isClosed && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/jobs/${jobId}/edit`)}
                  >
                    Edit Job
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setShowConfirm(true)}
                    isLoading={isWithdrawing}
                  >
                    Close Application
                  </Button>
                </>
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
                  <SkillBadge key={skill} label={skill} />
                ))}
              </div>
            </section>

            {isPoster && (
              <section className="pt-8 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Applicants ({applications.length})</h3>
                {applications.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500">No students have applied for this position yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app._id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                            {app.studentId.name?.[0] || app.studentId.email[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{app.studentId.name || app.studentId.email}</p>
                            <p className="text-xs text-slate-500 capitalize">{app.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const slug = app.studentId.email.split('@')[0];
                              window.open(`/profile/${slug}`, '_blank');
                            }}
                          >
                            View Profile
                          </Button>
                          {app.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateApplicationStatus(app._id, 'accepted')}
                                isLoading={processingId === app._id}
                                disabled={!!processingId}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => updateApplicationStatus(app._id, 'rejected')}
                                disabled={!!processingId}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleWithdraw}
        title="Close Application"
        description="Are you sure you want to close this application early? This action cannot be undone and no more students will be able to apply."
        confirmLabel="Close Job"
        variant="danger"
        isLoading={isWithdrawing}
      />
    </div>
  );
};

export default JobDetail;
