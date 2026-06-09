import { Switch, Route, Redirect } from "wouter";
import Dashboard from "@/pages/dashboard";
import Workflows from "@/pages/workflows/index";
import WorkflowDetail from "@/pages/workflows/detail";
import Executions from "@/pages/executions/index";
import ExecutionDetail from "@/pages/executions/detail";
import Connectors from "@/pages/connectors/index";
import Apps from "@/pages/apps/index";
import AppDetail from "@/pages/apps/detail";
import AppStats from "@/pages/apps/stats";
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

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/dashboard" component={Dashboard} />
        
        <Route path="/workflows" component={Workflows} />
        <Route path="/workflows/:id" component={WorkflowDetail} />
        
        <Route path="/executions" component={Executions} />
        <Route path="/executions/:id" component={ExecutionDetail} />
        
        <Route path="/connectors" component={Connectors} />
        
        <Route path="/apps" component={Apps} />
        <Route path="/apps/stats" component={AppStats} />
        <Route path="/apps/:id" component={AppDetail} />
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
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