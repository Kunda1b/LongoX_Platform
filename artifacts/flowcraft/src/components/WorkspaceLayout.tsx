import type { ReactNode } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { GlobalNav } from "@/components/GlobalNav";
import { cn } from "@/lib/utils";

interface WorkspaceLayoutProps {
  children: ReactNode;
  className?: string;
}

export function WorkspaceLayout({ children, className }: WorkspaceLayoutProps) {
  return (
    <SidebarInset className={cn("flex flex-col", className)}>
      <GlobalNav />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        {children}
      </main>
    </SidebarInset>
  );
}
