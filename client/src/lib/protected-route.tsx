import { useQuery } from "@tanstack/react-query";
import { Redirect, Route } from "wouter";
import { Loader2 } from "lucide-react";
import type { User } from "@shared/schema";

export function ProtectedRoute({ 
  component: Component,
  allowedRoles = ['admin', 'manager', 'operator'],
  path
}: { 
  component: React.ComponentType;
  allowedRoles?: string[];
  path: string;
}) {
  const { data, isLoading } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/me'],
  });

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Route>
    );
  }

  if (!data?.user || !allowedRoles.includes(data.user.role)) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
