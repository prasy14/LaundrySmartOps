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
import { useState, useMemo } from "react";
import type { Alert, Location, MachineError } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { EmailScheduleDialog } from "@/components/reports/EmailScheduleDialog";
import { HistoricalExport } from "@/components/reports/HistoricalExport";
import { ApiMonitoring } from "@/components/reports/ApiMonitoring";
import { ExecutiveSummary } from "@/components/reports/ExecutiveSummary";
import { MachineSelector } from "@/components/reports/MachineSelector";
import { check as checkSecret } from "@/lib/utils";
import SearchableDropdown from "@/pages/SearchableDropdown";
import { ConsumptionChart } from "@/components/visualizations/ConsumptionChart";
import { CarbonFootprintChart } from "@/components/visualizations/CarbonFootprintChart";

export default function Reports() {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
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

  // Service alerts with date range, location and machine filter
  const { data: serviceAlerts, isLoading: alertsLoading } = useQuery<{ alerts: Alert[] }>({
    queryKey: ['/api/reports/service-alerts', selectedLocation, selectedMachine, dateRange],
    enabled: !locationsLoading,
  });

  // Service issues with type filter and machine filter
  const { data: serviceIssues, isLoading: issuesLoading } = useQuery<{ alerts: Alert[] }>({
    queryKey: ['/api/reports/service-issues', selectedServiceType, selectedMachine],
    enabled: !locationsLoading,
  });

  // Performance metrics with location, machine and date range filter
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
    queryKey: ['/api/reports/performance-metrics', selectedLocation, selectedMachine, dateRange],
    enabled: !locationsLoading,
  });

  // Machine errors data with location and machine filter
  const { data: machineErrors, isLoading: errorsLoading } = useQuery<{ errors: MachineError[] }>({
    queryKey: ['/api/machine-errors', selectedLocation, selectedMachine, dateRange],
    enabled: !locationsLoading,
  });

  // Error trends data with machine filter
  const { data: errorTrends, isLoading: trendsLoading } = useQuery<{
    trends: Array<{
      errorType: string;
      count: number;
      avgResolutionTime: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
  }>({
    queryKey: ['/api/reports/error-trends', selectedMachine, dateRange],
    enabled: !locationsLoading,
  });

  // Audit operations data
  const { data: auditOperations, isLoading: auditOperationsLoading } = useQuery<{
    operations: Array<{
      id: number;
      locationId: number;
      machineId: number;
      category: string;
      operationType: string;
      operationStatus: string;
      auditorName: string;
      startTime: Date;
      endTime: Date;
      findings: any;
    }>;
  }>({
    queryKey: ['/api/audit-operations', selectedLocation, selectedMachine, dateRange],
    enabled: !locationsLoading,
  });

  // Coin vault data
  const { data: coinVaultData, isLoading: coinVaultLoading } = useQuery<{
    vaults: Array<{
      id: number;
      locationId: string;
      locationName: string;
      machineId: string;
      machineName: string;
      vaultSize: number;
      percentCapacity: string;
      totalValue: number;
      machineTypeName: string;
    }>;
  }>({
    queryKey: ['/api/coin-vaults', selectedLocation, selectedMachine],
    enabled: !locationsLoading,
  });

  // Audit cycle usage data
  const { data: cycleUsageData, isLoading: cycleUsageLoading } = useQuery<{
    usage: Array<{
      id: number;
      locationId: string;
      machineId: string;
      reportId: string;
      totalCycles: number;
      energyConsumption: number;
      waterConsumption: number;
      efficiency: number;
    }>;
  }>({
    queryKey: ['/api/audit-cycle-usage', selectedLocation, selectedMachine, dateRange],
    enabled: !locationsLoading,
  });

  // Audit total vending data
  const { data: vendingData, isLoading: vendingLoading } = useQuery<{
    vending: Array<{
      id: number;
      locationId: string;
      machineId: string;
      totalVended: number;
      revenue: number;
      transactions: number;
    }>;
  }>({
    queryKey: ['/api/audit-total-vending', selectedLocation, selectedMachine, dateRange],
    enabled: !locationsLoading,
  });
  
  // Sustainability data with location filter
  const { data: sustainabilityData, isLoading: isSustainabilityLoading, error: sustainabilityError } = useQuery<{
    data: Array<{
      date: string;
      location: string;
      energy: number;
      water: number;
      carbon: number;
      cycles: number;
    }>;
  }>({
    queryKey: ['/api/reports/sustainability', selectedLocation, selectedMachine, dateRange],
    enabled: !locationsLoading,
  });
  
  // Prepare data for consumption charts
  const energyData = useMemo(() => {
    if (!sustainabilityData?.data) return [];
    return sustainabilityData.data.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      value: item.energy
    }));
  }, [sustainabilityData]);
  
  const waterData = useMemo(() => {
    if (!sustainabilityData?.data) return [];
    return sustainabilityData.data.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      value: item.water
    }));
  }, [sustainabilityData]);
  
  const carbonData = useMemo(() => {
    if (!sustainabilityData?.data) return [];
    return sustainabilityData.data.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      value: item.carbon
    }));
  }, [sustainabilityData]);
  
  // Calculate total cycle count
  const cycleCount = useMemo(() => {
    if (!sustainabilityData?.data) return 0;
    return sustainabilityData.data.reduce((total, item) => total + item.cycles, 0);
  }, [sustainabilityData]);

  if (locationsLoading || alertsLoading || issuesLoading || metricsLoading || trendsLoading || isSustainabilityLoading || errorsLoading || auditOperationsLoading || coinVaultLoading || cycleUsageLoading || vendingLoading) {
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
              <TabsTrigger value="machine-errors">Machine Errors</TabsTrigger>
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
            <>
              <TabsTrigger value="audit-operations">Audit Operations</TabsTrigger>
              <TabsTrigger value="coin-vault">Coin Vault</TabsTrigger>
              <TabsTrigger value="cycle-usage">Cycle Usage</TabsTrigger>
              <TabsTrigger value="vending-data">Vending Data</TabsTrigger>
              <TabsTrigger value="exports">Data Exports</TabsTrigger>
            </>
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
                   <SearchableDropdown
                             className="w-[300px]" 
                             value={selectedLocation}
                             onChange={setSelectedLocation}
                             options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                          />
                  <MachineSelector
                    selectedMachine={selectedMachine}
                    onMachineChange={setSelectedMachine}
                    locationId={selectedLocation}
                  />
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

        {/* Machine Errors Tab */}
        <TabsContent value="machine-errors">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Machine Errors</CardTitle>
                <div className="flex items-center gap-4">
                  <SearchableDropdown
                    className="w-[300px]" 
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                  />
                  <MachineSelector
                    selectedMachine={selectedMachine}
                    onMachineChange={setSelectedMachine}
                    locationId={selectedLocation}
                  />
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={handleDateChange}
                  />
                  {hasPermission(['data_analyst', 'admin']) && (
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(machineErrors?.errors || [], 'machine-errors')}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {errorsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Error ID</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>Error Type</TableHead>
                      <TableHead>Error Name</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Error Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machineErrors?.errors?.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell className="font-medium">{error.id}</TableCell>
                        <TableCell>{error.machineId || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={error.errorType === 'CRITICAL' ? 'destructive' : 'secondary'}>
                            {error.errorType}
                          </Badge>
                        </TableCell>
                        <TableCell>{error.errorName}</TableCell>
                        <TableCell>{format(new Date(error.timestamp), 'MMM d, h:mm a')}</TableCell>
                        <TableCell>{error.errorCode || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                    {(!machineErrors?.errors || machineErrors.errors.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No machine errors found for the selected criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Error Trends Analysis</CardTitle>
                <div className="flex items-center gap-4">
                  <MachineSelector
                    selectedMachine={selectedMachine}
                    onMachineChange={setSelectedMachine}
                    locationId={selectedLocation}
                  />
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
                <div className="flex items-center gap-4">
                <SearchableDropdown
                             className="w-[300px]" 
                             value={selectedLocation}
                             onChange={setSelectedLocation}
                             options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                          />
                  <MachineSelector
                    selectedMachine={selectedMachine}
                    onMachineChange={setSelectedMachine}
                    locationId={selectedLocation}
                  />
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
                  <MachineSelector
                    selectedMachine={selectedMachine}
                    onMachineChange={setSelectedMachine}
                    locationId={selectedLocation}
                  />
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
                  <SearchableDropdown
                             className="w-[300px]" 
                             value={selectedLocation}
                             onChange={setSelectedLocation}
                             options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                          />
                    <MachineSelector
                      selectedMachine={selectedMachine}
                      onMachineChange={setSelectedMachine}
                      locationId={selectedLocation}
                    />
                    {hasPermission(['data_analyst', 'admin']) && (
                      <Button
                        variant="outline"
                        onClick={() => exportToCSV(sustainabilityData?.data || [], 'sustainability-metrics')}
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
                  <ConsumptionChart
                    data={energyData}
                    title="Energy Consumption"
                    unitLabel="kWh"
                    isLoading={isSustainabilityLoading}
                    error={sustainabilityError?.message || undefined}
                    type="energy"
                  />
                  <ConsumptionChart
                    data={waterData}
                    title="Water Consumption"
                    unitLabel="Gallons"
                    isLoading={isSustainabilityLoading}
                    error={sustainabilityError?.message || undefined}
                    type="water"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <CarbonFootprintChart
                    data={carbonData}
                    isLoading={isSustainabilityLoading}
                    error={sustainabilityError?.message || undefined}
                  />
                  <Card className="w-full h-80 shadow-md">
                    <CardHeader className="gradient-blue text-white border-b">
                      <CardTitle>Sustainability Metrics Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-1">Total Energy</h3>
                            <p className="text-2xl font-bold text-[#e95f2a]">
                              {isSustainabilityLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />
                              ) : (
                                energyData?.reduce((total, item) => total + item.value, 0)?.toLocaleString() || "0"
                              )} 
                              <span className="text-sm font-normal text-muted-foreground ml-1">kWh</span>
                            </p>
                          </div>
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-1">Total Water</h3>
                            <p className="text-2xl font-bold text-[#73a4b7]">
                              {isSustainabilityLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />
                              ) : (
                                waterData?.reduce((total, item) => total + item.value, 0)?.toLocaleString() || "0"
                              )}
                              <span className="text-sm font-normal text-muted-foreground ml-1">gallons</span>
                            </p>
                          </div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h3 className="text-lg font-medium mb-1">Carbon Footprint</h3>
                          <p className="text-2xl font-bold text-[#647991]">
                            {isSustainabilityLoading ? (
                              <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />
                            ) : (
                              carbonData?.reduce((total, item) => total + item.value, 0)?.toLocaleString() || "0"
                            )}
                            <span className="text-sm font-normal text-muted-foreground ml-1">kg CO₂e</span>
                          </p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h3 className="text-lg font-medium mb-1">Total Machine Cycles</h3>
                          <p className="text-2xl font-bold">
                            {isSustainabilityLoading ? (
                              <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />
                            ) : (
                              cycleCount?.toLocaleString() || "0"
                            )}
                            <span className="text-sm font-normal text-muted-foreground ml-1">cycles</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                    {sustainabilityData?.data && sustainabilityData.data.length > 0 ? (
                      sustainabilityData.data.map((item, index) => (
                        <TableRow key={`sustainability-${index}`}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell>{item.energy.toLocaleString()}</TableCell>
                          <TableCell>{item.water.toLocaleString()}</TableCell>
                          <TableCell>{item.carbon.toLocaleString()} kg CO₂e</TableCell>
                          <TableCell>{item.cycles}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No sustainability data available
                        </TableCell>
                      </TableRow>
                    )}
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
                  <SearchableDropdown
                             className="w-[300px]" 
                             value={selectedLocation}
                             onChange={setSelectedLocation}
                             options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                          />
                    <MachineSelector
                      selectedMachine={selectedMachine}
                      onMachineChange={setSelectedMachine}
                      locationId={selectedLocation}
                    />
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
                  <SearchableDropdown
                             className="w-[300px]" 
                             value={selectedLocation}
                             onChange={setSelectedLocation}
                             options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                          />
                    <MachineSelector
                      selectedMachine={selectedMachine}
                      onMachineChange={setSelectedMachine}
                      locationId={selectedLocation}
                    />
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
                        <SearchableDropdown
                             className="w-[300px]" 
                             value={selectedLocation}
                             onChange={setSelectedLocation}
                             options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                          />
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
                            onDateChange={handleDateChange}
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
                        <SearchableDropdown
                             className="w-[300px]" 
                             value={selectedLocation}
                             onChange={setSelectedLocation}
                             options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                          />
                        </div>
                        <Button className="w-full" onClick={() => exportToCSV(sustainabilityData?.data || [], 'sustainability-metrics')}>
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
                      onDateChange={handleDateChange}
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

        {/* Audit Operations Tab */}
        <TabsContent value="audit-operations">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Audit Operations</CardTitle>
                <div className="flex items-center gap-4">
                  <SearchableDropdown
                    className="w-[300px]" 
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                  />
                  <MachineSelector
                    selectedMachine={selectedMachine}
                    onMachineChange={setSelectedMachine}
                    locationId={selectedLocation}
                  />
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={handleDateChange}
                  />
                  {hasPermission(['data_analyst', 'admin']) && (
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(auditOperations?.operations || [], 'audit-operations')}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {auditOperationsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operation ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Auditor</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditOperations?.operations?.map((operation) => (
                      <TableRow key={operation.id}>
                        <TableCell className="font-medium">{operation.id}</TableCell>
                        <TableCell>{operation.locationId}</TableCell>
                        <TableCell>{operation.machineId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{operation.category}</Badge>
                        </TableCell>
                        <TableCell>{operation.operationType}</TableCell>
                        <TableCell>
                          <Badge variant={operation.operationStatus === 'COMPLETED' ? 'default' : 'secondary'}>
                            {operation.operationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{operation.auditorName}</TableCell>
                        <TableCell>{format(new Date(operation.startTime), 'MMM d, h:mm a')}</TableCell>
                      </TableRow>
                    ))}
                    {(!auditOperations?.operations || auditOperations.operations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No audit operations found for the selected criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coin Vault Tab */}
        <TabsContent value="coin-vault">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Coin Vault Data</CardTitle>
                <div className="flex items-center gap-4">
                  <SearchableDropdown
                    className="w-[300px]" 
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                  />
                  <MachineSelector
                    selectedMachine={selectedMachine}
                    onMachineChange={setSelectedMachine}
                    locationId={selectedLocation}
                  />
                  {hasPermission(['data_analyst', 'admin']) && (
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(coinVaultData?.vaults || [], 'coin-vault-data')}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {coinVaultLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vault ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>Machine Type</TableHead>
                      <TableHead>Vault Size</TableHead>
                      <TableHead>Capacity %</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coinVaultData?.vaults?.map((vault) => (
                      <TableRow key={vault.id}>
                        <TableCell className="font-medium">{vault.id}</TableCell>
                        <TableCell>{vault.locationName}</TableCell>
                        <TableCell>{vault.machineName}</TableCell>
                        <TableCell>{vault.machineTypeName}</TableCell>
                        <TableCell>{vault.vaultSize}</TableCell>
                        <TableCell>
                          <Badge variant={parseInt(vault.percentCapacity) > 80 ? 'destructive' : 'default'}>
                            {vault.percentCapacity}%
                          </Badge>
                        </TableCell>
                        <TableCell>${vault.totalValue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {(!coinVaultData?.vaults || coinVaultData.vaults.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No coin vault data found for the selected criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cycle Usage Tab */}
        <TabsContent value="cycle-usage">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Cycle Usage Analytics</CardTitle>
                <div className="flex items-center gap-4">
                  <SearchableDropdown
                    className="w-[300px]" 
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                  />
                  <MachineSelector
                    selectedMachine={selectedMachine}
                    onMachineChange={setSelectedMachine}
                    locationId={selectedLocation}
                  />
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={handleDateChange}
                  />
                  {hasPermission(['data_analyst', 'admin']) && (
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(cycleUsageData?.usage || [], 'cycle-usage-data')}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cycleUsageLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usage ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Total Cycles</TableHead>
                      <TableHead>Energy (kWh)</TableHead>
                      <TableHead>Water (Gal)</TableHead>
                      <TableHead>Efficiency %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cycleUsageData?.usage?.map((usage) => (
                      <TableRow key={usage.id}>
                        <TableCell className="font-medium">{usage.id}</TableCell>
                        <TableCell>{usage.locationId}</TableCell>
                        <TableCell>{usage.machineId}</TableCell>
                        <TableCell>{usage.reportId}</TableCell>
                        <TableCell>{usage.totalCycles}</TableCell>
                        <TableCell>{usage.energyConsumption.toFixed(2)}</TableCell>
                        <TableCell>{usage.waterConsumption.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={usage.efficiency > 80 ? 'default' : usage.efficiency > 60 ? 'secondary' : 'destructive'}>
                            {usage.efficiency.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!cycleUsageData?.usage || cycleUsageData.usage.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No cycle usage data found for the selected criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vending Data Tab */}
        <TabsContent value="vending-data">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Total Vending Analytics</CardTitle>
                <div className="flex items-center gap-4">
                  <SearchableDropdown
                    className="w-[300px]" 
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                  />
                  <MachineSelector
                    selectedMachine={selectedMachine}
                    onMachineChange={setSelectedMachine}
                    locationId={selectedLocation}
                  />
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={handleDateChange}
                  />
                  {hasPermission(['data_analyst', 'admin']) && (
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(vendingData?.vending || [], 'vending-data')}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {vendingLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vending ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>Total Vended</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Avg per Transaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendingData?.vending?.map((vending) => (
                      <TableRow key={vending.id}>
                        <TableCell className="font-medium">{vending.id}</TableCell>
                        <TableCell>{vending.locationId}</TableCell>
                        <TableCell>{vending.machineId}</TableCell>
                        <TableCell>{vending.totalVended}</TableCell>
                        <TableCell>${vending.revenue.toFixed(2)}</TableCell>
                        <TableCell>{vending.transactions}</TableCell>
                        <TableCell>
                          ${vending.transactions > 0 ? (vending.revenue / vending.transactions).toFixed(2) : '0.00'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!vendingData?.vending || vendingData.vending.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No vending data found for the selected criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}