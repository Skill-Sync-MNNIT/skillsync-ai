import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  email: string;
  role: 'student' | 'professor' | 'alumni';
  isVerified: boolean;
  isActive: boolean;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: (user, token) => {
        set({ user, token });
      },

      logout: () => {
        set({ user: null, token: null });
      },

      updateUser: (patch) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...patch } });
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage', //saves BOTH user + token
    }
  )
);


// old code 
// import { create } from 'zustand';

// interface User {
//   _id: string;
//   email: string;
//   role: 'student' | 'professor' | 'alumni';
//   isVerified: boolean;
//   isActive: boolean;
// }

// interface AuthState {
//   user: User | null;
//   token: string | null;
//   login: (user: User, token: string) => void;
//   logout: () => void;
//   isAuthenticated: () => boolean;
// }

// export const useAuthStore = create<AuthState>((set, get) => ({
//   user: null,
//   token: localStorage.getItem('token') || null,
//   login: (user, token) => {
//     localStorage.setItem('token', token);
//     set({ user, token });
//   },
//   logout: () => {
//     localStorage.removeItem('token');
//     set({ user: null, token: null });
//   },
//   isAuthenticated: () => !!get().token,
// }));
