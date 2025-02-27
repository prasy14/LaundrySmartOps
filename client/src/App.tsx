import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import LocationsPage from "@/pages/locations";
import MachinesPage from "@/pages/machines";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/login" component={Login} />
              <ProtectedRoute 
                path="/" 
                component={LocationsPage}
                allowedRoles={['admin', 'manager', 'operator']} 
              />
              <ProtectedRoute 
                path="/machines" 
                component={MachinesPage}
                allowedRoles={['admin', 'manager', 'operator']} 
              />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </div>
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