import { ResponsivePie } from "@nivo/pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Machine, Location } from "@shared/schema";
import { useState, useEffect } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MachineStatusChartProps {
  machines: Machine[];
  locations?: Location[];
}

export function MachineStatusChart({ machines, locations }: MachineStatusChartProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [filteredMachines, setFilteredMachines] = useState(machines);
  
  useEffect(() => {
    if (selectedLocation === "all") {
      setFilteredMachines(machines);
    } else {
      const locationId = parseInt(selectedLocation, 10);
      setFilteredMachines(machines.filter(machine => machine.locationId === locationId));
    }
  }, [selectedLocation, machines]);
  
  // Calculate status counts
  const statusCounts = filteredMachines.reduce((acc, machine) => {
    const status = machine.status?.statusId || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Transform data for pie chart
  const data = Object.entries(statusCounts).map(([status, value]) => ({
    id: status,
    label: status,
    value,
    color: status === 'AVAILABLE' ? '#73a4b7' : 
           status === 'IN_USE' ? '#647991' :
           status === 'MAINTENANCE_REQUIRED' ? '#e95f2a' :
           '#2f3944'
  }));

  return (
    <Card className="shadow-md">
      <CardHeader className="gradient-blue text-white border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Machine Status Distribution</CardTitle>
            <p className="text-white/80 text-sm">Current machine operational states</p>
          </div>
          {locations && locations.length > 0 && (
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div style={{ height: '300px' }}>
          <ResponsivePie
            data={data}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            borderWidth={1}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 0.2]]
            }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#888888"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{
              from: 'color',
              modifiers: [['darker', 2]]
            }}
            colors={{ datum: 'data.color' }}
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
                symbolShape: 'circle'
              }
            ]}
          />
        </div>
      </CardContent>
    </Card>
  );
}
