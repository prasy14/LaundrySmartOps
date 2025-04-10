import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { CheckCircle, XCircle, AlertCircle, Activity } from "lucide-react";
import { format } from 'date-fns';
import { EmailScheduleDialog } from './EmailScheduleDialog';

interface ApiMonitoringProps {
  dateRange: DateRange;
  onDateChange: (range: DateRange) => void;
  hasPermission: (roles: string[]) => boolean;
}

export function ApiMonitoring({ dateRange, onDateChange, hasPermission }: ApiMonitoringProps) {
  // Fetch API usage data
  const { data: apiUsageData, isLoading: isLoadingApiUsage } = useQuery({
    queryKey: ['/api/reports/api-usage', dateRange],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return null;
      const formattedFrom = format(dateRange.from, 'yyyy-MM-dd');
      const formattedTo = format(dateRange.to, 'yyyy-MM-dd');
      const response = await fetch(`/api/reports/api-usage?fromDate=${formattedFrom}&toDate=${formattedTo}`);
      if (!response.ok) throw new Error('Failed to fetch API usage data');
      return response.json();
    },
    enabled: !!(dateRange.from && dateRange.to),
  });

  // Fetch SLA compliance data
  const { data: slaData, isLoading: isLoadingSla } = useQuery({
    queryKey: ['/api/reports/sla-compliance', dateRange],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return null;
      const formattedFrom = format(dateRange.from, 'yyyy-MM-dd');
      const formattedTo = format(dateRange.to, 'yyyy-MM-dd');
      const response = await fetch(`/api/reports/sla-compliance?fromDate=${formattedFrom}&toDate=${formattedTo}`);
      if (!response.ok) throw new Error('Failed to fetch SLA compliance data');
      return response.json();
    },
    enabled: !!(dateRange.from && dateRange.to),
  });

  // Manager or compliance officer roles who need these reports
  const canScheduleReports = hasPermission(['compliance_officer', 'it_manager', 'admin']);

  // Create recipient options for compliance team
  const recipientOptions = [
    { label: 'IT Support Team', value: 'it-support@automaticlaundry.com' },
    { label: 'Compliance Officer', value: 'compliance@automaticlaundry.com' },
    { label: 'System Administrator', value: 'sysadmin@automaticlaundry.com' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">API & System Monitoring</h2>
        <div className="flex items-center gap-4">
          <DateRangePicker
            date={dateRange}
            onDateChange={onDateChange}
          />
          {canScheduleReports && (
            <EmailScheduleDialog
              reportType="compliance"
              reportTitle="API & SLA Compliance Report"
              recipientOptions={recipientOptions}
              triggerButtonLabel="Schedule Compliance Report"
            >
              <Badge className="cursor-pointer" variant="outline">
                Schedule Automated Report
              </Badge>
            </EmailScheduleDialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="api-usage">
        <TabsList>
          <TabsTrigger value="api-usage">API Usage</TabsTrigger>
          <TabsTrigger value="sla-compliance">SLA Compliance</TabsTrigger>
          <TabsTrigger value="system-health">System Health</TabsTrigger>
        </TabsList>

        {/* API Usage Tab */}
        <TabsContent value="api-usage">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Total API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingApiUsage ? 
                    'Loading...' : 
                    apiUsageData?.totalCalls?.toLocaleString() || '0'}
                </div>
                <p className="text-muted-foreground text-sm">
                  {dateRange.from && dateRange.to ? 
                    `From ${format(dateRange.from, 'MMM d')} to ${format(dateRange.to, 'MMM d, yyyy')}` : 
                    'Select a date range'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingApiUsage ? 
                    'Loading...' : 
                    `${(apiUsageData?.successRate || 0).toFixed(2)}%`}
                </div>
                <Progress 
                  value={apiUsageData?.successRate || 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Avg. Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingApiUsage ? 
                    'Loading...' : 
                    `${(apiUsageData?.avgResponseTime || 0).toFixed(2)}ms`}
                </div>
                <p className="text-muted-foreground text-sm">
                  Target: &lt;200ms
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>API Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoadingApiUsage ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading API usage data...</p>
                  </div>
                ) : apiUsageData?.usageOverTime ? (
                  <ResponsiveLine
                    data={[
                      {
                        id: 'API Calls',
                        data: apiUsageData.usageOverTime.map((point: any) => ({
                          x: point.date,
                          y: point.count
                        }))
                      }
                    ]}
                    margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
                    curve="monotoneX"
                    axisLeft={{
                      legend: 'API Calls',
                      legendOffset: -50,
                      legendPosition: 'middle'
                    }}
                    axisBottom={{
                      legend: 'Date',
                      legendOffset: 36,
                      legendPosition: 'middle'
                    }}
                    colors={['#73a4b7']}
                    pointSize={8}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    enablePointLabel={false}
                    enableArea={true}
                    areaOpacity={0.15}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No API usage data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Calls by Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoadingApiUsage ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading endpoint data...</p>
                  </div>
                ) : apiUsageData?.endpointBreakdown ? (
                  <ResponsiveBar
                    data={apiUsageData.endpointBreakdown.map((item: any) => ({
                      endpoint: item.endpoint,
                      calls: item.count
                    }))}
                    keys={['calls']}
                    indexBy="endpoint"
                    margin={{ top: 20, right: 20, bottom: 70, left: 60 }}
                    padding={0.3}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={['#73a4b7']}
                    axisLeft={{
                      legend: 'API Calls',
                      legendPosition: 'middle',
                      legendOffset: -40
                    }}
                    axisBottom={{
                      legend: 'Endpoint',
                      legendPosition: 'middle',
                      legendOffset: 40,
                      tickRotation: -45
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No endpoint data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Compliance Tab */}
        <TabsContent value="sla-compliance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Overall SLA Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingSla ? 
                    'Loading...' : 
                    `${(slaData?.overallCompliance || 0).toFixed(2)}%`}
                </div>
                <Progress 
                  value={slaData?.overallCompliance || 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingSla ? 
                    'Loading...' : 
                    `${(slaData?.uptime || 0).toFixed(3)}%`}
                </div>
                <p className="text-muted-foreground text-sm">
                  Target: 99.9%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">SLA Breaches</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">
                  {isLoadingSla ? 
                    'Loading...' : 
                    slaData?.breachCount || 0}
                </div>
                {slaData?.breachCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute top-0 right-4"
                  >
                    Needs Attention
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>SLA Compliance by Service</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Avg. Response</TableHead>
                    <TableHead>Incidents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSla ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading SLA data...
                      </TableCell>
                    </TableRow>
                  ) : slaData?.serviceCompliance && slaData.serviceCompliance.length > 0 ? (
                    slaData.serviceCompliance.map((service: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          {service.status === 'healthy' ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              <span>Healthy</span>
                            </div>
                          ) : service.status === 'degraded' ? (
                            <div className="flex items-center">
                              <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                              <span>Degraded</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 text-red-500 mr-1" />
                              <span>Outage</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{service.compliance.toFixed(2)}%</span>
                            <Progress value={service.compliance} className="w-20" />
                          </div>
                        </TableCell>
                        <TableCell>{service.responseTime}ms</TableCell>
                        <TableCell>{service.incidents}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No SLA data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system-health">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>System Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      CPU Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">42.3%</div>
                    <Progress value={42.3} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Memory Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">68.7%</div>
                    <Progress value={68.7} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Database Load
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">31.5%</div>
                    <Progress value={31.5} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Network Throughput
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">
                      <Activity className="h-6 w-6 inline-block mr-1 text-blue-500" />
                      4.3 MB/s
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{format(new Date(), 'MMM d, yyyy HH:mm:ss')}</TableCell>
                    <TableCell>Auto-scaling</TableCell>
                    <TableCell>Web Server</TableCell>
                    <TableCell>Scaled up instance count to handle increased load</TableCell>
                    <TableCell>
                      <Badge variant="outline">Info</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{format(new Date(Date.now() - 3600000), 'MMM d, yyyy HH:mm:ss')}</TableCell>
                    <TableCell>Database</TableCell>
                    <TableCell>PostgreSQL</TableCell>
                    <TableCell>Backup completed successfully</TableCell>
                    <TableCell>
                      <Badge variant="outline">Info</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{format(new Date(Date.now() - 7200000), 'MMM d, yyyy HH:mm:ss')}</TableCell>
                    <TableCell>Security</TableCell>
                    <TableCell>Auth Service</TableCell>
                    <TableCell>Multiple failed login attempts detected</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Warning</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}