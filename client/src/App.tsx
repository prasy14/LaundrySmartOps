import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import LocationsPage from "@/pages/locations";
import MachinesPage from "@/pages/machines";
import DashboardPage from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import ReportsPage from "@/pages/reports";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        {/* Public Route for Login */}
        <Route path="/login" component={LoginPage} />

        {/* Protected Routes */}
        <Route path="*">
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto p-6">
                <Switch>
                  <ProtectedRoute 
                    path="/" 
                    component={LocationsPage}
                    allowedRoles={['admin', 'manager', 'operator']} 
                  />
                  <ProtectedRoute 
                    path="/dashboard" 
                    component={DashboardPage}
                    allowedRoles={['admin', 'manager', 'operator']} 
                  />
                  <ProtectedRoute 
                    path="/machines" 
                    component={MachinesPage}
                    allowedRoles={['admin', 'manager', 'operator']} 
                  />
                  <ProtectedRoute 
                    path="/admin" 
                    component={AdminPage}
                    allowedRoles={['admin']} 
                  />
                  <ProtectedRoute 
                    path="/reports" 
                    component={ReportsPage}
                    allowedRoles={['admin', 'manager']} 
                  />
                  <Route component={NotFound} />
                </Switch>
              </main>
            </div>
          </div>
        </Route>
      </Switch>
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