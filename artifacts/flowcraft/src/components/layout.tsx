import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  AppWindow,
  BarChart,
  Cable,
  LayoutDashboard,
  Workflow as WorkflowIcon,
  Layers,
  KeyRound,
  BarChart2,
  AlertTriangle,
  Shield,
  Webhook,
  PanelTop,
  Globe,
  Receipt,
  BrainCircuit,
  Building2,
  Bell,
  Flag,
  MapPin,
  Bot,
  MessageSquareText,
  ChartLine,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { sidebarCollapsed } = useAppStore();

  return (
    <SidebarProvider defaultOpen={!sidebarCollapsed}>
      <div className="flex h-screen overflow-hidden w-full bg-background">
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="h-14 flex items-center justify-center border-b border-sidebar-border px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold text-xl text-primary w-full"
            >
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <WorkflowIcon size={20} />
              </div>
              <span>LongoX</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/dashboard"}
                    >
                      <Link href="/dashboard">
                        <LayoutDashboard />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Automation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/workflows")}
                    >
                      <Link href="/workflows">
                        <Cable />
                        <span>Workflows</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/templates")}
                    >
                      <Link href="/templates">
                        <Layers />
                        <span>Templates</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/executions")}
                    >
                      <Link href="/executions">
                        <Activity />
                        <span>Executions</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/analytics")}
                    >
                      <Link href="/analytics">
                        <BarChart2 />
                        <span>Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/connectors")}
                    >
                      <Link href="/connectors">
                        <AppWindow />
                        <span>Connectors</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/webhook-endpoints")}
                    >
                      <Link href="/webhook-endpoints">
                        <Webhook />
                        <span>Webhook Triggers</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>AI</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/ai/playground"}
                    >
                      <Link href="/ai/playground">
                        <BrainCircuit />
                        <span>Playground</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/ai/models"}
                    >
                      <Link href="/ai/models">
                        <Bot />
                        <span>Models</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/ai/prompts"}
                    >
                      <Link href="/ai/prompts">
                        <MessageSquareText />
                        <span>Prompts</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/ai/analytics"}
                    >
                      <Link href="/ai/analytics">
                        <ChartLine />
                        <span>AI Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Observability</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/dlq")}
                    >
                      <Link href="/dlq">
                        <AlertTriangle />
                        <span>Dead-Letter Queue</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/audit-log")}
                    >
                      <Link href="/audit-log">
                        <Shield />
                        <span>Audit Log</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Internal Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/dashboards")}
                    >
                      <Link href="/dashboards">
                        <PanelTop />
                        <span>Dashboards</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location === "/apps" ||
                        (location.startsWith("/apps/") &&
                          location !== "/apps/stats")
                      }
                    >
                      <Link href="/apps">
                        <AppWindow />
                        <span>Apps</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/apps/stats"}
                    >
                      <Link href="/apps/stats">
                        <BarChart />
                        <span>App Stats</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Distribution</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/environments")}
                    >
                      <Link href="/environments">
                        <Globe />
                        <span>Environments</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/billing")}
                    >
                      <Link href="/billing">
                        <Receipt />
                        <span>Billing</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/credentials")}
                    >
                      <Link href="/credentials">
                        <KeyRound />
                        <span>Credentials</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/rbac")}
                    >
                      <Link href="/rbac">
                        <Shield />
                        <span>Access Control</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/tenants")}
                    >
                      <Link href="/tenants">
                        <Building2 />
                        <span>Tenants</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/feature-flags")}
                    >
                      <Link href="/feature-flags">
                        <Flag />
                        <span>Feature Flags</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/notifications")}
                    >
                      <Link href="/notifications">
                        <Bell />
                        <span>Notifications</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/settings/regions")}
                    >
                      <Link href="/settings/regions">
                        <MapPin />
                        <span>Regions</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <WorkspaceLayout>{children}</WorkspaceLayout>
      </div>
    </SidebarProvider>
  );
}
