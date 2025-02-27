import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/dashboard";
import Machines from "@/pages/machines";
import Reports from "@/pages/reports";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { initWebSocket } from "./lib/ws";

// Initialize WebSocket connection
initWebSocket();

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();
  const { data: auth } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false
  });

  useEffect(() => {
    if (!auth && location !== '/login') {
      setLocation('/login');
    }
  }, [auth, location]);

  if (!auth) return null;
  
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
