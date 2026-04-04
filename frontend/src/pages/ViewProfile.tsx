import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, User } from 'lucide-react';
import api from '../services/api';

interface StudentProfile {
  userId: string;
  name: string;
  email: string;
  branch: string;
  year: number;
  skills: string[];
  matchScore?: number;
  explanation?: string;
  matchedSkills?: string[];
}

export const ViewProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/profile/${userId}`);
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

  const handleDownloadResume = async () => {
    if (!profile) return;
    setIsDownloading(true);
    try {
      const response = await api.get(`/profile/resume/${userId}`);
      if (response.data.signedUrl) {
        // Automatically trigger download using a temporary link
        const a = document.createElement('a');
        a.href = response.data.signedUrl;
        a.target = '_blank';
        a.download = `resume-${profile.name || 'student'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      alert('Failed to download resume.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-slate-500">Profile not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{profile.email.split('@')[0]}</h1>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              {profile.branch} &bull; Year {profile.year}
            </p>
          </div>
        </div>
        <Button onClick={handleDownloadResume} isLoading={isDownloading} className="shrink-0">
          <Download size={18} className="mr-2" />
          Download Resume
        </Button>
      </div>

      {profile.matchScore !== undefined && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3 border-b border-green-200/50">
            <CardTitle className="text-green-800 flex items-center gap-2 text-lg">
               <span>AI Match Result</span>
               <span className="bg-green-200 text-green-900 text-sm px-2 py-0.5 rounded-full">{profile.matchScore.toFixed(0)}% Match</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-slate-700 italic border-l-4 border-green-300 pl-4 py-1">"{profile.explanation}"</p>
            {profile.matchedSkills && profile.matchedSkills.length > 0 && (
              <div className="mt-4">
                <span className="text-sm font-semibold text-green-800 mr-2">Key Highlights:</span>
                <span className="text-sm text-slate-600 font-medium">
                  {profile.matchedSkills.join(', ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Skills & Technologies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                {skill}
              </span>
            ))}
            {profile.skills.length === 0 && (
              <span className="text-slate-400 text-sm">No skills listed yet.</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewProfile;
