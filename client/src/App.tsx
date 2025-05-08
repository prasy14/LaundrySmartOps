import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import LocationsPage from "@/pages/locations";
import MachinesPage from "@/pages/machines";
import DashboardPage from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import ReportsPage from "@/pages/reports";
import SyncLogsPage from "@/pages/sync-logs";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProtectedRoute } from "@/lib/protected-route";
import AnalyticsDashboardPage from "@/pages/analytics-dashboard";

// Placeholder Components for new routes
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="container mx-auto p-6">
    <h1 className="text-3xl font-bold mb-6">{title}</h1>
    <div className="p-8 border rounded-lg bg-muted/20 flex items-center justify-center">
      <p className="text-xl text-muted-foreground">This feature will be implemented in a future update.</p>
    </div>
  </div>
);

import AlertsPage from "@/pages/alerts";
import MachineComparisonPage from "@/pages/machine-comparison";
const PredictivePage = () => <PlaceholderPage title="Predictive Maintenance" />;
const CustomReportsPage = () => <PlaceholderPage title="Custom Reports" />;
const UsagePatternsPage = () => <PlaceholderPage title="Usage Patterns" />;
const EnergyOptimizerPage = () => <PlaceholderPage title="Energy Optimizer" />;
const LocationAdminPage = () => <PlaceholderPage title="Location Administration" />;
const UserManagementPage = () => <PlaceholderPage title="User Management" />;

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
                  
                  <Route path="/sync-logs">
                    <ProtectedRoute 
                      path="/sync-logs" 
                      component={SyncLogsPage}
                      allowedRoles={['admin']} 
                    />
                  </Route>

                  {/* New routes for enhanced sidebar navigation */}
                  <Route path="/alerts">
                    <ProtectedRoute 
                      path="/alerts" 
                      component={AlertsPage}
                      allowedRoles={['admin', 'system_analyst', 'performance_analyst']} 
                    />
                  </Route>

                  <Route path="/predictive">
                    <ProtectedRoute 
                      path="/predictive" 
                      component={PredictivePage}
                      allowedRoles={['admin', 'system_analyst', 'performance_analyst']} 
                    />
                  </Route>

                  <Route path="/analytics-dashboard">
                    <ProtectedRoute 
                      path="/analytics-dashboard" 
                      component={AnalyticsDashboardPage}
                      allowedRoles={['admin', 'system_analyst', 'performance_analyst', 'data_analyst']} 
                    />
                  </Route>
                  
                  <Route path="/visualizations">
                    <ProtectedRoute 
                      path="/visualizations" 
                      component={AnalyticsDashboardPage}
                      allowedRoles={['admin', 'system_analyst', 'performance_analyst', 'data_analyst']} 
                    />
                  </Route>

                  <Route path="/custom-reports">
                    <ProtectedRoute 
                      path="/custom-reports" 
                      component={CustomReportsPage}
                      allowedRoles={['admin', 'data_analyst']} 
                    />
                  </Route>

                  <Route path="/usage-patterns">
                    <ProtectedRoute 
                      path="/usage-patterns" 
                      component={UsagePatternsPage}
                      allowedRoles={['admin', 'system_analyst', 'performance_analyst']} 
                    />
                  </Route>

                  <Route path="/machine-comparison">
                    <ProtectedRoute 
                      path="/machine-comparison" 
                      component={MachineComparisonPage}
                      allowedRoles={['admin', 'system_analyst', 'performance_analyst']} 
                    />
                  </Route>

                  <Route path="/energy">
                    <ProtectedRoute 
                      path="/energy" 
                      component={EnergyOptimizerPage}
                      allowedRoles={['admin', 'system_analyst']} 
                    />
                  </Route>

                  <Route path="/location-admin">
                    <ProtectedRoute 
                      path="/location-admin" 
                      component={LocationAdminPage}
                      allowedRoles={['admin']} 
                    />
                  </Route>

                  <Route path="/users">
                    <ProtectedRoute 
                      path="/users" 
                      component={UserManagementPage}
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
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
