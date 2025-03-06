import { Header } from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import type { Alert, Location, Machine } from "@shared/schema";

export default function Reports() {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");

  // Fetch data
  const { data: locationsData } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });

  const { data: serviceAlerts } = useQuery<{ alerts: Alert[] }>({
    queryKey: ['/api/reports/service-alerts', selectedLocation],
  });

  const { data: serviceIssues } = useQuery<{ alerts: Alert[] }>({
    queryKey: ['/api/reports/service-issues', selectedServiceType],
  });

  const { data: performanceMetrics } = useQuery<{
    machines: Array<{
      id: number;
      name: string;
      uptime: number;
      totalRuntime: number;
      efficiency: number;
    }>;
    averageUptime: number;
  }>({
    queryKey: ['/api/reports/performance-metrics'],
  });

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    // Implementation of CSV export
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
      </div>

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">Service Alerts</TabsTrigger>
          <TabsTrigger value="issues">Service Issues</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
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
                  {serviceAlerts?.alerts.map((alert) => (
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
                  {serviceIssues?.alerts.map((issue) => (
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
              <div className="mb-4">
                <p className="text-lg font-semibold">
                  Average System Uptime: {performanceMetrics?.averageUptime.toFixed(1)}%
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Uptime %</TableHead>
                    <TableHead>Total Runtime (hrs)</TableHead>
                    <TableHead>Efficiency Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceMetrics?.machines.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell>{machine.name}</TableCell>
                      <TableCell>{machine.uptime.toFixed(1)}%</TableCell>
                      <TableCell>{(machine.totalRuntime / 3600).toFixed(1)}</TableCell>
                      <TableCell>{machine.efficiency.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}