import { Header } from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Alert, Machine, Location, MachineError } from "@shared/schema";
import { Loader2, AlertTriangle, CheckCircle, WrenchIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MachineStatusChart } from "@/components/visualizations/MachineStatusChart";
import { PerformanceChart } from "@/components/visualizations/PerformanceChart";
import { AlertMetricsChart } from "@/components/visualizations/AlertMetricsChart";

export default function Dashboard() {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Machine Management Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMachines}</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Machines</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMachines}</div>
            <p className="text-xs text-muted-foreground">Ready for use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inUseMachines}</div>
            <p className="text-xs text-muted-foreground">Currently operating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Required</CardTitle>
            <WrenchIcon className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceNeeded}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
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

      {/* Recent Errors Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Service Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Error Type</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorsData?.errors.slice(0, 5).map((error) => {
                const machine = machinesData?.machines.find(m => m.id === error.machineId);
                const location = locationsData?.locations.find(l => l.id === error.locationId);
                return (
                  <TableRow key={error.id}>
                    <TableCell className="font-medium">{machine?.name || 'Unknown'}</TableCell>
                    <TableCell>{location?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                        {error.errorType}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(error.timestamp), 'MMM d, h:mm a')}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Needs Attention</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!errorsData?.errors || errorsData.errors.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No recent service alerts
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