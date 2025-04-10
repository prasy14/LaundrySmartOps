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
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { useState } from "react";
import type { Alert, Location, MachineError } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  // Initial date range for the last 30 days
  const initialDateRange: DateRange = {
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  };
  
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  
  // Handle date change while ensuring from/to are defined
  const handleDateChange = (newRange: DateRange) => {
    // If both dates are defined, use them directly
    if (newRange.from && newRange.to) {
      setDateRange(newRange);
    }
    // If only from is defined, keep the current "to" date
    else if (newRange.from && !newRange.to) {
      setDateRange({
        from: newRange.from,
        to: dateRange.to
      });
    }
    // If only to is defined, keep the current "from" date
    else if (!newRange.from && newRange.to) {
      setDateRange({
        from: dateRange.from,
        to: newRange.to
      });
    }
    // If neither is defined (shouldn't happen), don't update
  };

  // Auth query to get user role
  const { data: userData } = useQuery<{ user: { role: string } }>({
    queryKey: ['/api/auth/me'],
  });

  const userRole = userData?.user?.role;

  // Function to check if user has permission
  const hasPermission = (allowedRoles: string[]) => {
    return userRole && allowedRoles.includes(userRole);
  };

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

  // Export function with role check
  const exportToCSV = (data: any[], filename: string) => {
    if (!hasPermission(['data_analyst', 'admin'])) {
      toast({
        title: "Access Denied",
        description: "Only Data Analysts can export data",
        variant: "destructive"
      });
      return;
    }

    if (!data?.length) return;

    const csvContent = "data:text/csv;charset=utf-8," + 
      data.map(row => Object.values(row).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Data exported to ${filename}.csv`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <DateRangePicker
          date={dateRange}
          onDateChange={handleDateChange}
        />
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="flex-wrap">
          {/* System Analyst Tabs */}
          {hasPermission(['system_analyst', 'admin']) && (
            <>
              <TabsTrigger value="alerts">Service Alerts</TabsTrigger>
              <TabsTrigger value="trends">Error Trends</TabsTrigger>
            </>
          )}

          {/* Performance Analyst Tabs */}
          {hasPermission(['performance_analyst', 'admin']) && (
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          )}

          {/* Lease Manager Tabs */}
          {hasPermission(['lease_manager', 'admin', 'senior_executive']) && (
            <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          )}
          
          {/* Sustainability Officer Tabs */}
          {hasPermission(['sustainability_officer', 'admin']) && (
            <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          )}
          
          {/* Service Manager Tabs */}
          {hasPermission(['service_manager', 'admin']) && (
            <TabsTrigger value="service-alerts">Service Map</TabsTrigger>
          )}
          
          {/* Compliance Officer Tabs */}
          {hasPermission(['compliance_officer', 'admin']) && (
            <TabsTrigger value="compliance">SLA Compliance</TabsTrigger>
          )}
          
          {/* Data Analyst Tabs */}
          {hasPermission(['data_analyst', 'admin', 'business_analyst']) && (
            <TabsTrigger value="exports">Data Exports</TabsTrigger>
          )}

          {/* IT Manager Tabs */}
          {hasPermission(['it_manager', 'admin']) && (
            <TabsTrigger value="api-usage">API Usage</TabsTrigger>
          )}

          {/* Executive Tabs */}
          {hasPermission(['executive', 'senior_executive', 'admin']) && (
            <TabsTrigger value="executive">Executive KPIs</TabsTrigger>
          )}
          
          {/* Property Manager Tabs */}
          {hasPermission(['property_manager', 'admin']) && (
            <TabsTrigger value="property">Property Reports</TabsTrigger>
          )}
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
                  {hasPermission(['data_analyst', 'admin']) && (
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(serviceAlerts?.alerts || [], 'service-alerts')}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
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
                {hasPermission(['data_analyst', 'admin']) && (
                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(errorTrends?.trends || [], 'error-trends')}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                )}
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
                {hasPermission(['data_analyst', 'admin']) && (
                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(performanceMetrics?.machines || [], 'performance-metrics')}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                )}
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
                  {hasPermission(['data_analyst', 'admin']) && (
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(serviceIssues?.alerts || [], 'service-issues')}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
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
        {/* Sustainability Tab */}
        <TabsContent value="sustainability">
          <div className="space-y-6">
            <Card className="w-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Sustainability Metrics by Location</CardTitle>
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
                    {hasPermission(['data_analyst', 'admin']) && (
                      <Button
                        variant="outline"
                        onClick={() => exportToCSV([], 'sustainability-metrics')}
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Import the ConsumptionChart component */}
                  <div className="w-full">
                    <Card className="w-full h-80">
                      <CardHeader>
                        <CardTitle>Energy Consumption (kWh)</CardTitle>
                      </CardHeader>
                      <CardContent className="h-64">
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">Loading chart data...</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="w-full">
                    <Card className="w-full h-80">
                      <CardHeader>
                        <CardTitle>Water Consumption (gallons)</CardTitle>
                      </CardHeader>
                      <CardContent className="h-64">
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">Loading chart data...</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Energy (kWh)</TableHead>
                      <TableHead>Water (gallons)</TableHead>
                      <TableHead>Carbon Footprint</TableHead>
                      <TableHead>Cycle Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No sustainability data available
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Service Map Tab */}
        <TabsContent value="service-alerts">
          <div className="space-y-6">
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full mb-6">
                  <Card className="w-full h-80">
                    <CardHeader>
                      <CardTitle>Service Alert Heatmap</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Loading heatmap data...</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Alert Count</TableHead>
                      <TableHead>Unresolved</TableHead>
                      <TableHead>Oldest Alert</TableHead>
                      <TableHead>Avg Response Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No service alert data available
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SLA Compliance Tab */}
        <TabsContent value="compliance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>SLA Compliance</CardTitle>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[500px] mb-6">
                  <Card className="w-full h-full">
                    <CardHeader>
                      <CardTitle>SLA Compliance by Machine Group</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Loading SLA compliance data...</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Data Exports Tab */}
        <TabsContent value="exports">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Export Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Machine Performance Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-1.5">
                          <Select
                            value={selectedLocation}
                            onValueChange={setSelectedLocation}
                          >
                            <SelectTrigger className="w-full">
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
                        </div>
                        <Button className="w-full" onClick={() => exportToCSV([], 'machine-performance')}>
                          <FileDown className="w-4 h-4 mr-2" />
                          Export Performance Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Service Alert History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-1.5">
                          <DateRangePicker
                            date={dateRange}
                            onDateChange={setDateRange}
                          />
                        </div>
                        <Button className="w-full" onClick={() => exportToCSV([], 'service-alert-history')}>
                          <FileDown className="w-4 h-4 mr-2" />
                          Export Alert History
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sustainability Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-1.5">
                          <Select
                            value={selectedLocation}
                            onValueChange={setSelectedLocation}
                          >
                            <SelectTrigger className="w-full">
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
                        </div>
                        <Button className="w-full" onClick={() => exportToCSV([], 'sustainability-metrics')}>
                          <FileDown className="w-4 h-4 mr-2" />
                          Export Sustainability Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Executive KPIs Tab */}
        <TabsContent value="executive">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.2%</div>
                  <p className="text-xs text-muted-foreground">+0.1% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Cycles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,284</div>
                  <p className="text-xs text-muted-foreground">+5.2% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">28 min</div>
                  <p className="text-xs text-muted-foreground">-2.3% from last month</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="w-full h-80">
                <CardHeader>
                  <CardTitle>Regional Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading performance data...</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="w-full h-80">
                <CardHeader>
                  <CardTitle>Top 5 Locations</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading location data...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Property Reports Tab */}
        <TabsContent value="property">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Monthly Property Report</CardTitle>
                  <Badge variant="outline">Email Report Scheduled</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card className="w-full h-80">
                    <CardHeader>
                      <CardTitle>Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Loading performance data...</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="w-full h-80">
                    <CardHeader>
                      <CardTitle>Underperforming Locations</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Location</TableHead>
                            <TableHead>Efficiency</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              No data available
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button>
                    Schedule Monthly Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* API Usage Tab */}
        <TabsContent value="api-usage">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>API Usage Metrics</CardTitle>
                  <div className="flex items-center gap-4">
                    <DateRangePicker
                      date={dateRange}
                      onDateChange={setDateRange}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-80 mb-6">
                  <Card className="w-full h-full">
                    <CardHeader>
                      <CardTitle>API Calls Over Time</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Loading API usage data...</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Calls</TableHead>
                      <TableHead>Avg Response Time</TableHead>
                      <TableHead>Error Rate</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No API usage data available
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}