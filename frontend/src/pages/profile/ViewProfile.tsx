import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Download, Eye, Cpu, UserPlus, Mail, BookOpen, GitBranch, Calendar, Award, Code2, FileText, Star, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { ViewProfileSkeleton } from '../../components/skeletons/ViewProfileSkeleton';
import { SkillBadge } from '../../components/ui/SkillBadge';
import { useToast } from '../../context/ToastContext';
import { NoData } from '../../components/ui/NoData';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';


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

const getInitials = (name: string) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
};

const getYearLabel = (year: number) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const suffix = suffixes[year] || 'th';
  return `${year}${suffix} Year`;
};

const getCpiColor = (cpi: number) => {
  if (cpi >= 9) return 'text-emerald-600 dark:text-emerald-400';
  if (cpi >= 7.5) return 'text-blue-600 dark:text-blue-400';
  if (cpi >= 6) return 'text-amber-600 dark:text-amber-400';
  return 'text-slate-600 dark:text-slate-400';
};

export const ViewProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'none' | 'pending' | 'accepted'>('loading');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Both can now run in parallel — backend resolves email prefix for status too
        const [profileRes, statusRes] = await Promise.all([
          api.get(`/profile/${userId}`),
          api.get(`/connections/status/${userId}`).catch(() => ({ data: { status: 'none' } })),
        ]);

        if (profileRes.data && profileRes.data.success) {
          setProfile(profileRes.data.data);
        } else {
          setProfile(null);
        }
        setConnectionStatus(statusRes.data.status as 'none' | 'pending' | 'accepted');
      } catch (error) {
        console.error('Failed to fetch profile', error);
        toast('Failed to load student profile', 'error');
        setProfile(null);
        setConnectionStatus('none');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) fetchAll();
  }, [userId]);

  const handleResumeAction = async (action: 'view' | 'download') => {
    if (!profile) return;
    if (action === 'view') setIsViewing(true);
    else setIsDownloading(true);
    try {
      const response = await api.get(`/profile/resume/${userId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      if (action === 'view') {
        window.open(objectUrl, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = objectUrl;
        const formattedName = profile.email.split('@')[0];
        a.download = `resume-${formattedName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (error: any) {
      toast(`Failed to ${action} resume. It may not exist.`, 'error');
    } finally {
      if (action === 'view') setIsViewing(false);
      else setIsDownloading(false);
    }
  };

  const handleConnect = async () => {
    if (!profile) return;
    setIsConnecting(true);
    try {
      await api.post('/connections/request', { recipientId: profile.userId });
      toast('Connection request sent!', 'success');
      setConnectionStatus('pending');
    } catch (error: any) {
      const msg: string = error.response?.data?.message || '';
      // If already connected/pending, re-fetch real status silently instead of showing error
      if (msg.toLowerCase().includes('already')) {
        try {
          const statusRes = await api.get(`/connections/status/${profile.userId}`);
          setConnectionStatus(statusRes.data.status as 'none' | 'pending' | 'accepted');
        } catch {
          setConnectionStatus('pending');
        }
      } else {
        toast(msg || 'Failed to send connection request', 'error');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) return <ViewProfileSkeleton />;

  if (!profile) {
    return (
      <NoData
        title="Profile Not Found"
        description="The profile you are looking for doesn't exist or may have been restricted."
        action={
          <Button onClick={() => navigate(-1)} variant="outline" className="group hover:border-primary-500 hover:text-primary-600 transition-all duration-300">
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
        }
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">

      {/* ── AI Match Banner ── */}
      {profile.matchScore !== undefined && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-lg shadow-blue-500/20 animate-fade-in-up">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Cpu size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg">AI Match Score</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/25 text-sm font-bold">
                  <Star size={12} fill="currentColor" /> {profile.matchScore.toFixed(0)}%
                </span>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">"{profile.explanation}"</p>
              {profile.matchedSkills && profile.matchedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.matchedSkills.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Hero Header Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#202123] border border-slate-200 dark:border-[#383942] shadow-md animate-fade-in-up shadow-slate-200/50 dark:shadow-none">
        {/* Decorative gradient strip */}
        <div className="h-32 bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-600 relative">
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
        </div>

        <div className="px-5 sm:px-8 pb-8">
          {/* Avatar & Actions Container */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-12 mb-6 gap-6">
            <div className="relative inline-block mx-auto sm:mx-0">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white text-4xl sm:text-5xl font-black shadow-2xl ring-8 ring-white dark:ring-slate-900 overflow-hidden">
                {getInitials(profile.name)}
                <div className="absolute inset-0 bg-black/5" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 border-[6px] border-white dark:border-slate-900 shadow-xl" title="Active Student">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {!user || user._id !== profile.userId ? (
                <>
                  {connectionStatus === 'accepted' ? (
                    <span className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 h-12 rounded-2xl font-bold text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700">
                      <UserPlus size={16} /> Connected
                    </span>
                  ) : connectionStatus === 'pending' ? (
                    <span className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 h-12 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-[#2a2b32] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#565869]">
                      <UserPlus size={16} /> Request Sent
                    </span>
                  ) : connectionStatus === 'none' ? (
                    <Button
                      variant="primary"
                      onClick={handleConnect}
                      disabled={isConnecting}
                      isLoading={isConnecting}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 h-12 rounded-2xl font-bold shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <UserPlus size={18} /> Connect
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {/* Name & Basic Info */}
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {profile.name || 'Unknown Student'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail size={16} className="text-primary-500" />
                <span>{profile.email || 'Not Provided'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main content (Left) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Academic Background (Unified Section) ── */}
          <div className="bg-white dark:bg-[#202123] border border-slate-200 dark:border-[#383942] rounded-3xl p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <BookOpen size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Academic Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  label: 'Course & Program',
                  value: profile.course,
                  icon: <BookOpen />,
                  sub: 'MNNIT Allahabad'
                },
                {
                  label: 'Department & Branch',
                  value: profile.branch === 'NA' ? 'Not Assigned' : profile.branch,
                  icon: <GitBranch />,
                  sub: 'Faculty of Engineering'
                },
                {
                  label: 'Current Standing',
                  value: profile.year ? getYearLabel(profile.year) : 'N/A',
                  icon: <Calendar />,
                  sub: 'Academic Session 2023-24'
                },
                {
                  label: 'Academic Merit',
                  value: profile.cpi ? `${profile.cpi} / 10` : 'N/A',
                  icon: <Award />,
                  sub: profile.cpi >= 9 ? 'Dean\'s Honor List' : 'Satisfactory Standing',
                  highlight: profile.cpi ? getCpiColor(profile.cpi) : ''
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className="mt-1 w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#40414f] flex items-center justify-center text-slate-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors">
                    {React.cloneElement(item.icon as React.ReactElement<any>, { size: 24 })}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className={`text-lg font-black tracking-tight ${item.highlight || 'text-slate-800 dark:text-white'}`}>
                      {item.value}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Technical Skills ── */}
          <div className="bg-white dark:bg-[#202123] border border-slate-200 dark:border-[#383942] rounded-3xl p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <Code2 size={20} className="text-primary-600" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Expertise & Skills</h2>
            </div>

            {profile.skills?.length ? (
              <div className="flex flex-wrap gap-2.5">
                {profile.skills.map(skill => {
                  const isMatched = profile.matchedSkills?.includes(skill);
                  return (
                    <SkillBadge
                      key={skill}
                      label={skill}
                      variant={isMatched ? 'highlighted' : 'default'}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 border-2 border-dashed border-slate-100 dark:border-[#383942] rounded-2xl">
                <p className="text-slate-400 text-sm font-medium italic">No technical skills listed yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar (Right) ── */}
        <div className="space-y-6">
          {/* ── Resume Card ── */}
          <div className="bg-white dark:bg-[#202123] border border-slate-200 dark:border-[#383942] rounded-3xl pb-8 overflow-hidden shadow-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="h-24 bg-slate-50 dark:bg-[#40414f] flex items-center justify-center border-b border-slate-100 dark:border-[#383942]">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#202123] shadow-sm flex items-center justify-center text-slate-400">
                <FileText size={28} />
              </div>
            </div>
            <div className="px-6 pt-6 text-center">
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Resume </h3>
              <p className="text-sm text-slate-500 mb-6 px-4">Review full details of background, projects, and achievements.</p>

              <div className="space-y-3">
                <Button
                  onClick={() => handleResumeAction('view')}
                  disabled={isDownloading || isViewing}
                  isLoading={isViewing}
                  className="w-full justify-center gap-2 rounded-2xl h-12 font-bold shadow-lg shadow-primary-500/20"
                >
                  <Eye size={18} /> View
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleResumeAction('download')}
                  disabled={isViewing || isDownloading}
                  isLoading={isDownloading}
                  className="w-full justify-center gap-2 rounded-2xl h-12 font-bold border-2 hover:bg-slate-50 dark:hover:bg-[#2a2b32]"
                >
                  <Download size={18} /> Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ViewProfile;
