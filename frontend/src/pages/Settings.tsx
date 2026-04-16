import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { X, ShieldAlert, Sliders, Save } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const Settings = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<string[]>([]);
  const [newPref, setNewPref] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        setPreferences(response.data.preferences || []);
        setIsBanned(response.data.systemStatus === 'banned');
      } catch (error) {
        console.error('Failed to fetch settings', error);
        toast('Failed to load settings', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleAddPref = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newPref.trim() !== '') {
      e.preventDefault();
      if (!preferences.includes(newPref.trim())) {
        setPreferences([...preferences, newPref.trim()]);
      }
      setNewPref('');
    }
  };

  const handleRemovePref = (prefToRemove: string) => {
    setPreferences(preferences.filter((p) => p !== prefToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/settings/preferences', { skillPreferences: preferences });
      toast('Preferences saved successfully.', 'success');
    } catch (error: any) {
      toast(error.response?.data?.error || 'Failed to save preferences.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Sycing your settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600">
           <Sliders size={20} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skill Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Add skills and topics you are interested in. We use these to improve your job match accuracy and recommendations.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {preferences.map((pref) => (
                  <span key={pref} className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
                    {pref}
                    <button type="button" onClick={() => handleRemovePref(pref)} className="ml-1.5 text-primary-400 hover:text-primary-600">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              
              <Input 
                placeholder="Type a skill/topic and press Enter..." 
                value={newPref}
                onChange={(e) => setNewPref(e.target.value)}
                onKeyDown={handleAddPref}
              />

              <div className="pt-4 flex items-center justify-end border-t border-slate-100">
                 <Button onClick={handleSave} isLoading={isSaving} size="sm">
                   <Save size={16} className="mr-2" /> Save Preferences
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-slate-700">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 font-semibold uppercase">Role</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{user?.role}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold uppercase">Email</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.email}</p>
                  </div>
                  
                  {isBanned && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-start">
                       <ShieldAlert className="h-5 w-5 text-red-600 mr-2 shrink-0 mt-0.5" />
                       <div>
                         <h4 className="text-sm font-bold text-red-900">Account Restricted</h4>
                         <p className="text-xs text-red-700 mt-1">Your account has been flagged for violating community guidelines. Some features are disabled.</p>
                       </div>
                    </div>
                  )}
                  {!isBanned && (
                    <div className="mt-4 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
                       Good Standing
                    </div>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
