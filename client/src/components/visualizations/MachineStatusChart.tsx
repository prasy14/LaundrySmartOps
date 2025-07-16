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
import { AlertTriangle, Loader2 } from "lucide-react";
import SearchableDropdown from "@/pages/SearchableDropdown";
import { CampusLocationFilters } from "@/components/CampusLocationFilters";
import { useCampusLocation } from "@/components/CampusLocationcontext";
import { extractCampusAndLocation } from "@/utils/helpers";

interface MachineStatusChartProps {
  machines: Machine[] | null | undefined;
  locations?: Location[];
  isLoading?: boolean;
  error?: string;
  selectedMachineId?: string; // Add support for selected machine
}

// Status names to display-friendly labels mapping
const STATUS_LABELS: Record<string, string> = {
  'AVAILABLE': 'Available',
  'IN_USE': 'In Use',
  'MAINTENANCE_REQUIRED': 'Needs Maintenance',
  'OFFLINE': 'Offline',
  'ERROR': 'Error',
  'UNKNOWN': 'Unknown'
};

export function MachineStatusChart({ 
  machines = [], 
  locations = [], 
  isLoading = false,
  error = '',
  selectedMachineId = 'all'
}: MachineStatusChartProps) {
 // const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([]);
  const [chartData, setChartData] = useState<Array<{id: string, label: string, value: number, color: string}>>([]);
  const {selectedCampus,selectedLocation,} = useCampusLocation();

  
  // Ensure machines is an array
  const safetyMachines = Array.isArray(machines) ? machines : [];
  
  // Filter machines when location selection or selected machine changes
  useEffect(() => {
    try {
      let filtered = [...safetyMachines];
      
      
    // Filter by selected campus (based on location name)
    if (selectedCampus !== "all") {
      const locationIds = locations
        .filter(loc => extractCampusAndLocation(loc.name).campus === selectedCampus)
        .map(loc => loc.id);
      filtered = filtered.filter(m => m.locationId != null && locationIds.includes(m.locationId));

    }

    // Filter by selected location
      if (selectedLocation !== "all") {
        const locationId = parseInt(selectedLocation, 10);
       filtered = filtered.filter(m => m.locationId === locationId);
      }
      
       // Filter by specific machine
    if (selectedMachineId !== "all") {
        const machineId = parseInt(selectedMachineId, 10);
        filtered = filtered.filter(m => m.id === machineId);
      }
      
      setFilteredMachines(filtered);
    } catch (err) {
      console.error("Error filtering machines:", err);
      setFilteredMachines([]);
    }
}, [selectedCampus, selectedLocation, selectedMachineId, safetyMachines]);
  
  // Calculate status distribution
  useEffect(() => {
    try {
      if (filteredMachines.length === 0) {
        setChartData([]);
        return;
      }
      
      // Calculate status counts
      const statusCounts = filteredMachines.reduce((acc, machine) => {
        let status = 'UNKNOWN';
        
        try {
          if (machine && machine.status) {
            if (typeof machine.status === 'object' && machine.status !== null) {
              // Handle status as object with statusId
              status = machine.status.statusId || 'UNKNOWN';
            } else if (typeof machine.status === 'string') {
              // Handle status as string
              status = machine.status;
            }
          }
        } catch (err) {
          console.error("Error extracting machine status:", err);
        }
        
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Transform data for pie chart
      const data = Object.entries(statusCounts).map(([status, value]) => ({
        id: status,
        label: STATUS_LABELS[status] || status, // Use friendly label if available
        value,
        color: status === 'AVAILABLE' ? '#73a4b7' : 
              status === 'IN_USE' ? '#647991' :
              status === 'MAINTENANCE_REQUIRED' ? '#e95f2a' :
              status === 'OFFLINE' ? '#8d4444' :
              status === 'ERROR' ? '#c14444' :
              '#2f3944'
      }));
      
      setChartData(data);
    } catch (err) {
      console.error("Error calculating machine status distribution:", err);
      setChartData([]);
    }
  }, [filteredMachines]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle className="text-xl">Machine Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex justify-center items-center" style={{ height: '300px' }}>
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !safetyMachines || safetyMachines.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle className="text-xl">Machine Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col justify-center items-center" style={{ height: '300px' }}>
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-2" />
          <p className="text-muted-foreground text-center">
            {error || "No machine data available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="gradient-blue text-white border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Machine Status Distribution</CardTitle>
            <p className="text-white/80 text-sm">Current machine operational states</p>
          </div>
           {locations && locations.length > 0 && (
  <CampusLocationFilters locations={locations} />
)}
</div>
      </CardHeader>
      <CardContent className="pt-6">
        {chartData.length > 0 ? (
          <div style={{ height: '300px' }}>
            <ResponsivePie
              data={chartData}
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
        ) : (
          <div className="flex justify-center items-center" style={{ height: '300px' }}>
            <p className="text-muted-foreground">No status data available for the selected location</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
