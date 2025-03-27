import { Header } from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Alert, Machine, Location, MachineError } from "@shared/schema";
import { 
  Loader2, AlertTriangle, CheckCircle, WrenchIcon, 
  PlusCircle, Activity, Bell, RotateCw, Percent
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MachineStatusChart } from "@/components/visualizations/MachineStatusChart";
import { PerformanceChart } from "@/components/visualizations/PerformanceChart";
import { AlertMetricsChart } from "@/components/visualizations/AlertMetricsChart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  
  // Existing queries
  const { data: alertsData, isLoading: alertsLoading } = useQuery<{ alerts: Alert[] }>({
    queryKey: ['/api/alerts'],
  });

  const { data: machinesData, isLoading: machinesLoading } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines'],
  });

  const { data: locationsData } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });

  const { data: errorsData } = useQuery<{ errors: MachineError[] }>({
    queryKey: ['/api/machine-errors'],
  });

  // New query for performance data
  const { data: performanceData } = useQuery<{
    uptimeHistory: Array<{ timestamp: string; value: number }>;
    alertMetrics: Array<{ type: string; count: number; avgResolutionTime: number }>;
  }>({
    queryKey: ['/api/dashboard/performance'],
  });

  if (alertsLoading || machinesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Calculate dashboard metrics
  const totalMachines = machinesData?.machines.length || 0;
  const activeMachines = machinesData?.machines.filter(m => m.status?.statusId === 'AVAILABLE').length || 0;
  const inUseMachines = machinesData?.machines.filter(m => m.status?.statusId === 'IN_USE').length || 0;
  const maintenanceNeeded = machinesData?.machines.filter(m =>
    m.status?.statusId === 'MAINTENANCE_REQUIRED' ||
    errorsData?.errors.some(e => e.machineId === m.id)
  ).length || 0;
  
  // Calculate additional metrics
  const currentAlerts = alertsData?.alerts.filter(a => a.resolvedAt === null).length || 0;
  const todayCycles = machinesData?.machines.reduce((count, machine) => {
    // This is a placeholder calculation - in a real app you'd have cycle logs
    return count + (machine.status?.statusId === 'IN_USE' ? 1 : 0);
  }, 0) || 0;
  const uptimePercentage = performanceData?.uptimeHistory && performanceData.uptimeHistory.length > 0 
    ? Math.round(performanceData.uptimeHistory[performanceData.uptimeHistory.length - 1].value) 
    : 98; // Fallback value if no data is available
  
  // Handle Add Widget
  const handleAddWidget = () => {
    toast({
      title: "Add Widget",
      description: "Widget customization will be available in a future update.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Welcome, Admin!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your machine management overview for today
          </p>
        </div>
        <Button onClick={handleAddWidget} className="flex items-center gap-2">
          <PlusCircle size={16} />
          Add Widget
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMachines}</div>
            <p className="text-xs text-muted-foreground">Operational machines</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Alerts</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentAlerts}</div>
            <p className="text-xs text-muted-foreground">Unresolved service alerts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Cycles</CardTitle>
            <RotateCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCycles}</div>
            <p className="text-xs text-muted-foreground">Total wash/dry cycles</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime Percentage</CardTitle>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uptimePercentage}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Status Distribution */}
        {machinesData?.machines && (
          <MachineStatusChart machines={machinesData.machines} />
        )}

        {/* System Uptime Trend */}
        {performanceData?.uptimeHistory && (
          <PerformanceChart
            data={performanceData.uptimeHistory}
            title="System Uptime Trend"
            yAxisLabel="Uptime %"
            color="rgb(34, 197, 94)"
          />
        )}
      </div>

      {/* Alert Metrics */}
      {performanceData?.alertMetrics && (
        <div className="mt-6">
          <AlertMetricsChart data={performanceData.alertMetrics} />
        </div>
      )}

      {/* Recent Alerts Table */}
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b dark:from-slate-800 dark:to-slate-900">
          <CardTitle className="text-xl">Recent Service Alerts</CardTitle>
          <CardDescription>Latest alerts requiring attention</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow>
                <TableHead className="w-1/4">Timestamp</TableHead>
                <TableHead className="w-1/4">Machine ID</TableHead>
                <TableHead className="w-2/4">Alert Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertsData?.alerts.filter(a => a.resolvedAt === null).slice(0, 5).map((alert) => {
                const machine = machinesData?.machines.find(m => m.id === alert.machineId);
                return (
                  <TableRow key={alert.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium">
                      {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        {machine?.externalId || `Machine #${alert.machineId}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{alert.message}</span>
                        <span className="text-xs text-muted-foreground">{alert.type}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!alertsData?.alerts || alertsData.alerts.filter(a => a.resolvedAt === null).length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <span>No active service alerts</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Machine Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Machine Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Cycle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machinesData?.machines.slice(0, 5).map((machine) => {
                const location = locationsData?.locations.find(l => l.id === machine.locationId);
                return (
                  <TableRow key={machine.id}>
                    <TableCell className="font-medium">{machine.name}</TableCell>
                    <TableCell>{location?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          machine.status?.statusId === 'AVAILABLE' ? 'success' :
                            machine.status?.statusId === 'IN_USE' ? 'default' :
                              'destructive'
                        }
                      >
                        {machine.status?.statusId || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>{machine.lastSyncAt ? format(new Date(machine.lastSyncAt), 'MMM d, h:mm a') : 'Never'}</TableCell>
                    <TableCell>{machine.status?.selectedCycle?.name || 'None'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}