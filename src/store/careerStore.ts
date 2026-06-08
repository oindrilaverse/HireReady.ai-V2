import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CareerState {
  resumeText: string | null;
  dashboardData: any | null;
  isSynced: boolean;
  syncedUserId: string | null;
  user: any | null;
  setResumeText: (text: string) => void;
  setDashboardData: (data: any) => void;
  setSynced: (status: boolean, userId?: string | null) => void;
  setUser: (user: any) => void;
  clearStore: () => void;
}

export const useCareerStore = create<CareerState>()(
  persist(
    (set) => ({
      resumeText: null,
      dashboardData: null,
      isSynced: false,
      syncedUserId: null,
      user: null,
      setResumeText: (text) => set({ resumeText: text }),
      setDashboardData: (data) => set({ dashboardData: data }),
      setSynced: (status, userId = null) => set({ isSynced: status, syncedUserId: userId }),
      setUser: (user) => set({ user }),
      clearStore: () => set({ resumeText: null, dashboardData: null, isSynced: false, syncedUserId: null, user: null }),
    }),
    {
      name: 'career-storage',
    }
  )
);

