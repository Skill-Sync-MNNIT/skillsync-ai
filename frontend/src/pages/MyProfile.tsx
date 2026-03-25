import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  UploadCloud, X, AlertTriangle, Edit2, Loader2, CheckCircle2,
  FileText, Trash2, Mail, GraduationCap, Calendar, Cpu,
  Shield, Sparkles, User, Save, XCircle, ArrowUpRight
} from 'lucide-react';
import { profileService } from '../services/profileService';
import type { StudentProfileData } from '../services/profileService';

// ─── Skeleton loader (same pattern as Dashboard) ────────────
const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton-shimmer ${className}`} />
);

const ProfileSkeleton = () => (
  <div className="space-y-8 max-w-5xl mx-auto">
    <div className="space-y-2">
      <SkeletonBlock className="h-8 w-56" />
      <SkeletonBlock className="h-4 w-80" />
    </div>
    {/* Stat row */}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-6 space-y-3">
          <div className="flex justify-between">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-9 w-9 rounded-lg" />
          </div>
          <SkeletonBlock className="h-6 w-20" />
          <SkeletonBlock className="h-3 w-32" />
        </Card>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6 space-y-4">
          <SkeletonBlock className="h-5 w-40" />
          {[...Array(4)].map((_, i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </Card>
      </div>
      <Card className="p-6 space-y-4">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-32 w-full rounded-lg" />
        <SkeletonBlock className="h-10 w-full" />
      </Card>
    </div>
  </div>
);

// ─── Color map (same as Dashboard) ──────────────────────────
const COLOR_MAP: Record<string, { iconBg: string; text: string; border: string }> = {
  blue:    { iconBg: 'bg-blue-100',    text: 'text-blue-600',    border: 'border-blue-100' },
  amber:   { iconBg: 'bg-amber-100',   text: 'text-amber-600',   border: 'border-amber-100' },
  emerald: { iconBg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-100' },
  violet:  { iconBg: 'bg-violet-100',  text: 'text-violet-600',  border: 'border-violet-100' },
  rose:    { iconBg: 'bg-rose-100',    text: 'text-rose-600',    border: 'border-rose-100' },
};

// ─── Stat overview card ─────────────────────────────────────
interface MiniStatProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  delay: number;
}

const MiniStat = ({ label, value, icon: Icon, color, delay }: MiniStatProps) => {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${c.border} animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
        <div className={`h-9 w-9 rounded-lg ${c.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={18} className={c.text} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
};

