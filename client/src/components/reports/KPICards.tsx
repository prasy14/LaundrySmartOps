import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Timer, Power } from "lucide-react";
import type { Machine } from "@shared/schema";

export function KPICards() {
  const { data } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines']
  });

  if (!data) return null;

  const machines = data.machines;
  const totalMachines = machines.length;
  const activeMachines = machines.filter(m => m.status === 'online').length;
  const totalErrors = machines.reduce((acc, m) => acc + (m.metrics?.errors || 0), 0);
  const avgUptime = machines.reduce((acc, m) => acc + (m.metrics?.uptime || 0), 0) / totalMachines;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
          <Power className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeMachines}/{totalMachines}</div>
          <p className="text-xs text-muted-foreground">
            {((activeMachines/totalMachines) * 100).toFixed(1)}% online
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgUptime.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Last 24 hours
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalErrors}</div>
          <p className="text-xs text-muted-foreground">
            Across all machines
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(((activeMachines/totalMachines) + (avgUptime/100))/2 * 100).toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Overall system health
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
