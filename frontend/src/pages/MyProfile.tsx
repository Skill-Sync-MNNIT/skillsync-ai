import { useState, useRef, type ChangeEvent } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UploadCloud, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export const MyProfile = () => {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [skills, setSkills] = useState<string[]>(['React', 'Node.js', 'MongoDB']);
  const [newSkill, setNewSkill] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Please select a valid PDF file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadMessage(null);
    
    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      await api.post('/profile/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMessage('Resume uploaded and embedding process started successfully.');
      setSelectedFile(null);
    } catch (err: any) {
      setUploadMessage(err.response?.data?.error || 'Failed to upload resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim() !== '') {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) {
        const updatedSkills = [...skills, newSkill.trim()];
        setSkills(updatedSkills);
        // Sync with backend...
        api.put('/profile', { skills: updatedSkills }).catch(console.error);
      }
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter((s) => s !== skillToRemove);
    setSkills(updatedSkills);
    // Sync with backend...
    api.put('/profile', { skills: updatedSkills }).catch(console.error);
  };

  const handleSoftDelete = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action will hide your profile and remove you from search results.')) {
      setIsDeleting(true);
      try {
        await api.delete('/profile');
        useAuthStore.getState().logout();
      } catch (err) {
        alert('Failed to delete account.');
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <div className="mt-1 p-2 bg-slate-100 rounded-md text-slate-600 font-medium">{user.email}</div>
              </div>
              
              {user.role === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input id="branch" label="Branch" placeholder="e.g. CSE" />
                  </div>
                  <div>
                    <Input id="year" label="Year" type="number" min="1" max="5" placeholder="e.g. 3" />
                  </div>
                  <div className="col-span-2">
                    <Button variant="secondary" size="sm">Save Details</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {user.role === 'student' && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="ml-1.5 inline-flex items-center justify-center text-primary-400 hover:text-primary-600 focus:outline-none">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div>
                  <Input 
                    placeholder="Type a skill and press Enter" 
                    value={newSkill} 
                    onChange={(e) => setNewSkill(e.target.value)} 
                    onKeyDown={addSkill}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {user.role === 'student' && (
            <Card>
              <CardHeader>
                <CardTitle>Resume Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-10"
                >
                  <div className="text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                    <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-500"
                      >
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-slate-500">PDF up to 5MB</p>
                  </div>
                </div>
                
                {selectedFile && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <span className="text-sm font-medium text-slate-700 truncate">{selectedFile.name}</span>
                    <Button size="sm" onClick={handleUpload} isLoading={isUploading}>
                      Upload Now
                    </Button>
                  </div>
                )}
                
                {uploadMessage && (
                  <p className="mt-3 text-sm font-medium text-green-600 bg-green-50 p-2 rounded-md border border-green-200">
                    {uploadMessage}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertTriangle size={18} className="mr-2" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 mb-4">
                Permanently disable your account. Your profile will be hidden from search results immediately and you will be securely logged out.
              </p>
              <Button variant="danger" onClick={handleSoftDelete} isLoading={isDeleting}>
                Deactivate Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