// ─── Main Component ─────────────────────────────────────────
export const MyProfile = () => {
  const { user, logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);

  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');

  // Loading & Feedback States
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Polling
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user._id);
    return () => stopPolling();
  }, [user]);

  // ─── API Logic (unchanged) ──────────────────────────────
  const fetchProfile = async (userId: string) => {
    try {
      const data = await profileService.fetchProfile(userId);
      setProfileData(data);
      if (!isEditing) {
        setBranch(data.branch || '');
        setYear(data.year ? data.year.toString() : '');
        setSkills(data.skills || []);
      }
      if (data.embeddingStatus === 'pending' || data.embeddingStatus === 'processing') {
        startPolling(userId);
      } else {
        stopPolling();
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const startPolling = (userId: string) => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await profileService.fetchProfile(userId);
        setProfileData(data);
        if (data.embeddingStatus === 'indexed' || data.embeddingStatus === 'failed') stopPolling();
      } catch { /* silent */ }
    }, 4000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
  };

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    setDetailsMessage(null);
    try {
      const updated = await profileService.updateProfile({ branch: branch.toUpperCase(), year: parseInt(year), skills });
      setProfileData((prev) => prev ? { ...prev, branch: updated.branch || branch, year: updated.year || parseInt(year), skills } : prev);
      setDetailsMessage({ type: 'success', text: 'Profile details saved successfully.' });
      setIsEditing(false);
    } catch (err: any) {
      setDetailsMessage({ type: 'error', text: err.response?.data?.error || err.response?.data?.message || 'Failed to save details.' });
    } finally {
      setIsSavingDetails(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDetailsMessage(null);
    if (profileData) {
      setBranch(profileData.branch || '');
      setYear(profileData.year ? profileData.year.toString() : '');
      setSkills(profileData.skills || []);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') { setSelectedFile(file); setUploadMessage(null); }
      else { setUploadMessage({ type: 'error', text: 'Please select a valid PDF file.' }); }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') { setSelectedFile(file); setUploadMessage(null); }
    else { setUploadMessage({ type: 'error', text: 'Please drop a valid PDF file.' }); }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadMessage(null);
    try {
      await profileService.uploadResume(selectedFile);
      setUploadMessage({ type: 'success', text: 'Resume uploaded! AI extraction started.' });
      setSelectedFile(null);
      if (user) fetchProfile(user._id);
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: err.response?.data?.error || err.response?.data?.message || 'Failed to upload resume.' });
    } finally {
      setIsUploading(false);
    }
  };

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim() !== '') {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter((sk) => sk !== s));

  const handleSoftDelete = async () => {
    setIsDeleting(true);
    try {
      await profileService.deleteProfile();
      logout();
    } catch {
      alert('Failed to delete account.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return null;
  if (isLoadingProfile) return <ProfileSkeleton />;

  const userName = user.email.split('@')[0];

  // Profile quick-stats
  const profileStats: MiniStatProps[] = [
    { label: 'Email', value: userName, icon: Mail, color: 'blue', delay: 0 },
    { label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1), icon: Shield, color: 'violet', delay: 80 },
    ...(user.role === 'student' ? [
      { label: 'Branch', value: profileData?.branch || '—', icon: GraduationCap, color: 'emerald', delay: 160 },
      { label: 'Year', value: profileData?.year?.toString() || '—', icon: Calendar, color: 'amber', delay: 240 },
    ] : []),
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">

      {/* ── Hero Header (Dashboard-style) ──────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-fade-in-up">
        <div>
          <p className="text-sm font-medium text-primary-600 mb-1 flex items-center gap-1.5">
            <User size={14} /> Profile Settings
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Hi, <span className="text-primary-600">{userName}</span>
          </h1>
          <p className="mt-2 text-slate-500 max-w-lg">
            Manage your account details, skills pipeline, and resume for AI-powered matching.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {user.role === 'student' && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 size={16} className="mr-2" /> Edit Profile
            </Button>
          )}
          {isEditing && (
            <>
              <Button onClick={handleSaveDetails} isLoading={isSavingDetails}>
                <Save size={16} className="mr-2" /> Save Changes
              </Button>
              <Button variant="outline" onClick={cancelEdit} disabled={isSavingDetails}>
                <XCircle size={16} className="mr-2" /> Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Feedback toast */}
      {detailsMessage && (
        <div className={`animate-fade-in-up text-sm p-4 rounded-xl border flex items-center gap-2 ${detailsMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {detailsMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {detailsMessage.text}
        </div>
      )}

      {/* ── Quick Stats Row (Dashboard pattern) ────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {profileStats.map((stat) => (
          <MiniStat key={stat.label} {...stat} />
        ))}
      </div>

      {/* ── Main Content Grid ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Account Details Card */}
          <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '300ms' }}>
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User size={18} className="text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Account Information</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Your core identity on SkillSync</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Email — always static */}
                <div className="group">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</p>
                  <p className="text-sm text-slate-900 font-medium bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100 transition-colors group-hover:border-slate-200">{user.email}</p>
                </div>
                {/* Role — always static */}
                <div className="group">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Role</p>
                  <p className="text-sm text-slate-900 font-medium bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100 capitalize transition-colors group-hover:border-slate-200">{user.role}</p>
                </div>

                {/* Branch & Year — editable for students */}
                {user.role === 'student' && (
                  <>
                    {isEditing ? (
                      <>
                        <div>
                          <Input id="branch" label="Branch" placeholder="e.g. CSE" value={branch} onChange={(e) => setBranch(e.target.value)} />
                        </div>
                        <div>
                          <Input id="year" label="Year" type="number" min="1" max="5" placeholder="e.g. 3" value={year} onChange={(e) => setYear(e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="group">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Branch</p>
                          <p className="text-sm text-slate-900 font-medium bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100 transition-colors group-hover:border-slate-200">
                            {profileData?.branch || <span className="text-slate-400 italic">Not specified</span>}
                          </p>
                        </div>
                        <div className="group">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Year</p>
                          <p className="text-sm text-slate-900 font-medium bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100 transition-colors group-hover:border-slate-200">
                            {profileData?.year || <span className="text-slate-400 italic">Not specified</span>}
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skills Card */}
          {user.role === 'student' && (
            <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '400ms' }}>
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Cpu size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Skills Pipeline</CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">Boosts your semantic search ranking</p>
                    </div>
                  </div>
                  {skills.length > 0 && (
                    <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                      {skills.length} skill{skills.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Skill chips */}
                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 && !isEditing && (
                    <div className="w-full text-center py-8">
                      <Sparkles className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                      <p className="text-sm text-slate-400">No skills listed yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Click "Edit Profile" or upload a resume to get started.</p>
                    </div>
                  )}
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        isEditing
                          ? 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
                          : 'bg-slate-100 text-slate-700 border border-transparent hover:bg-slate-200'
                      }`}
                    >
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center text-violet-400 hover:text-white hover:bg-violet-500 transition-all duration-200"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {isEditing && (
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <Input
                      label="Add a skill"
                      placeholder="Type a skill and press Enter (e.g., PyTorch)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={addSkill}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Resume Brain Card */}
          {user.role === 'student' && (
            <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '350ms' }}>
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <FileText size={18} className="text-emerald-600" />
                    </div>
                    <CardTitle className="text-base">Resume Brain</CardTitle>
                  </div>
                  {/* Status badge */}
                  {profileData?.embeddingStatus === 'indexed' && (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle2 size={12} /> Indexed
                    </span>
                  )}
                  {(profileData?.embeddingStatus === 'pending' || profileData?.embeddingStatus === 'processing') && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                      <Loader2 size={12} className="animate-spin" /> Processing
                    </span>
                  )}
                  {profileData?.embeddingStatus === 'failed' && (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-200">
                      <AlertTriangle size={12} /> Failed
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Processing state */}
                {(profileData?.embeddingStatus === 'pending' || profileData?.embeddingStatus === 'processing') ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Cpu size={28} className="text-primary-600 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">AI is analyzing your resume</h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-[200px] mx-auto">Extracting structure, LaTeX paths, and technical depth.</p>
                  </div>
                ) : (
                  <>
                    {/* Active resume indicator */}
                    {profileData?.resumeStorageKey ? (
                      <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                        <CheckCircle2 className="mx-auto h-7 w-7 text-green-500 mb-2" />
                        <h4 className="text-sm font-semibold text-green-900">Resume is active</h4>
                        <p className="text-xs text-green-700 mt-1 flex items-center justify-center gap-1">
                          <ArrowUpRight size={12} /> Optimized for Semantic AI Search
                        </p>
                      </div>
                    ) : (
                      <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <FileText className="mx-auto h-7 w-7 text-slate-300 mb-2" />
                        <h4 className="text-sm font-semibold text-slate-700">No Resume Found</h4>
                        <p className="text-xs text-slate-500 mt-1">Upload a PDF to enable Semantic Matches.</p>
                      </div>
                    )}

                    {/* Upload zone with drag-and-drop */}
                    <div
                      className={`border-2 border-dashed rounded-xl px-4 py-8 text-center transition-all duration-200 cursor-pointer ${
                        isDragging
                          ? 'border-primary-400 bg-primary-50/50'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud className={`mx-auto h-8 w-8 mb-3 transition-colors ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />
                      <p className="text-sm font-medium text-slate-700">
                        {isDragging ? 'Drop your PDF here' : 'Drag & drop or click to upload'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PDF only · LaTeX supported · Max 5MB</p>
                      <input type="file" className="sr-only" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} />
                    </div>

                    {/* Selected file bar */}
                    {selectedFile && (
                      <div className="mt-4 flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm animate-fade-in-up">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={16} className="text-primary-500 shrink-0" />
                          <span className="text-sm font-medium text-slate-700 truncate">{selectedFile.name}</span>
                        </div>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleUpload(); }} isLoading={isUploading} className="shrink-0 ml-3">
                          Upload
                        </Button>
                      </div>
                    )}

                    {/* Upload feedback */}
                    {uploadMessage && (
                      <div className={`mt-3 text-sm p-3 rounded-lg border flex items-center gap-2 animate-fade-in-up ${
                        uploadMessage.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'
                      }`}>
                        {uploadMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {uploadMessage.text}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className="animate-fade-in-up border-red-100 overflow-hidden" style={{ animationDelay: '500ms' }}>
            <CardHeader className="border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-base text-red-800">Danger Zone</CardTitle>
                  <p className="text-xs text-red-400 mt-0.5">Irreversible actions</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Deactivate your account to temporarily hide your profile from search results and recruiters.
              </p>
              {!showDeleteConfirm ? (
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)} className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
                  <Trash2 size={14} className="mr-2" /> Deactivate Profile
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-200 animate-fade-in-up">
                  <p className="text-sm font-medium text-red-800">Are you sure? This will hide your profile.</p>
                  <div className="flex gap-2">
                    <Button variant="danger" size="sm" onClick={handleSoftDelete} isLoading={isDeleting} className="flex-1">
                      Yes, Deactivate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
