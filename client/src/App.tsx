import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import LocationsPage from "@/pages/locations";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Switch>
          <Route path="/login" component={Login} />
          <ProtectedRoute 
            path="/" 
            component={LocationsPage}
            allowedRoles={['admin', 'manager', 'operator']} 
          />
          <Route component={NotFound} />
        </Switch>
      </main>
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