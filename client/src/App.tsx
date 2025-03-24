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
  const [location] = useLocation();
  const isAuthPage = location === '/login';

  return (
    <div className="min-h-screen bg-background">
      <Switch>
        {/* Public Route for Login */}
        <Route path="/login">
          <LoginPage />
        </Route>

        {/* Protected Routes */}
        <Route path="*">
          <div className="flex h-screen">
            {!isAuthPage && <Sidebar />}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!isAuthPage && <Header />}
              <main className="flex-1 overflow-auto p-6">
                <Switch>
                  <Route path="/">
                    <ProtectedRoute 
                      path="/" 
                      component={DashboardPage}
                      allowedRoles={['admin', 'system_analyst', 'performance_analyst', 'lease_manager', 'data_analyst']} 
                    />
                  </Route>

                  <Route path="/locations">
                    <ProtectedRoute 
                      path="/locations" 
                      component={LocationsPage}
                      allowedRoles={['admin', 'lease_manager']} 
                    />
                  </Route>

                  <Route path="/reports">
                    <ProtectedRoute 
                      path="/reports" 
                      component={ReportsPage}
                      allowedRoles={['admin', 'system_analyst', 'performance_analyst', 'data_analyst']} 
                    />
                  </Route>

                  <Route path="/machines">
                    <ProtectedRoute 
                      path="/machines" 
                      component={MachinesPage}
                      allowedRoles={['admin', 'lease_manager', 'system_analyst']} 
                    />
                  </Route>

                  <Route path="/admin">
                    <ProtectedRoute 
                      path="/admin" 
                      component={AdminPage}
                      allowedRoles={['admin']} 
                    />
                  </Route>

                  <Route>
                    <NotFound />
                  </Route>
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