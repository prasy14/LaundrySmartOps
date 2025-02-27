import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/login";
import { Loader2 } from "lucide-react";
import type { User } from "@shared/schema";

import Dashboard from "@/pages/dashboard";
import Machines from "@/pages/machines";
import Reports from "@/pages/reports";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery<{ user: User }>({ 
    queryKey: ['/api/auth/me']
  });

  // Redirect to login if not authenticated
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    setLocation('/login');
    return null;
  }

  return <Component />;
}

function Router() {
  const [, setLocation] = useLocation();
  const { data: auth, isLoading } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/me']
  });

  // Redirect to dashboard if already logged in
  if (!isLoading && auth && window.location.pathname === '/login') {
    setLocation('/');
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <PrivateRoute component={Dashboard} />} />
      <Route path="/machines" component={() => <PrivateRoute component={Machines} />} />
      <Route path="/reports" component={() => <PrivateRoute component={Reports} />} />
      <Route path="/admin" component={() => <PrivateRoute component={Admin} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;