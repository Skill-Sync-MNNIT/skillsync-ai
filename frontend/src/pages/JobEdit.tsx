import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { X, ShieldAlert, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description is too short'),
  deadline: z.string().min(1, 'Deadline is required'),
  jobLink: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

type JobForm = z.infer<typeof jobSchema>;

export const JobEdit = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [skillError, setSkillError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${jobId}`);
        const job = response.data;
        
        // Populate form
        setValue('title', job.title);
        setValue('description', job.description);
        setValue('jobLink', job.jobLink || '');
        
        // Format date for input[type="date"]
        const date = new Date(job.deadline);
        setValue('deadline', date.toISOString().split('T')[0]);
        
        setSkills(job.requiredSkills || []);

        // Edit Lock: Prevent editing if job is already withdrawn or expired
        if (job.status === 'withdrawn' || job.status === 'expired') {
          toast('This job is closed and can no longer be edited', 'error');
          navigate(`/jobs/${jobId}`);
        }
      } catch (error) {
        console.error('Failed to fetch job', error);
        toast('Failed to load job details', 'error');
        navigate('/jobs');
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) fetchJob();
  }, [jobId, setValue, navigate, toast]);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = newSkill.trim();
      if (val) {
        if (!skills.includes(val)) {
          setSkills([...skills, val]);
          setSkillError('');
        }
        setNewSkill('');
      }
    }
  };

  const onSubmit = async (data: JobForm) => {
    if (skills.length === 0) {
      setSkillError('Please add at least one required skill');
      return;
    }

    setIsSubmitting(true);
    setApiError('');
    try {
      await api.patch(`/jobs/${jobId}`, {
        ...data,
        requiredSkills: skills,
      });
      toast('Job updated successfully!', 'success');
      navigate(`/jobs/${jobId}`);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Failed to update job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Fetching job details for editing..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(`/jobs/${jobId}`)} 
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Details
      </button>

      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Job</h1>
        <p className="mt-1 text-slate-500">Update your job opportunity. Significant changes will trigger re-moderation.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                id="title"
                label="Job Title"
                placeholder="e.g. SDE Intern"
                error={errors.title?.message}
                {...register('title')}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Job Description
                </label>
                <textarea
                  id="description"
                  rows={5}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe the opportunity, responsibilities, and team..."
                  {...register('description')}
                />
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Required Skills
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-slate-100 text-slate-800">
                      {skill}
                      <button type="button" onClick={() => setSkills(skills.filter(s => s !== skill))} className="ml-1.5 text-slate-400 hover:text-slate-600">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  id="skills"
                  placeholder="Type a skill and press Enter"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleAddSkill}
                  error={skillError}
                  onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }}
                />
              </div>

              <Input
                id="deadline"
                type="date"
                label="Application Deadline"
                error={errors.deadline?.message}
                {...register('deadline')}
              />

              <div className="pt-2">
                <Input
                  id="jobLink"
                  label="External Job Link (Optional)"
                  placeholder="https://company.com/careers/jobs/123"
                  error={errors.jobLink?.message}
                  {...register('jobLink')}
                />
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-4 border border-blue-200 flex mt-6">
               <ShieldAlert className="h-5 w-5 text-blue-400 mt-0.5" />
               <div className="ml-3 text-sm text-blue-700">
                  Updating the title or description will re-submit this job for AI moderation.
               </div>
            </div>

            {apiError && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <h3 className="text-sm font-medium text-red-800">{apiError}</h3>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => navigate(`/jobs/${jobId}`)} className="mr-3">
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobEdit;
