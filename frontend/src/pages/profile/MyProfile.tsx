import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  AlertTriangle, Edit2, Loader2, CheckCircle2,
  FileText, Trash2, Save, XCircle, User, Shield, Cpu, UploadCloud
} from 'lucide-react';
import { profileService } from '../../services/profileService';
import api from '../../services/api';
import type { StudentProfileData } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import { useProfilePolling } from '../../hooks/useProfilePolling';
import { ProfileSkeleton } from '../../components/skeletons/ProfileSkeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SkillBadge } from '../../components/ui/SkillBadge';

// ─── Read-only display field ────────────────────────────────
const ReadField = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="min-w-0">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
    <div className="flex items-center bg-slate-50 dark:bg-[#40414f] px-4 py-2.5 rounded-xl border border-slate-100 dark:border-[#383942] min-w-0">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate w-full block">{value || '—'}</span>
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
    <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Resume
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Danger zone
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Embedding poll — via extracted hook
  const { startPoll, stopPoll } = useProfilePolling(
    (data) => setProfileData(data)
  );

  useEffect(() => {
    if (!user) return;
    loadProfile(user._id);
    return () => stopPoll();
  }, [user]);

  // ─── Sync edit fields from loaded data ──────────────────
  const syncEditFields = (data: StudentProfileData) => {
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
      toast('Please complete all required fields before saving.', 'error');
      return;
    }

    setIsSaving(true);
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
      setProfileData((prev) => prev ? { ...prev, ...updated } : updated);
      updateUser({ name: name.trim() });
      toast('Profile saved successfully.', 'success');
      setIsEditing(false);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to save. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    if (profileData) syncEditFields(profileData);
  };

  // ─── Resume handlers ─────────────────────────────────────
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type === 'application/pdf') { setSelectedFile(f); }
    else toast('Please select a valid PDF file.', 'error');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') { setSelectedFile(f); }
    else toast('Please drop a valid PDF file.', 'error');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const updatedData = await profileService.uploadResume(selectedFile);
      toast('Resume uploaded! AI indexing started.', 'success');
      setSelectedFile(null);
      setProfileData(updatedData);
      if (user && (updatedData.embeddingStatus === 'pending' || updatedData.embeddingStatus === 'processing')) {
        startPoll(user._id);
      }
    } catch (err: any) {
      toast(err.response?.data?.message || 'Upload failed.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Skill handlers ──────────────────────────────────────
  const processSkills = (inputStr: string) => {
    const parsedSkills = inputStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const uniqueNewSkills = parsedSkills.filter(s => !skills.includes(s));
    const finalSkillsToAdd = [...new Set(uniqueNewSkills)];

    if (finalSkillsToAdd.length > 0) {
      setSkills(prev => {
        const toAdd = finalSkillsToAdd.filter(s => !prev.includes(s));
        return [...prev, ...toAdd];
      });
    }

    setNewSkill('');
    setErrors(prev => ({ ...prev, skills: '' }));
  };

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      processSkills(newSkill);
    }
  };

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      processSkills(val);
    } else {
      setNewSkill(val);
    }
  };
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  // ─── Account Actions ──────────────────────────────────────
  const handleDeactivate = async () => {
    setIsDeleting(true);
    try {
      const response = await api.patch('/settings/account/deactivate');
      toast(response.data.message || 'Account deactivated. You have been logged out.', 'success');
      useAuthStore.getState().logout();
    } catch (error: any) {
      toast(error.response?.data?.error || 'Failed to deactivate account.', 'error');
      setIsDeleting(false);
    } finally {
      setShowDeactivateConfirm(false);
    }
  };

  const handlePermanentDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete('/settings/account/delete');
      toast(response.data.message || 'Account permanently deleted. Goodbye!', 'success');
      useAuthStore.getState().logout();
    } catch (error: any) {
      toast(error.response?.data?.error || 'Failed to delete account.', 'error');
      setIsDeleting(false);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // ─── Guards ──────────────────────────────────────────────
  if (!user) return null;
  if (isLoadingProfile) return <ProfileSkeleton />;

  const isStudent = user.role === 'student';
  const displayName = profileData?.name || user.name || user.email.split('@')[0];

  // ─── Embedding status badge ──────────────────────────────
  const EmbeddingBadge = () => {
    if (!profileData?.resumeStorageKey) return null;
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

  const selectClass = (hasError: boolean) =>
    `flex h-11 w-full rounded-xl border bg-white dark:bg-[#202123] dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all font-medium text-slate-700 ${hasError
      ? 'border-red-400 focus:ring-red-500/40'
      : 'border-slate-200 dark:border-[#565869] focus:ring-primary-500/40 focus:border-primary-400'
    }`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-0 pb-12 px-4 sm:px-0">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up border-b border-slate-100 dark:border-[#383942] pb-5 mb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
            <User size={20} className="text-primary-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Profile
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave} isLoading={isSaving} className="flex-1 sm:flex-none">
                <Save size={14} className="mr-1.5" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} disabled={isSaving} className="flex-1 sm:flex-none">
                <XCircle size={14} className="mr-1.5" /> Cancel
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => { setIsEditing(true); }}
              className="gap-1.5 w-full sm:w-auto justify-center relative group hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 rounded-full px-5 py-2 bg-white dark:bg-[#202123] border-slate-200 dark:border-[#383942] shadow-sm hover:shadow-primary-500/20 font-semibold text-slate-700 dark:text-slate-200"
            >
              <Edit2 size={14} className="group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 text-primary-500 dark:text-primary-400" />
              <span className="group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">Edit Profile</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Account Information ─────────────────────────────── */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        <CardHeader className="border-b border-slate-100 dark:border-[#383942]">
          <SectionHeader
            icon={Shield}
            iconBg="bg-primary-50 dark:bg-primary-900/20"
            iconColor="text-primary-600"
            title="Account Information"
            subtitle={isEditing ? 'Update your name and account details' : 'Verified account identity and status'}
          />
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <ReadField label="Full Name" value={displayName} />
            )}
            <ReadField label="Email Address" value={user.email} />
            <ReadField label="Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
            <ReadField label="Account Status" value={user.isVerified ? '✓ Verified' : 'Not verified'} />
          </div>
        </CardContent>
      </Card>

      {/* ── Academic Details (students only) ───────────────── */}
      {isStudent && (
        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '120ms' }}>
          <CardHeader className="border-b border-slate-100 dark:border-[#383942]">
            <SectionHeader
              icon={FileText}
              iconBg="bg-primary-50"
              iconColor="text-primary-600"
              title="Academic Details"
              subtitle={isEditing ? 'Editing — changes save when you click Save' : 'Branch, Year and academic information'}
            />
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Course
                    </label>
                    <select
                      value={course}
                      onChange={(e) => { setCourse(e.target.value); if (errors.course) setErrors(prev => ({ ...prev, course: '' })); }}
                      className={selectClass(!!errors.course)}
                    >
                      {COURSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.course && (
                      <p className="mt-1.5 text-sm font-medium text-red-500">{errors.course}</p>
                    )}
                  </div>

                  <Input
                    id="profile-year"
                    label="Year"
                    type="number"
                    min={1}
                    max={4}
                    placeholder="1 – 4"
                    value={year}
                    onChange={(e) => { setYear(e.target.value); if (errors.year) setErrors(prev => ({ ...prev, year: '' })); }}
                    error={errors.year}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Branch
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => { setBranch(e.target.value); if (errors.branch) setErrors(prev => ({ ...prev, branch: '' })); }}
                      className={selectClass(!!errors.branch)}
                    >
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {errors.branch && (
                      <p className="mt-1.5 text-sm font-medium text-red-500">{errors.branch}</p>
                    )}
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
                    onChange={(e) => { setCpi(e.target.value); if (errors.cpi) setErrors(prev => ({ ...prev, cpi: '' })); }}
                    error={errors.cpi}
                  />
                </>
              ) : (
                <>
                  {[
                    { label: 'Course', value: profileData?.course || '—' },
                    { label: 'Year', value: profileData?.year ? String(profileData.year) : '—' },
                    { label: 'Branch', value: profileData?.branch || 'NA' },
                    { label: 'CPI', value: profileData?.cpi ? String(profileData.cpi) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        {label}
                      </p>
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#40414f] px-4 py-2.5 rounded-xl border border-slate-100 dark:border-[#383942]">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Skills (students only) ─────────────────────────── */}
      {isStudent && (
        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '180ms' }}>
          <CardHeader className="border-b border-slate-100 dark:border-[#383942]">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <SectionHeader
                  icon={Cpu}
                  iconBg="bg-primary-50 dark:bg-primary-900/20"
                  iconColor="text-primary-600"
                  title="Skills"
                  subtitle="Highlight your technical strengths and expertise"
                />
              </div>
              {skills.length > 0 && (
                <span className="shrink-0 whitespace-nowrap mt-1 sm:mt-0 text-xs font-semibold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full border border-primary-100 dark:border-primary-800">
                  {skills.length} skill{skills.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-4">
              {skills.length === 0 && !isEditing && (
                <p className="text-sm text-slate-400 text-center py-4 italic">
                  No skills yet. Click "Edit Profile" to add some.
                </p>
              )}

              {isEditing && (
                <div className="pt-2">
                  <Input
                    label="Add a skill"
                    placeholder="e.g. React, Python, MongoDB (comma-separated)"
                    value={newSkill}
                    onChange={handleSkillChange}
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
                  <SkillBadge
                    key={skill}
                    label={skill}
                    variant={isEditing ? 'removable' : 'default'}
                    onRemove={isEditing ? () => removeSkill(skill) : undefined}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Resume (students only) ─────────────────────────── */}
      {isStudent && (
        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '240ms' }}>
          <CardHeader className="border-b border-slate-100 dark:border-[#383942]">
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
            <div className="space-y-4">
              {profileData?.resumeStorageKey && (profileData?.embeddingStatus === 'pending' || profileData?.embeddingStatus === 'processing') ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary-50 flex items-center justify-center mb-3 animate-pulse">
                    <Cpu size={26} className="text-primary-600 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    AI is analyzing your resume
                  </p>
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

                  {/* Drop zone & Upload action only visible in Edit Mode */}
                  {isEditing && (
                    <>
                      <div
                        className={`border-2 border-dashed rounded-xl px-4 py-8 text-center cursor-pointer transition-all duration-200 ${isDragging
                            ? 'border-primary-400 bg-primary-50/50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { handleDrop(e); setErrors(prev => ({ ...prev, hasResume: '' })); }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadCloud
                          className={`mx-auto h-7 w-7 mb-2 ${isDragging ? 'text-primary-500' : 'text-slate-400'
                            }`}
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
                          onChange={(e) => { handleFileChange(e); setErrors(prev => ({ ...prev, hasResume: '' })); }}
                        />
                      </div>
                      {errors.hasResume && (
                        <p className="text-sm font-medium text-red-500 mt-2">{errors.hasResume}</p>
                      )}

                      {selectedFile && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white border border-slate-200 rounded-lg animate-fade-in mt-4 gap-3">
                          <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                            <FileText size={15} className="text-primary-500 shrink-0" />
                            <span className="text-sm font-medium text-slate-700 truncate">
                              {selectedFile.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                            <Button size="sm" variant="outline" onClick={() => setSelectedFile(null)} className="flex-1 sm:flex-none">
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              isLoading={isUploading}
                              onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                              className="flex-1 sm:flex-none"
                            >
                              Upload
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Danger Zone ─────────────────────────────────────── */}
      <Card className="animate-fade-in-up border-red-100 dark:border-red-900/30" style={{ animationDelay: '300ms' }}>
        <CardHeader className="border-b border-red-100 bg-red-50/30">
          <SectionHeader
            icon={Trash2}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            title="Danger Zone"
            subtitle="Manage your account status and data privacy"
          />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Deactivate Option */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeactivateConfirm(true)}
                isLoading={isDeleting && !deleteConfirm}
                className="w-full sm:w-auto border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <XCircle size={14} className="mr-2" />
                Deactivate Account
              </Button>

              {/* Permanent Delete Option */}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                isLoading={isDeleting && deleteConfirm === 'DELETE'}
                className="w-full sm:w-auto"
              >
                <Trash2 size={14} className="mr-2" />
                Delete Permanently
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 leading-tight italic">
              * Deactivation hides your profile temporarily. Permanent deletion wipes all your data forever.
            </p>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showDeactivateConfirm}
        onCancel={() => setShowDeactivateConfirm(false)}
        onConfirm={handleDeactivate}
        title="Deactivate Account?"
        description="Are you sure you want to deactivate? You will be logged out and your profile will be hidden."
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setDeleteConfirm('DELETE');
          handlePermanentDelete();
        }}
        title="PERMANENT DELETE?"
        description="WARNING: Are you absolutely sure you want to PERMANENTLY delete your account? This will erase all your profile data, job postings, and resumes forever. This action is irreversible."
        confirmLabel="Delete Forever"
        variant="danger"
        isLoading={isDeleting && deleteConfirm === 'DELETE'}
      />
    </div>
  );
};

export default MyProfile;
