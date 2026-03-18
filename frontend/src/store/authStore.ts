import { create } from 'zustand';

interface User {
  _id: string;
  email: string;
  role: 'student' | 'professor' | 'alumni';
  isVerified: boolean;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  isAuthenticated: () => !!get().token,
}));
