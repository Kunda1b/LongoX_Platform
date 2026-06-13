"use client";

import { type ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="ml-56 flex-1 p-6">{children}</main>
    </div>
  );
}
