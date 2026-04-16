import { create } from 'zustand';
import api from '../services/api';

export interface Message {
  id: string; // Used for UI keying
  role: 'user' | 'assistant';
  content: string;
  results?: any[];
  filters?: { limit?: number; min_cpi?: number; core_query?: string };
}

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  activeMessages: Message[];
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (query: string, branch?: string, year?: number, top_k?: number) => Promise<void>;
  clearActive: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  activeMessages: [],
  isLoading: false,

  fetchConversations: async () => {
    try {
      const res = await api.get('/conversations');
      set({ conversations: res.data });
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  },

  setActiveConversation: async (id) => {
    // If switching to a new null (new chat)
    if (!id) {
      set({ activeId: null, activeMessages: [] });
      return;
    }
    set({ activeId: id, activeMessages: [], isLoading: true });
    try {
      const res = await api.get(`/conversations/${id}`);
      // Parse db messages back to UI Message format
      const loadedMessages: Message[] = (res.data.messages || []).map((m: any, i: number) => ({
        id: `loaded-${i}`,
        role: m.role,
        content: m.content,
        results: m.results,
        filters: m.filters
      }));
      set({ activeMessages: loadedMessages, isLoading: false });
    } catch (err) {
      console.error('Failed to load past conversation messages', err);
      set({ activeMessages: [], isLoading: false });
    }
  },

  deleteConversation: async (id) => {
    try {
      await api.delete(`/conversations/${id}`);
      const { activeId } = get();
      if (activeId === id) set({ activeId: null, activeMessages: [] });
      set(state => ({
        conversations: state.conversations.filter(c => c._id !== id)
      }));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  },
  
  clearActive: () => set({ activeId: null, activeMessages: [] }),

  sendMessage: async (query, branch, year, top_k) => {
    const { activeId, activeMessages } = get();
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query };
    set({ activeMessages: [...activeMessages, userMsg], isLoading: true });

    try {
      const res = await api.post('/search', {
        query,
        branch,
        year,
        top_k,
        conversationId: activeId
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.summary || 'Search complete.',
        results: res.data.results,
        filters: res.data.filters
      };

      set(state => ({
        activeId: res.data.conversationId, 
        activeMessages: [...state.activeMessages, aiMsg],
        isLoading: false
      }));

      // Refresh sidebar titles list implicitly tracking new created ones or shifting order
      get().fetchConversations();
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  }
}));
