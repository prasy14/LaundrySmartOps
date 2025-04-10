import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsivePie } from "@nivo/pie";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SLAData {
  machineGroup: string;
  uptime: number;
  threshold: number;
  status: 'compliant' | 'at-risk' | 'non-compliant';
}

interface SLAComplianceChartProps {
  data?: SLAData[];
  title?: string;
  isLoading?: boolean;
}

export function SLAComplianceChart({
  data = [],
  title = "SLA Compliance by Machine Group",
  isLoading = false
}: SLAComplianceChartProps) {
  // Format data for pie chart
  const pieData = [
    {
      id: "Compliant",
      label: "Compliant",
      value: data.filter(item => item.status === 'compliant').length,
      color: "#10b981"
    },
    {
      id: "At Risk",
      label: "At Risk",
      value: data.filter(item => item.status === 'at-risk').length,
      color: "#f59e0b"
    },
    {
      id: "Non-Compliant",
      label: "Non-Compliant",
      value: data.filter(item => item.status === 'non-compliant').length,
      color: "#ef4444"
    }
  ];

  // Get non-compliant machines for the table
  const nonCompliantMachines = data
    .filter(item => item.status === 'non-compliant' || item.status === 'at-risk')
    .sort((a, b) => a.uptime - b.uptime); // Sort by uptime (lowest first)

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No SLA data available</p>
        </CardContent>
      </Card>
    );
  }

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'at-risk':
        return 'default';
      case 'non-compliant':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsivePie
              data={pieData}
              margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ scheme: 'set3' }}
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
                  translateY: 20,
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
          </div>
          <div className="h-64 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine Group</TableHead>
                  <TableHead>Uptime %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonCompliantMachines.map((machine, index) => (
                  <TableRow key={index}>
                    <TableCell>{machine.machineGroup}</TableCell>
                    <TableCell>{machine.uptime.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(machine.status)}>
                        {machine.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {nonCompliantMachines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                      All machine groups are compliant
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}