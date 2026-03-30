import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  UploadCloud, X, AlertTriangle, Edit2, Loader2, CheckCircle2,
  FileText, Trash2, Cpu, Save, XCircle, User, Shield, Mail,
} from 'lucide-react';
import { profileService } from '../services/profileService';
import type { StudentProfileData } from '../services/profileService';

// ─── Skeleton ───────────────────────────────────────────────
const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton-shimmer ${className}`} />
);

const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-5 pb-12">
    <div className="space-y-2">
      <SkeletonBlock className="h-7 w-48" />
      <SkeletonBlock className="h-4 w-72" />
    </div>
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="p-6 space-y-4">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
      </Card>
    ))}
  </div>
);

// ─── Inline feedback banner ─────────────────────────────────
const FeedbackBanner = ({ type, text }: { type: 'success' | 'error'; text: string }) => (
  <div
    className={`flex items-center gap-2 text-sm p-3 rounded-lg border animate-fade-in ${
      type === 'success'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-700 border-red-200'
    }`}
  >
    {type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
    <span>{text}</span>
  </div>
);

// ─── Section header ─────────────────────────────────────────
const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
  iconBg,
  iconColor,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
}) => (
  <div className="flex items-center gap-3">
    <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
      <Icon size={18} className={iconColor} />
    </div>
    <div>
      <CardTitle className="text-base">{title}</CardTitle>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── Read-only field ────────────────────────────────────────
const ReadField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
    <p className="text-sm font-medium text-slate-900 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
      {value}
    </p>
  </div>
);

// ─── Branch options (mirrors backend enum) ──────────────────
const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT'] as const;

// ─── Main Component ─────────────────────────────────────────
export const MyProfile = () => {
  const { user, logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Loading / feedback
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resume
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Danger zone
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Embedding poll
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;
    loadProfile(user._id);
    return () => stopPoll();
  }, [user]);

  // ─── API ─────────────────────────────────────────────────
  const loadProfile = async (userId: string) => {
    try {
      const data = await profileService.fetchProfile(userId);
      setProfileData(data);
      if (!isEditing) {
        setBranch(data.branch || '');
        setYear(data.year ? String(data.year) : '');
        setSkills(data.skills || []);
      }
      const inProgress = data.embeddingStatus === 'pending' || data.embeddingStatus === 'processing';
      inProgress ? startPoll(userId) : stopPoll();
    } catch {
      // profile may not exist yet
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const startPoll = (userId: string) => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const data = await profileService.fetchProfile(userId);
        setProfileData(data);
        if (data.embeddingStatus === 'indexed' || data.embeddingStatus === 'failed') stopPoll();
      } catch { /* silent */ }
    }, 4000);
  };

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const updated = await profileService.updateProfile({
        branch: branch.toUpperCase(),
        year: parseInt(year),
        skills,
      });
      setProfileData((prev) =>
        prev ? { ...prev, branch: updated.branch || branch, year: updated.year || parseInt(year), skills } : prev
      );
      setSaveMsg({ type: 'success', text: 'Profile saved successfully.' });
      setIsEditing(false);
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save.' });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSaveMsg(null);
    if (profileData) {
      setBranch(profileData.branch || '');
      setYear(profileData.year ? String(profileData.year) : '');
      setSkills(profileData.skills || []);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type === 'application/pdf') { setSelectedFile(f); setUploadMsg(null); }
    else setUploadMsg({ type: 'error', text: 'Please select a valid PDF file.' });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') { setSelectedFile(f); setUploadMsg(null); }
    else setUploadMsg({ type: 'error', text: 'Please drop a valid PDF file.' });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadMsg(null);
    try {
      await profileService.uploadResume(selectedFile);
      setUploadMsg({ type: 'success', text: 'Resume uploaded! AI indexing started.' });
      setSelectedFile(null);
      if (user) loadProfile(user._id);
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: err.response?.data?.message || 'Upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const handleDeactivate = async () => {
    setIsDeleting(true);
    try {
      await profileService.deleteProfile();
      logout();
    } catch {
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  if (!user) return null;
  if (isLoadingProfile) return <ProfileSkeleton />;

  const userName = user.email.split('@')[0];
  const isStudent = user.role === 'student';

  // ─── Embedding status badge ──────────────────────────────
  const EmbeddingBadge = () => {
    const s = profileData?.embeddingStatus;
    if (s === 'indexed')
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 size={11} /> Indexed
        </span>
      );
    if (s === 'pending' || s === 'processing')
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-200">
          <Loader2 size={11} className="animate-spin" /> Processing
        </span>
      );
    if (s === 'failed')
      return (
        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-200">
          <AlertTriangle size={11} /> Failed
        </span>
      );
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 animate-fade-in-up">
        <div>
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">My Profile</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {userName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account details, skills, and resume.
          </p>
        </div>

        {/* Edit / Save controls — student only */}
        {isStudent && (
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} isLoading={isSaving}>
                  <Save size={14} className="mr-1.5" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} disabled={isSaving}>
                  <XCircle size={14} className="mr-1.5" /> Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 size={14} className="mr-1.5" /> Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Save feedback */}
      {saveMsg && <FeedbackBanner {...saveMsg} />}

      {/* ── Account Information ─────────────────────────────── */}
      <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '80ms' }}>
        <CardHeader className="border-b border-slate-100">
          <SectionHeader
            icon={User}
            title="Account Information"
            subtitle="Core identity — not editable"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadField label="Email Address" value={user.email} />
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Role</p>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
                <Shield size={14} className="text-violet-500 shrink-0" />
                <span className="text-sm font-medium text-slate-900 capitalize">{user.role}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Account Status</p>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
                <Mail size={14} className="text-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-slate-900">
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Profile Details (student only, editable) ─────────── */}
      {isStudent && (
        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '150ms' }}>
          <CardHeader className="border-b border-slate-100">
            <SectionHeader
              icon={User}
              title="Academic Details"
              subtitle="Visible to alumni and professors"
              iconBg="bg-primary-50"
              iconColor="text-primary-600"
            />
          </CardHeader>
          <CardContent className="pt-5">
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select branch</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <Input
                  id="year"
                  label="Year"
                  type="number"
                  min={1}
                  max={4}
                  placeholder="1 – 4"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadField
                  label="Branch"
                  value={profileData?.branch || '—'}
                />
                <ReadField
                  label="Year"
                  value={profileData?.year ? `Year ${profileData.year}` : '—'}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Skills (student only) ────────────────────────────── */}
      {isStudent && (
        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '220ms' }}>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <SectionHeader
                icon={Cpu}
                title="Skills"
                subtitle="Powers your AI-search ranking"
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
              />
              {skills.length > 0 && (
                <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                  {skills.length} skill{skills.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {skills.length === 0 && !isEditing && (
              <p className="text-sm text-slate-400 py-4 text-center italic">
                No skills listed. Click "Edit Profile" to add some.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                    isEditing
                      ? 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {skill}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="h-4 w-4 rounded-full flex items-center justify-center text-violet-400 hover:text-white hover:bg-violet-500 transition-all"
                    >
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditing && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Input
                  label="Add a skill"
                  placeholder="Type and press Enter (e.g. PyTorch)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={addSkill}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Resume (student only) ───────────────────────────── */}
      {isStudent && (
        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '290ms' }}>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <SectionHeader
                icon={FileText}
                title="Resume"
                subtitle="Upload a PDF — AI will index it automatically"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
              />
              <EmbeddingBadge />
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">

            {/* Processing state */}
            {(profileData?.embeddingStatus === 'pending' || profileData?.embeddingStatus === 'processing') ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="h-14 w-14 rounded-full bg-primary-50 flex items-center justify-center mb-3 animate-pulse">
                  <Cpu size={26} className="text-primary-600 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <p className="text-sm font-semibold text-slate-900">AI is analyzing your resume</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Extracting technical skills, experience, and structure. This takes a moment.
                </p>
              </div>
            ) : (
              <>
                {/* Current resume status */}
                {profileData?.resumeStorageKey ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-800 font-medium">Resume active and indexed</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <FileText size={15} className="text-slate-400 shrink-0" />
                    <p className="text-sm text-slate-600">No resume uploaded yet</p>
                  </div>
                )}

                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-xl px-4 py-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-primary-400 bg-primary-50/50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud
                    className={`mx-auto h-7 w-7 mb-2 transition-colors ${isDragging ? 'text-primary-500' : 'text-slate-400'}`}
                  />
                  <p className="text-sm font-medium text-slate-700">
                    {isDragging ? 'Drop your PDF here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF only · Max 5 MB</p>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>

                {/* Selected file */}
                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg animate-fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={15} className="text-primary-500 shrink-0" />
                      <span className="text-sm font-medium text-slate-700 truncate">{selectedFile.name}</span>
                    </div>
                    <Button
                      size="sm"
                      isLoading={isUploading}
                      onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                      className="ml-3 shrink-0"
                    >
                      Upload
                    </Button>
                  </div>
                )}

                {uploadMsg && <FeedbackBanner {...uploadMsg} />}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Danger Zone ─────────────────────────────────────── */}
      <Card className="animate-fade-in-up border-red-100 overflow-hidden" style={{ animationDelay: '360ms' }}>
        <CardHeader className="border-b border-red-100">
          <SectionHeader
            icon={Trash2}
            title="Danger Zone"
            subtitle="This action hides your profile from all searches"
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
        </CardHeader>
        <CardContent className="pt-5">
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 size={14} className="mr-2" />
              Deactivate Account
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-200 animate-fade-in">
              <p className="text-sm font-medium text-red-800">
                Are you sure? Your profile will be hidden from the network immediately.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeactivate}
                  isLoading={isDeleting}
                  className="flex-1"
                >
                  Yes, Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default MyProfile;
