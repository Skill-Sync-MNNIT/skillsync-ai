import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, Eye, Cpu } from 'lucide-react';
import api from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface StudentProfile {
  userId: string;
  name: string;
  email: string;
  course: string;
  branch: string;
  year: number;
  cpi: number;
  skills: string[];
  resumeStorageKey?: string;
  matchScore?: number;
  explanation?: string;
  matchedSkills?: string[];
}

export const ViewProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/profile/${userId}`);
        if (response.data && response.data.success) {
          setProfile(response.data.data);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

  const handleResumeAction = async (action: 'view' | 'download') => {
    if (!profile) return;
    
    if (action === 'view') setIsViewing(true);
    else setIsDownloading(true);
    
    try {
      const response = await api.get(`/profile/resume/${userId}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      
      if (action === 'view') {
        window.open(objectUrl, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = objectUrl;
        // Filename format: resume-[email-prefix].pdf (keeping dots as requested)
        const formattedName = profile.email.split('@')[0];
        a.download = `resume-${formattedName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      // Cleanup: increased timer to 60s to ensure the viewer has time to load
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      
    } catch (error) {
      alert(`Failed to ${action} resume. It may not exist.`);
    } finally {
      if (action === 'view') setIsViewing(false);
      else setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Fetching student profile..." />;
  }

  if (!profile) {
    return <div className="p-8 text-center text-slate-500">Profile not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Student Profile</h1>
        <p className="mt-1 text-slate-500">Detailed view of the candidate's academic and technical background.</p>
      </div>

      {profile.matchScore !== undefined && (
        <div className="rounded-md bg-blue-50 p-4 border border-blue-200 flex">
           <Cpu className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
           <div className="ml-3">
              <h3 className="text-sm font-bold text-blue-800">
                 AI Evaluation Insight ({profile.matchScore.toFixed(0)}% Match)
              </h3>
              <p className="mt-1 text-sm text-blue-700">"{profile.explanation}"</p>
           </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Identity */}
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Full Name</label>
              <div className="text-base text-slate-900 dark:text-white font-medium bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 rounded-md border border-slate-100 dark:border-slate-800">
                {profile.name || 'Not Provided'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Email Address</label>
              <div className="text-base text-slate-900 dark:text-white font-medium bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 rounded-md border border-slate-100 dark:border-slate-800">
                {profile.email || 'Not Provided'}
              </div>
            </div>
            
            {/* Academics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Course & Program</label>
                  <div className="text-base text-slate-900 dark:text-white font-medium bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 rounded-md border border-slate-100 dark:border-slate-800">
                    {profile.course || 'Not Provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Branch</label>
                  <div className="text-base text-slate-900 dark:text-white font-medium bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 rounded-md border border-slate-100 dark:border-slate-800">
                    {(profile.branch && profile.branch !== 'NA') ? profile.branch : 'Not Provided'}
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Current Year</label>
                  <div className="text-base text-slate-900 dark:text-white font-medium bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 rounded-md border border-slate-100 dark:border-slate-800">
                     {profile.year ? `${profile.year}${profile.year === 1 ? 'st' : profile.year === 2 ? 'nd' : profile.year === 3 ? 'rd' : 'th'} Year` : 'Not Provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Academic Performance</label>
                  <div className="text-base text-slate-900 dark:text-white font-medium bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 rounded-md border border-slate-100 dark:border-slate-800">
                    {profile.cpi || 'Not Provided'} {profile.cpi && <span className="text-slate-400">/ 10 CPI</span>}
                  </div>
                </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">Technical Skills</label>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.length ? (
                    profile.skills.map(skill => (
                       <span key={skill} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {skill}
                       </span>
                    ))
                ) : (
                    <div className="text-slate-400 text-sm italic py-2">Not Provided</div>
                )}
              </div>
            </div>

            {/* Actions: Stacks on mobile, side-by-side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleResumeAction('view')} 
                disabled={isDownloading || isViewing}
                isLoading={isViewing}
                className="w-full justify-center"
              >
                <Eye size={18} className="mr-2" /> View Resume
              </Button>
              <Button 
                type="button"
                onClick={() => handleResumeAction('download')} 
                disabled={isViewing || isDownloading}
                isLoading={isDownloading}
                className="w-full justify-center"
              >
                <Download size={18} className="mr-2" /> Download Resume
              </Button>
            </div>
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewProfile;
