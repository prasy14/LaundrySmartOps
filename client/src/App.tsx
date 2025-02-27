import { Switch, Route, useLocation } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/dashboard";
import Machines from "@/pages/machines";
import Reports from "@/pages/reports";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { initWebSocket } from "./lib/ws";
import { Loader2 } from "lucide-react";
import type { User } from "@shared/schema";

// Initialize WebSocket connection
initWebSocket();

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery<{ user: User }>({ 
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: "returnNull" })
  });

  useEffect(() => {
    if (!isLoading && !data) {
      setLocation('/login');
    }
  }, [data, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  const [, setLocation] = useLocation();
  const { data: auth, isLoading } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false
  });

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && auth && window.location.pathname === '/login') {
      setTimeout(() => {
        setLocation('/');
      }, 100);
    }
  }, [auth, isLoading, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <PrivateRoute component={Dashboard} />} />
      <Route path="/machines" component={() => <PrivateRoute component={Machines} />} />
      <Route path="/reports" component={() => <PrivateRoute component={Reports} />} />
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