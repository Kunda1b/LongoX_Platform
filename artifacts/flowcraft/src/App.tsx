import { Switch, Route } from "wouter";
import Dashboard from "@/pages/dashboard";
import Workflows from "@/pages/workflows/index";
import WorkflowDetail from "@/pages/workflows/detail";
import Executions from "@/pages/executions/index";
import ExecutionDetail from "@/pages/executions/detail";
import Connectors from "@/pages/connectors/index";
import Apps from "@/pages/apps/index";
import AppDetail from "@/pages/apps/detail";
import AppStats from "@/pages/apps/stats";
import Templates from "@/pages/templates/index";
import Credentials from "@/pages/credentials/index";
import Analytics from "@/pages/analytics/index";
import DlqPage from "@/pages/dlq/index";
import AuditLogPage from "@/pages/audit-log/index";
import DashboardsPage from "@/pages/dashboards/index";
import DashboardBuilder from "@/pages/dashboards/builder";
import BillingPage from "@/pages/billing/index";
import EnvironmentsPage from "@/pages/environments/index";
import TenantsPage from "@/pages/tenants/index";
import RbacPage from "@/pages/rbac/index";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />

        <Route path="/workflows" component={Workflows} />
        <Route path="/workflows/:id" component={WorkflowDetail} />

        <Route path="/templates" component={Templates} />
        <Route path="/credentials" component={Credentials} />
        <Route path="/analytics" component={Analytics} />

        <Route path="/executions" component={Executions} />
        <Route path="/executions/:id" component={ExecutionDetail} />

        <Route path="/connectors" component={Connectors} />

        <Route path="/apps/stats" component={AppStats} />
        <Route path="/apps/:id" component={AppDetail} />
        <Route path="/apps" component={Apps} />

        <Route path="/dashboards/:id" component={DashboardBuilder} />
        <Route path="/dashboards" component={DashboardsPage} />

        <Route path="/billing" component={BillingPage} />
        <Route path="/environments" component={EnvironmentsPage} />
        <Route path="/tenants" component={TenantsPage} />
        <Route path="/rbac" component={RbacPage} />

        <Route path="/dlq" component={DlqPage} />
        <Route path="/audit-log" component={AuditLogPage} />

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      {/* Catch-all: no path = matches every other route */}
      <Route>{() => <AppRoutes />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
