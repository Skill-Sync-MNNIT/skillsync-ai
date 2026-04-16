import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, User, Check, Users } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (room: any) => void;
}

export const CreateGroupModal = ({ isOpen, onClose, onSuccess }: CreateGroupModalProps) => {
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    try {
      const res = await api.get('/connections/list?limit=100'); // Get more for group creation
      setConnections(res.data.connections || []);
    } catch (err) {
      toast('Failed to load connections', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleParticipant = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return toast('Please enter a group name', 'error');
    if (selectedIds.length === 0) return toast('Select at least one participant', 'error');

    setIsSubmitting(true);
    try {
      const res = await api.post('/chats/rooms/group', {
        name: groupName,
        participantIds: selectedIds,
      });
      toast('Group created successfully!', 'success');
      onSuccess(res.data);
      onClose();
    } catch (err) {
      toast('Failed to create group', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-white dark:bg-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-primary-600" size={24} /> New Group Chat
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
            <Input
              label="Group Name"
              placeholder="e.g. Study Squad"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Select Participants ({selectedIds.length})
              </label>
              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-center text-slate-400 py-4 italic">Loading connections...</p>
                ) : connections.length === 0 ? (
                  <p className="text-center text-slate-400 py-4 italic">No connections found. Connect with peers first!</p>
                ) : (
                  connections.map((conn) => {
                    const otherUser = conn.requester._id === currentUser?._id ? conn.recipient : conn.requester;
                    const isSelected = selectedIds.includes(otherUser._id);

                    return (
                      <div
                        key={otherUser._id}
                        onClick={() => toggleParticipant(otherUser._id)}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                            : 'border-white dark:border-slate-800 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{otherUser.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{otherUser.role}</p>
                          </div>
                        </div>
                        {isSelected && <Check size={20} className="text-primary-600" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-white dark:bg-slate-800 flex gap-3">
            <Button variant="ghost" className="flex-1" type="button" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" type="submit" isLoading={isSubmitting} disabled={selectedIds.length === 0 || !groupName.trim()}>
              Create Group
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
