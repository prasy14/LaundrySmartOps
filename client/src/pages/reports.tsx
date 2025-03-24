import { Header } from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, BarChart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useState } from "react";
import type { Alert, Location, MachineError } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface DateRange {
  from: Date;
  to: Date;
}

export default function Reports() {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    to: new Date()
  });

  // Fetch data with error handling
  const { data: locationsData, isLoading: locationsLoading } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });

  // Service alerts with date range and location filter
  const { data: serviceAlerts, isLoading: alertsLoading } = useQuery<{ alerts: Alert[] }>({
    queryKey: ['/api/reports/service-alerts', selectedLocation, dateRange],
    enabled: !locationsLoading,
  });

  // Service issues with type filter
  const { data: serviceIssues, isLoading: issuesLoading } = useQuery<{ alerts: Alert[] }>({
    queryKey: ['/api/reports/service-issues', selectedServiceType],
    enabled: !locationsLoading,
  });

  // Performance metrics with location and date range filter
  const { data: performanceMetrics, isLoading: metricsLoading } = useQuery<{
    machines: Array<{
      id: number;
      name: string;
      uptime: number;
      totalRuntime: number;
      efficiency: number;
      cycleCount: number;
      avgCycleTime: number;
      serviceResponseTime: number;
    }>;
    averageUptime: number;
    slaMet: boolean;
    slaDetails: {
      target: number;
      actual: number;
      status: 'met' | 'warning' | 'breached';
    };
  }>({
    queryKey: ['/api/reports/performance-metrics', selectedLocation, dateRange],
    enabled: !locationsLoading,
  });

  // Error trends data
  const { data: errorTrends, isLoading: trendsLoading } = useQuery<{
    trends: Array<{
      errorType: string;
      count: number;
      avgResolutionTime: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
  }>({
    queryKey: ['/api/reports/error-trends', dateRange],
    enabled: !locationsLoading,
  });

  if (locationsLoading || alertsLoading || issuesLoading || metricsLoading || trendsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Export function
  const exportToCSV = (data: any[], filename: string) => {
    if (!data?.length) return;

    const csvContent = "data:text/csv;charset=utf-8," + 
      data.map(row => Object.values(row).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
        />
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="alerts">Service Alerts</TabsTrigger>
          <TabsTrigger value="issues">Service Issues</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="trends">Error Trends</TabsTrigger>
        </TabsList>

        {/* Service Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Service Alerts by Location</CardTitle>
                <div className="flex items-center gap-4">
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locationsData?.locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(serviceAlerts?.alerts || [], 'service-alerts')}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Resolution Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceAlerts?.alerts?.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>{alert.machineId}</TableCell>
                      <TableCell>{alert.location}</TableCell>
                      <TableCell>{alert.type}</TableCell>
                      <TableCell>
                        <Badge variant={
                          alert.status === 'active' ? 'destructive' :
                          alert.status === 'in_progress' ? 'default' :
                          'success'
                        }>
                          {alert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(alert.createdAt), 'MMM d, h:mm a')}</TableCell>
                      <TableCell>
                        {alert.resolutionTime ? `${alert.resolutionTime} mins` : 'Pending'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!serviceAlerts?.alerts || serviceAlerts.alerts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No service alerts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Error Trends Analysis</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(errorTrends?.trends || [], 'error-trends')}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Error Type</TableHead>
                    <TableHead>Occurrence Count</TableHead>
                    <TableHead>Avg Resolution Time</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorTrends?.trends?.map((trend) => (
                    <TableRow key={trend.errorType}>
                      <TableCell>{trend.errorType}</TableCell>
                      <TableCell>{trend.count}</TableCell>
                      <TableCell>{trend.avgResolutionTime} mins</TableCell>
                      <TableCell>
                        <Badge variant={
                          trend.trend === 'increasing' ? 'destructive' :
                          trend.trend === 'decreasing' ? 'success' :
                          'default'
                        }>
                          {trend.trend}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!errorTrends?.trends || errorTrends.trends.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No error trends data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Machine Performance Metrics</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(performanceMetrics?.machines || [], 'performance-metrics')}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Average System Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceMetrics?.averageUptime?.toFixed(1) || '0'}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">SLA Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={
                      performanceMetrics?.slaDetails?.status === 'met' ? 'success' :
                      performanceMetrics?.slaDetails?.status === 'warning' ? 'default' :
                      'destructive'
                    }>
                      {(performanceMetrics?.slaDetails?.status || 'N/A').toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Average Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceMetrics?.machines?.length ? 
                        (performanceMetrics.machines.reduce((acc, m) => acc + (m.serviceResponseTime || 0), 0) / 
                        performanceMetrics.machines.length).toFixed(1) + ' min'
                        : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Uptime %</TableHead>
                    <TableHead>Total Runtime (hrs)</TableHead>
                    <TableHead>Efficiency Score</TableHead>
                    <TableHead>Cycle Count</TableHead>
                    <TableHead>Avg Cycle Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceMetrics?.machines?.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell>{machine.name}</TableCell>
                      <TableCell>{machine.uptime?.toFixed(1) || '0'}%</TableCell>
                      <TableCell>{((machine.totalRuntime || 0) / 3600).toFixed(1)}</TableCell>
                      <TableCell>{machine.efficiency?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{machine.cycleCount || 0}</TableCell>
                      <TableCell>{machine.avgCycleTime || 0} min</TableCell>
                    </TableRow>
                  ))}
                  {(!performanceMetrics?.machines || performanceMetrics.machines.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No performance metrics available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Issues Tab */}
        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Service Issues by Type</CardTitle>
                <div className="flex items-center gap-4">
                  <Select
                    value={selectedServiceType}
                    onValueChange={setSelectedServiceType}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Service Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="mechanical">Mechanical</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(serviceIssues?.alerts || [], 'service-issues')}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Resolution Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceIssues?.alerts?.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>{issue.serviceType}</TableCell>
                      <TableCell>
                        <Badge variant={
                          issue.priority === 'high' ? 'destructive' :
                          issue.priority === 'medium' ? 'default' :
                          'secondary'
                        }>
                          {issue.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{issue.status}</TableCell>
                      <TableCell>{issue.assignedTo || 'Unassigned'}</TableCell>
                      <TableCell>{issue.responseTime ? `${issue.responseTime} mins` : 'N/A'}</TableCell>
                      <TableCell>{issue.resolutionTime ? `${issue.resolutionTime} mins` : 'Pending'}</TableCell>
                    </TableRow>
                  ))}
                  {(!serviceIssues?.alerts || serviceIssues.alerts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No service issues found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}