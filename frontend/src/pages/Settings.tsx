import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { X, ShieldAlert, Sliders, Save } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export const Settings = () => {
  const { user } = useAuthStore();
  
  const [preferences, setPreferences] = useState<string[]>([]);
  const [newPref, setNewPref] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        setPreferences(response.data.preferences || []);
        setIsBanned(response.data.systemStatus === 'banned');
      } catch (error) {
        console.error('Failed to fetch settings', error);
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
    setMessage('');
    try {
      await api.put('/settings/preferences', { preferences });
      setMessage('Preferences saved successfully.');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
           <Sliders size={20} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Account Settings</h1>
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
                  <span key={pref} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {pref}
                    <button type="button" onClick={() => handleRemovePref(pref)} className="ml-1.5 text-indigo-400 hover:text-indigo-600">
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

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                 <span className={`text-sm font-medium ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                   {message}
                 </span>
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
                    <p className="text-sm font-medium text-slate-900 capitalize">{user?.role}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold uppercase">Email</label>
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
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
                    <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
