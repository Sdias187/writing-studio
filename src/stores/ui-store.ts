import { create } from "zustand"

interface UIState {
  sidebarOpen: boolean
  rightPanelOpen: boolean
  theme: "midnight"

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  rightPanelOpen: false,
  theme: "midnight",

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen: boolean) => set({ sidebarOpen }),
}))
