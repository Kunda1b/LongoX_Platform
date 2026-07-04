import { create } from "zustand";

interface AppState {
  activeTenantId: string | null;
  activeEnvironment: string | null;
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  setActiveTenantId: (id: string | null) => void;
  setActiveEnvironment: (env: string | null) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTenantId: null,
  activeEnvironment: null,
  theme: "light",
  sidebarCollapsed: false,
  setActiveTenantId: (id) => set({ activeTenantId: id }),
  setActiveEnvironment: (env) => set({ activeEnvironment: env }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
