import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CareerState {
  resumeText: string | null;
  dashboardData: any | null;
  isSynced: boolean;
  setResumeText: (text: string) => void;
  setDashboardData: (data: any) => void;
  setSynced: (status: boolean) => void;
  clearStore: () => void;
}

export const useCareerStore = create<CareerState>()(
  persist(
    (set) => ({
      resumeText: null,
      dashboardData: null,
      isSynced: false,
      setResumeText: (text) => set({ resumeText: text }),
      setDashboardData: (data) => set({ dashboardData: data }),
      setSynced: (status) => set({ isSynced: status }),
      clearStore: () => set({ resumeText: null, dashboardData: null, isSynced: false }),
    }),
    {
      name: 'career-storage',
    }
  )
);

