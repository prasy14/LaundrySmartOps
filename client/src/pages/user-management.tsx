// src/pages/UserManagementPage.tsx
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type User = {
  id: number;
  name: string;
  username: string;
  email?: string;
  role: string;
  lastLogin?: string;
};

export default function UserManagementPage() {
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">Error loading users: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">User Management</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border text-sm bg-white rounded-md">
            <thead>
              <tr className="bg-muted text-left text-sm font-medium">
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Username</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Role</th>
                <th className="p-3 border">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                    <td className="p-3 border">{user.name}</td>
                  <td className="p-3 border">{user.username}</td>
                  <td className="p-3 border">{user.email ?? "N/A"}</td>
                  <td className="p-3 border">
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  </td>
                  <td className="p-3 border">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString()
                      : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
