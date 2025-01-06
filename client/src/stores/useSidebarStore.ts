import { create } from "zustand";

interface SidebarStore {
  isSidebarOpen: boolean;
  actions: {
    toggleSidebar: () => void;
  };
}

const useSidebarStore = create<SidebarStore>((set) => ({
  isSidebarOpen: true,
  actions: {
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  },
}));

export const useIsSidebarOpen = () => useSidebarStore((state) => state.isSidebarOpen);
export const useSidebarActions = () => useSidebarStore((state) => state.actions);
