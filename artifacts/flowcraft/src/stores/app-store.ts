import { create } from "zustand";
import type { ReactNode } from "react";

type Breadcrumb = { label: string; href?: string };

type AppState = {
  tenant: { id: string; name: string; slug: string } | null;
  currentEnvironment: { id: string; name: string; type: "dev" | "staging" | "prod" } | null;
  sidebarCollapsed: boolean;
  breadcrumbs: Breadcrumb[];
  setTenant: (tenant: AppState["tenant"]) => void;
  setEnvironment: (env: AppState["currentEnvironment"]) => void;
  toggleSidebar: () => void;
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void;
};

export const useAppStore = create<AppState>((set) => ({
  tenant: null,
  currentEnvironment: null,
  sidebarCollapsed: false,
  breadcrumbs: [],
  setTenant: (tenant) => set({ tenant }),
  setEnvironment: (env) => set({ currentEnvironment: env }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
}));
