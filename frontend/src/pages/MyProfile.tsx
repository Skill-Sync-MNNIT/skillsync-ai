import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  UploadCloud, X, AlertTriangle, Edit2, Loader2, CheckCircle2,
  FileText, Trash2, Cpu, Save, XCircle, User, Shield,
  AtSign,
} from 'lucide-react';
import { profileService } from '../services/profileService';
import type { StudentProfileData } from '../services/profileService';

// ─── Skeleton ───────────────────────────────────────────────
const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton-shimmer ${className}`} />
);

const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-5 pb-12">
    <div className="flex items-end justify-between">
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-4 w-56" />
      </div>
      <SkeletonBlock className="h-9 w-28 rounded-lg" />
    </div>
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="p-6 space-y-4">
        <SkeletonBlock className="h-5 w-36" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      </Card>
    ))}
  </div>
);

// ─── Inline feedback banner ─────────────────────────────────
const FeedbackBanner = ({ type, text }: { type: 'success' | 'error'; text: string }) => (
  <div
    className={`flex items-center gap-2 text-sm p-3 rounded-lg border animate-fade-in ${type === 'success'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-700 border-red-200'
      }`}
  >
    {type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
    <span>{text}</span>
  </div>
);

// ─── Read-only display field ────────────────────────────────
const ReadField = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) => (
  <div>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
      {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
      <span className="text-sm font-medium text-slate-700">{value || '—'}</span>
    </div>
  </div>
);

// ─── Section card header ────────────────────────────────────
const SectionHeader = ({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
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

// ─── Constants ──────────────────────────────────────────────
const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'NA'] as const;
const COURSES = ['B.Tech', 'M.Tech', 'MCA'] as const;


// ─── Main Component ─────────────────────────────────────────
export const MyProfile = () => {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data from backend
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);

  // Edit state — universal across ALL roles
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [course, setCourse] = useState('B.Tech');
  const [branch, setBranch] = useState('CSE');
  const [year, setYear] = useState('');
  const [cpi, setCpi] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // ─── Sync edit fields from loaded data ──────────────────
  const syncEditFields = (data: StudentProfileData) => {
    // Falls back to existing name -> auth name -> email prefix
    setName(data.name || user?.name || user?.email.split('@')[0] || '');
    setCourse(data.course || 'B.Tech');
    setBranch(data.branch || 'CSE');
    setYear(data.year ? String(data.year) : '');
    setCpi(data.cpi ? String(data.cpi) : '');
    setSkills(data.skills || []);
  };

  // ─── API Calls ──────────────────────────────────────────
  const loadProfile = async (userId: string) => {
    try {
      const data = await profileService.fetchProfile(userId);
      setProfileData(data);
      syncEditFields(data);
      const inProgress = !!(data.resumeStorageKey && (data.embeddingStatus === 'pending' || data.embeddingStatus === 'processing'));
      inProgress ? startPoll(userId) : stopPoll();
    } catch {
      // Profile document may not exist yet for new users
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

  // ─── Validation Schemas ──────────────────────────────────
  const baseSchema = z.object({
    name: z.string().trim().min(1, 'Name is required.').max(80, 'Name must be 80 characters or fewer.'),
  });

  const studentSchema = baseSchema.extend({
    course: z.string().min(1, 'Course is required.'),
    branch: z.enum([...BRANCHES] as [string, ...string[]], { message: 'Branch is required.' }),
    year: z.string().min(1, 'Year is required.').refine(val => {
      const y = parseInt(val, 10);
      return !isNaN(y) && y >= 1 && y <= 4;
    }, 'Year must be between 1 and 4.'),
    cpi: z.string().min(1, 'CPI is required.').refine(val => {
      const c = parseFloat(val);
      return !isNaN(c) && c >= 0 && c <= 10;
    }, 'CPI must be between 0 and 10.0.'),
    skills: z.array(z.string()).min(1, 'At least one skill is required.'),
    hasResume: z.boolean().refine(val => val === true, 'Resume upload is required before saving.'),
  });

  // ─── Save handler ────────────────────────────────────────
  const handleSave = async () => {
    setErrors({});
    
    // Validate
    const schema = isStudent ? studentSchema : baseSchema;
    const dataToValidate = isStudent ? {
      name, course, branch, year, cpi, skills,
      hasResume: !!profileData?.resumeStorageKey
    } : { name };

    const result = schema.safeParse(dataToValidate);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          formattedErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(formattedErrors);
      setSaveMsg({ type: 'error', text: 'Please complete all required fields before saving.' });
      return;
    }

    setIsSaving(true);
    setSaveMsg(null);

    // Build payload — only send fields that changed / are relevant to role
    const payload: Parameters<typeof profileService.updateProfile>[0] = {
      name: name.trim(),
    };

    if (isStudent) {
      if (course) payload.course = course;
      if (branch) payload.branch = branch.toUpperCase() as any;
      if (year) payload.year = parseInt(year, 10);
      if (cpi) payload.cpi = parseFloat(cpi);
      payload.skills = skills;
    }

    try {
      const updated = await profileService.updateProfile(payload);

      // Merge returned data back into local state
      setProfileData((prev) => prev ? { ...prev, ...updated } : updated);

      // Patch the Zustand store so the name appears in the nav/dashboard
      updateUser({ name: name.trim() });

      setSaveMsg({ type: 'success', text: 'Profile saved successfully.' });
      setIsEditing(false);
    } catch (err: any) {
      setSaveMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Cancel edit ────────────────────────────────────────
  const cancelEdit = () => {
    setIsEditing(false);
    setSaveMsg(null);
    setErrors({});
    if (profileData) syncEditFields(profileData);
  };

  // ─── Resume handlers ─────────────────────────────────────
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

  // ─── Skill handlers ──────────────────────────────────────
  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  // ─── Deactivate ──────────────────────────────────────────
  const handleDeactivate = async () => {
    setIsDeleting(true);
    try {
      await profileService.deleteProfile();
      useAuthStore.getState().logout();
    } catch {
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  // ─── Guards ──────────────────────────────────────────────
  if (!user) return null;
  if (isLoadingProfile) return <ProfileSkeleton />;

  const isStudent = user.role === 'student';

  // Display name: backend profile name > auth store name > email prefix
  const displayName =
    profileData?.name || user.name || user.email.split('@')[0];

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
    <div className="max-w-2xl mx-auto space-y-5 pt-0 pb-12 px-4 sm:px-0">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 animate-fade-in-up border-b border-slate-100 pb-5 mb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <User size={20} className="text-blue-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-blue-700 uppercase">
            My Profile
          </h1>
        </div>

        {/* ── Universal edit/save controls ─────────────────── */}
        <div className="flex items-center gap-2 shrink-0 pt-1">
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
            <Button size="sm" variant="outline" onClick={() => { setIsEditing(true); setSaveMsg(null); }}>
              <Edit2 size={14} className="mr-1.5" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Save feedback */}
      {saveMsg && <FeedbackBanner {...saveMsg} />}

      {/* ── Account Information (Name is editable) ───────────── */}
      <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '60ms' }}>
        <CardHeader className="border-b border-slate-100">
          <SectionHeader
            icon={Shield}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            title="Account Information"
            subtitle={isEditing ? 'Update your name and account details' : 'Verified account identity and status'}
          />
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name is editable here for ALL roles */}
            {isEditing ? (
              <div className="col-span-1">
                <Input
                  id="profile-name"
                  label="Full Name"
                  placeholder="e.g. Aditya Sharma"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  error={errors.name}
                  autoFocus
                />
              </div>
            ) : (
              <ReadField
                label="Full Name"
                value={displayName}
                icon={User}
              />
            )}

            <ReadField
              label="Email Address"
              value={user.email}
              icon={AtSign}
            />
            <ReadField
              label="Role"
              value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              icon={Shield}
            />
            <ReadField
              label="Account Status"
              value={user.isVerified ? '✓ Verified' : 'Not verified'}
              icon={CheckCircle2}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Profile Details (Students only) ───────────────────────── */}
      {isStudent && (
        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '120ms' }}>
          <CardHeader className="border-b border-slate-100">
            <SectionHeader
              icon={FileText}
              iconBg="bg-primary-50"
              iconColor="text-primary-600"
              title="Academic Details"
              subtitle={isEditing ? 'Editing — changes save when you click Save' : 'Branch, Year and academic information'}
            />
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* Academic fields — reordered: Course, Year, Branch, CPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Course
                    </label>
                    <select
                      value={course}
                      onChange={(e) => {
                        setCourse(e.target.value);
                        if (errors.course) setErrors(prev => ({ ...prev, course: '' }));
                      }}
                      className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all font-medium text-slate-700 ${
                        errors.course ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'
                      }`}
                    >
                      {COURSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.course && <p className="mt-1.5 text-sm font-medium text-red-500">{errors.course}</p>}
                  </div>
                  <Input
                    id="profile-year"
                    label="Year"
                    type="number"
                    min={1}
                    max={4}
                    placeholder="1 – 4"
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      if (errors.year) setErrors(prev => ({ ...prev, year: '' }));
                    }}
                    error={errors.year}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Branch
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => {
                        setBranch(e.target.value);
                        if (errors.branch) setErrors(prev => ({ ...prev, branch: '' }));
                      }}
                      className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all font-medium text-slate-700 ${
                        errors.branch ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'
                      }`}
                    >
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {errors.branch && <p className="mt-1.5 text-sm font-medium text-red-500">{errors.branch}</p>}
                  </div>
                  <Input
                    id="profile-cpi"
                    label="CPI (0 - 10.0)"
                    type="number"
                    step="0.01"
                    min={0}
                    max={10}
                    placeholder="e.g. 8.5"
                    value={cpi}
                    onChange={(e) => {
                      setCpi(e.target.value);
                      if (errors.cpi) setErrors(prev => ({ ...prev, cpi: '' }));
                    }}
                    error={errors.cpi}
                  />
                </>
              ) : (
                <>
                  <ReadField label="Course" value={profileData?.course || '—'} />
                  <ReadField
                    label="Year"
                    value={profileData?.year ? String(profileData.year) : '—'}
                  />
                  <ReadField label="Branch" value={profileData?.branch || 'NA'} />
                  <ReadField label="CPI" value={profileData?.cpi ? String(profileData.cpi) : '—'} />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Skills (students only) ────────────────────────────── */}
      {isStudent && (
        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '180ms' }}>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <SectionHeader
                icon={Cpu}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                title="Skills"
                subtitle="Powers your AI-search ranking"
              />
              {skills.length > 0 && (
                <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                  {skills.length} skill{skills.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">

            {skills.length === 0 && !isEditing && (
              <p className="text-sm text-slate-400 text-center py-4 italic">
                No skills yet. Click "Edit Profile" to add some.
              </p>
            )}

            {isEditing && (
              <div className="pt-2">
                <Input
                  label="Add a skill"
                  placeholder="Type a skill and press Enter (e.g. PyTorch)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    addSkill(e);
                    if (e.key === 'Enter' && errors.skills) setErrors(prev => ({ ...prev, skills: '' }));
                  }}
                  error={errors.skills}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${isEditing
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
          </CardContent>
        </Card>
      )}

      {/* ── Resume (students only) ───────────────────────────── */}
      {isStudent && (
        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '240ms' }}>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <SectionHeader
                icon={FileText}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                title="Resume"
                subtitle="Upload a PDF — AI will index it automatically"
              />
              <EmbeddingBadge />
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">

            {(profileData?.resumeStorageKey && (profileData?.embeddingStatus === 'pending' || profileData?.embeddingStatus === 'processing')) ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="h-14 w-14 rounded-full bg-primary-50 flex items-center justify-center mb-3 animate-pulse">
                  <Cpu size={26} className="text-primary-600 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">AI is analyzing your resume</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Extracting skills, experience, and structure. This takes a moment.
                </p>
              </div>
            ) : (
              <>
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
                  className={`border-2 border-dashed rounded-xl px-4 py-8 text-center cursor-pointer transition-all duration-200 ${isDragging
                      ? 'border-primary-400 bg-primary-50/50'
                      : errors.hasResume 
                        ? 'border-red-400 bg-red-50 hover:bg-red-100 hover:border-red-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    handleDrop(e);
                    if (errors.hasResume) setErrors(prev => ({ ...prev, hasResume: '' }));
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud
                    className={`mx-auto h-7 w-7 mb-2 ${isDragging ? 'text-primary-500' : 'text-slate-400'}`}
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
                    onChange={(e) => {
                      handleFileChange(e);
                      if (errors.hasResume) setErrors(prev => ({ ...prev, hasResume: '' }));
                    }}
                  />
                </div>
                {errors.hasResume && <p className="text-sm font-medium text-red-500 mt-2">{errors.hasResume}</p>}

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
      <Card className="animate-fade-in-up border-red-100 overflow-hidden" style={{ animationDelay: '300ms' }}>
        <CardHeader className="border-b border-red-100">
          <SectionHeader
            icon={Trash2}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            title="Danger Zone"
            subtitle="Hides your profile from all searches immediately"
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
                Are you sure? Your profile will be hidden from the network.
              </p>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={handleDeactivate} isLoading={isDeleting} className="flex-1">
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
  );
};

export default MyProfile;
