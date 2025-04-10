import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { format } from 'date-fns';
import { EmailScheduleDialog } from './EmailScheduleDialog';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface ExecutiveSummaryProps {
  dateRange: DateRange;
  onDateChange: (range: DateRange) => void;
  hasPermission: (roles: string[]) => boolean;
}

export function ExecutiveSummary({ dateRange, onDateChange, hasPermission }: ExecutiveSummaryProps) {
  // Fetch KPI data
  const { data: kpiData, isLoading: isLoadingKpi } = useQuery({
    queryKey: ['/api/reports/executive-kpi', dateRange],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return null;
      const formattedFrom = format(dateRange.from, 'yyyy-MM-dd');
      const formattedTo = format(dateRange.to, 'yyyy-MM-dd');
      const response = await fetch(`/api/reports/executive-kpi?fromDate=${formattedFrom}&toDate=${formattedTo}`);
      if (!response.ok) throw new Error('Failed to fetch KPI data');
      return response.json();
    },
    enabled: !!(dateRange.from && dateRange.to),
  });

  // Has permission to schedule executive reports
  const canScheduleReports = hasPermission(['executive', 'senior_executive', 'admin']);

  // Create recipient options for executives
  const recipientOptions = [
    { label: 'CEO', value: 'ceo@automaticlaundry.com' },
    { label: 'CFO', value: 'cfo@automaticlaundry.com' },
    { label: 'COO', value: 'coo@automaticlaundry.com' },
    { label: 'VP of Operations', value: 'vp-operations@automaticlaundry.com' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Executive Performance Dashboard</h2>
        <div className="flex items-center gap-4">
          <DateRangePicker
            date={dateRange}
            onDateChange={onDateChange}
          />
          {canScheduleReports && (
            <EmailScheduleDialog
              reportType="executive"
              reportTitle="Executive Summary Report"
              recipientOptions={recipientOptions}
              triggerButtonLabel="Schedule Executive Report"
            >
              <Badge className="cursor-pointer" variant="outline">
                Schedule Monthly Report
              </Badge>
            </EmailScheduleDialog>
          )}
        </div>
      </div>

      {isLoadingKpi ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading executive data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Machine Uptime</CardTitle>
                <CardDescription>Fleet-wide availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(kpiData?.uptimePercentage || 0).toFixed(2)}%</div>
                <Progress value={kpiData?.uptimePercentage || 0} className="mt-2" />
                <div className="flex items-center mt-2 text-sm">
                  {(kpiData?.uptimeTrend || 0) > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">+{kpiData?.uptimeTrend}% from previous period</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">{kpiData?.uptimeTrend}% from previous period</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Revenue per Machine</CardTitle>
                <CardDescription>Average daily revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${kpiData?.revenuePerMachine || 0}</div>
                <div className="flex items-center mt-2 text-sm">
                  {(kpiData?.revenueTrend || 0) > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">+{kpiData?.revenueTrend}% from previous period</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">{kpiData?.revenueTrend}% from previous period</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Service Response</CardTitle>
                <CardDescription>Average response time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpiData?.avgResponseTime || 0} hrs</div>
                <div className="flex items-center mt-2 text-sm">
                  {(kpiData?.responseTrend || 0) < 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">{kpiData?.responseTrend}% faster response</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">+{kpiData?.responseTrend}% slower response</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Daily Cycles</CardTitle>
                <CardDescription>Avg. cycles per machine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpiData?.avgCyclesPerDay || 0}</div>
                <div className="flex items-center mt-2 text-sm">
                  {(kpiData?.cycleTrend || 0) > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">+{kpiData?.cycleTrend}% from previous period</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">{kpiData?.cycleTrend}% from previous period</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="performance">
            <TabsList>
              <TabsTrigger value="performance">Performance Trends</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
              <TabsTrigger value="service">Service Efficiency</TabsTrigger>
            </TabsList>

            {/* Performance Trends Tab */}
            <TabsContent value="performance">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Machine Utilization Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {kpiData?.utilizationTrend ? (
                      <ResponsiveLine
                        data={[
                          {
                            id: 'utilization',
                            data: kpiData.utilizationTrend.map((point: any) => ({
                              x: point.date,
                              y: point.value
                            }))
                          }
                        ]}
                        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                        xScale={{ type: 'point' }}
                        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                        curve="monotoneX"
                        axisLeft={{
                          legend: 'Utilization (%)',
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
                        <p className="text-muted-foreground">No utilization data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Machine Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {kpiData?.statusDistribution ? (
                      <ResponsivePie
                        data={kpiData.statusDistribution.map((item: any) => ({
                          id: item.status,
                          label: item.status,
                          value: item.count,
                          color: item.status === 'AVAILABLE' ? '#73a4b7' : 
                                item.status === 'IN_USE' ? '#647991' :
                                item.status === 'MAINTENANCE_REQUIRED' ? '#e95f2a' :
                                '#2f3944'
                        }))}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ datum: 'data.color' }}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: 'color' }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                        legends={[
                          {
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 56,
                            itemsSpacing: 0,
                            itemWidth: 100,
                            itemHeight: 18,
                            itemTextColor: '#999',
                            itemDirection: 'left-to-right',
                            itemOpacity: 1,
                            symbolSize: 18,
                            symbolShape: 'circle',
                          }
                        ]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No status distribution data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Revenue Analysis Tab */}
            <TabsContent value="revenue">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Revenue By Location</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {kpiData?.revenueByLocation ? (
                      <ResponsivePie
                        data={kpiData.revenueByLocation.map((item: any) => ({
                          id: item.location,
                          label: item.location,
                          value: item.revenue
                        }))}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: 'blues' }}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: 'color' }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                        valueFormat={(value) => `$${value}`}
                        legends={[
                          {
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 56,
                            itemsSpacing: 0,
                            itemWidth: 100,
                            itemHeight: 18,
                            itemTextColor: '#999',
                            itemDirection: 'left-to-right',
                            itemOpacity: 1,
                            symbolSize: 18,
                            symbolShape: 'circle',
                          }
                        ]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No revenue data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {kpiData?.revenueTrend ? (
                      <ResponsiveLine
                        data={[
                          {
                            id: 'revenue',
                            data: kpiData.revenueTrend.map((point: any) => ({
                              x: point.date,
                              y: point.value
                            }))
                          }
                        ]}
                        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                        xScale={{ type: 'point' }}
                        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                        curve="monotoneX"
                        axisLeft={{
                          legend: 'Revenue ($)',
                          legendOffset: -50,
                          legendPosition: 'middle',
                          format: (value) => `$${value}`
                        }}
                        axisBottom={{
                          legend: 'Date',
                          legendOffset: 36,
                          legendPosition: 'middle'
                        }}
                        colors={['#e95f2a']}
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
                        <p className="text-muted-foreground">No revenue trend data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Service Efficiency Tab */}
            <TabsContent value="service">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Service Response Time</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {kpiData?.serviceResponseTrend ? (
                      <ResponsiveLine
                        data={[
                          {
                            id: 'response',
                            data: kpiData.serviceResponseTrend.map((point: any) => ({
                              x: point.date,
                              y: point.value
                            }))
                          }
                        ]}
                        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                        xScale={{ type: 'point' }}
                        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                        curve="monotoneX"
                        axisLeft={{
                          legend: 'Hours',
                          legendOffset: -50,
                          legendPosition: 'middle'
                        }}
                        axisBottom={{
                          legend: 'Date',
                          legendOffset: 36,
                          legendPosition: 'middle'
                        }}
                        colors={['#647991']}
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
                        <p className="text-muted-foreground">No service response data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Maintenance Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {kpiData?.maintenanceEfficiency ? (
                      <ResponsiveLine
                        data={[
                          {
                            id: 'firstTimeFixRate',
                            name: 'First Time Fix Rate',
                            data: kpiData.maintenanceEfficiency.firstTimeFixRate.map((point: any) => ({
                              x: point.date,
                              y: point.value
                            }))
                          },
                          {
                            id: 'avgRepairTime',
                            name: 'Avg Repair Time (hrs)',
                            data: kpiData.maintenanceEfficiency.avgRepairTime.map((point: any) => ({
                              x: point.date,
                              y: point.value
                            }))
                          }
                        ]}
                        margin={{ top: 20, right: 60, bottom: 50, left: 60 }}
                        xScale={{ type: 'point' }}
                        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
                        curve="monotoneX"
                        axisLeft={{
                          legend: 'First Time Fix (%)',
                          legendOffset: -50,
                          legendPosition: 'middle'
                        }}
                        axisRight={{
                          legend: 'Repair Time (hrs)',
                          legendOffset: 50,
                          legendPosition: 'middle'
                        }}
                        axisBottom={{
                          legend: 'Date',
                          legendOffset: 36,
                          legendPosition: 'middle'
                        }}
                        colors={['#73a4b7', '#e95f2a']}
                        pointSize={8}
                        pointColor={{ theme: 'background' }}
                        pointBorderWidth={2}
                        pointBorderColor={{ from: 'serieColor' }}
                        useMesh={true}
                        legends={[
                          {
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 56,
                            itemsSpacing: 0,
                            itemDirection: 'left-to-right',
                            itemWidth: 160,
                            itemHeight: 20,
                            itemOpacity: 0.75,
                            symbolSize: 12,
                            symbolShape: 'circle',
                            symbolBorderColor: 'rgba(0, 0, 0, .5)',
                          }
                        ]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No maintenance efficiency data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}