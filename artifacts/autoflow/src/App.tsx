import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";

import DashboardPage from "@/pages/dashboard";
import WorkflowsPage from "@/pages/workflows/index";
import WorkflowBuilderPage from "@/pages/workflows/builder";
import ExecutionsPage from "@/pages/executions/index";
import ExecutionDetailPage from "@/pages/executions/detail";
import ConnectorsPage from "@/pages/connectors";
import AppsPage from "@/pages/apps";
import AppDetailPage from "@/pages/apps/detail";
import TemplatesPage from "@/pages/templates";
import DlqPage from "@/pages/dlq";
import AuditPage from "@/pages/audit";
import CredentialsPage from "@/pages/credentials";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      {/* Workflow builder is full-screen — no sidebar */}
      <Route path="/workflows/:id" component={WorkflowBuilderPage} />

      {/* Everything else uses the sidebar layout */}
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/workflows" component={WorkflowsPage} />
            <Route path="/executions" component={ExecutionsPage} />
            <Route path="/executions/:id" component={ExecutionDetailPage} />
            <Route path="/connectors" component={ConnectorsPage} />
            <Route path="/apps" component={AppsPage} />
            <Route path="/apps/:id" component={AppDetailPage} />
            <Route path="/templates" component={TemplatesPage} />
            <Route path="/dlq" component={DlqPage} />
            <Route path="/audit" component={AuditPage} />
            <Route path="/credentials" component={CredentialsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
