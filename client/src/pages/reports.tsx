import { Header } from "@/components/layout/Header";
import { KPICards } from "@/components/reports/KPICards";
import { PerformanceChart } from "@/components/reports/PerformanceChart";
import { UsageHeatmap } from "@/components/reports/UsageHeatmap";
import { AdvancedKPICharts } from "@/components/reports/AdvancedKPICharts";
import { ExportableReport, exportToCsv } from "@/components/reports/ExportableReport";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  // Fetch report data
  const { data: usageData } = useQuery({
    queryKey: ['/api/reports/machine-usage'],
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ['/api/reports/maintenance'],
  });

  const { data: uptimeData } = useQuery({
    queryKey: ['/api/reports/machine-uptime'],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>

        <KPICards />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <PerformanceChart />
        </div>

        <UsageHeatmap />

        <AdvancedKPICharts />

        {/* Machine Usage Report */}
        <ExportableReport 
          title="Machine Usage Report"
          onExport={() => usageData?.data && exportToCsv(usageData.data, 'machine-usage')}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Cycles</TableHead>
                  <TableHead>Uptime %</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData?.data.map((row: any) => (
                  <TableRow key={row.name}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.location}</TableCell>
                    <TableCell>{row.cycles}</TableCell>
                    <TableCell>{row.uptime.toFixed(1)}%</TableCell>
                    <TableCell>{row.errors}</TableCell>
                    <TableCell>
                      {row.lastPing ? format(new Date(row.lastPing), 'MMM d, h:mm a') : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ExportableReport>

        {/* Maintenance Report */}
        <ExportableReport 
          title="Maintenance Report"
          onExport={() => maintenanceData?.data && exportToCsv(maintenanceData.data, 'maintenance')}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Resolved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceData?.data.map((row: any) => (
                  <TableRow key={`${row.machineId}-${row.createdAt}`}>
                    <TableCell>{row.machineName}</TableCell>
                    <TableCell>{row.location}</TableCell>
                    <TableCell>{row.issue}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'active' ? 'destructive' : 'default'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        row.priority === 'high' ? 'destructive' :
                        row.priority === 'medium' ? 'default' : 'outline'
                      }>
                        {row.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(row.createdAt), 'MMM d, h:mm a')}</TableCell>
                    <TableCell>
                      {row.resolvedAt ? format(new Date(row.resolvedAt), 'MMM d, h:mm a') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ExportableReport>

        {/* Machine Uptime Report */}
        <ExportableReport 
          title="Machine Uptime Report"
          onExport={() => uptimeData?.data && exportToCsv(uptimeData.data, 'machine-uptime')}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uptime %</TableHead>
                  <TableHead>Total Cycles</TableHead>
                  <TableHead>Last Ping</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uptimeData?.data.map((row: any) => (
                  <TableRow key={row.name}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.location}</TableCell>
                    <TableCell>
                      <Badge variant={
                        row.status === 'online' ? 'default' :
                        row.status === 'offline' ? 'destructive' : 'outline'
                      }>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.uptime.toFixed(1)}%</TableCell>
                    <TableCell>{row.totalCycles}</TableCell>
                    <TableCell>
                      {row.lastPing ? format(new Date(row.lastPing), 'MMM d, h:mm a') : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ExportableReport>
      </main>
    </div>
  );
}