import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Workspace, Project } from '../types';
import { parseJWT } from '../utils/jwt';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, email?: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

interface AppState {
  currentWorkspace: Workspace | null;
  currentProject: Project | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentProject: (project: Project | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token: string, email?: string) => {
        localStorage.setItem('access_token', token);
        
        // Parse user info from JWT token
        const payload = parseJWT(token);
        const user: User = {
          id: payload?.user_id?.toString() || '',
          email: email || 'user01@example.com',
          username: email?.split('@')[0] || 'user01',
          first_name: '',
          last_name: '',
          subscription_plan: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        set({ token: null, user: null, isAuthenticated: false });
      },
      updateUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Check if token exists in localStorage after rehydration
        const token = localStorage.getItem('access_token');
        if (token && state && !state.isAuthenticated) {
          state.token = token;
          state.isAuthenticated = true;
        }
      },
    }
  )
);

export const useAppStore = create<AppState>((set) => ({
  currentWorkspace: null,
  currentProject: null,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setCurrentProject: (project) => set({ currentProject: project }),
}));
