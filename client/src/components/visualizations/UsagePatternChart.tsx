import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import cell type for tooltip
// We won't use DefaultHeatMapDatum as it's not generic

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => 
  i < 12 
    ? `${i === 0 ? 12 : i}am` 
    : `${i === 12 ? 12 : i - 12}pm`
);

// Define the data structure for time-based usage
interface UsageDataPoint {
  hour: number;
  day: string;
  value: number;
  location?: string;
}

interface UsageApiResponse {
  usageData: UsageDataPoint[];
  locations: string[];
}

// Define types for Nivo heatmap
interface HeatMapDatum {
  x: string;
  y: number;
}

interface HeatMapSerie {
  id: string;
  data: HeatMapDatum[];
}

// Separate interface for the _count property
interface CountMap {
  [timeSlot: string]: number;
}

// Type that combines string-indexed values with the special _count property
type HeatmapDataDay = Record<string, number> & {
  _count?: CountMap;
}

interface HeatmapData {
  [day: string]: HeatmapDataDay;
}

export function UsagePatternChart() {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  
  // Fetch the usage data from API
  const { data, isLoading, error } = useQuery<UsageApiResponse>({
    queryKey: ['/api/reports/usage-patterns'],
  });
  
  // Process the data for visualization
  const getChartData = (): HeatMapSerie[] => {
    if (!data || !data.usageData || !data.usageData.length) {
      return [];
    }
    
    try {
      let filteredData = [...data.usageData]; // Create a copy to avoid mutation
      
      // Filter by location if not "all"
      if (selectedLocation !== "all") {
        filteredData = filteredData.filter(d => d.location === selectedLocation);
      }
      
      // If no data after filtering, return empty array
      if (filteredData.length === 0) {
        return [];
      }
      
      // Create a simple object for lookup
      const heatmapData: HeatmapData = {};
      
      // Initialize days
      DAYS_OF_WEEK.forEach(day => {
        heatmapData[day] = {} as HeatmapDataDay;
        // Initialize hours with 0
        TIME_SLOTS.forEach((slot) => {
          heatmapData[day][slot] = 0;
        });
      });
      
      // Populate with actual data
      filteredData.forEach(item => {
        if (item.day && DAYS_OF_WEEK.includes(item.day) && 
            item.hour >= 0 && item.hour < TIME_SLOTS.length) {
          const timeSlot = TIME_SLOTS[item.hour];
          if (heatmapData[item.day] && timeSlot) {
            if (selectedLocation === "all") {
              // For "all" locations, average the values
              const currentCount = heatmapData[item.day]._count?.[timeSlot] || 0;
              const currentValue = heatmapData[item.day][timeSlot] || 0;
              
              // Store count in a special _count property
              // First create the _count object if it doesn't exist
              if (!heatmapData[item.day]._count) {
                heatmapData[item.day]._count = {} as CountMap;
              }
              
              // At this point we can be certain that _count exists
              const countMap = heatmapData[item.day]._count!;
              countMap[timeSlot] = currentCount + 1;
              
              // Sum up values for later averaging
              heatmapData[item.day][timeSlot] = currentValue + item.value;
            } else {
              // For specific location, just use the value
              heatmapData[item.day][timeSlot] = item.value;
            }
          }
        }
      });
      
      // Create the series data structure that Nivo needs
      const result: HeatMapSerie[] = [];
      
      for (const day of DAYS_OF_WEEK) {
        const seriesData: HeatMapDatum[] = [];
        
        for (const timeSlot of TIME_SLOTS) {
          let value = heatmapData[day][timeSlot];
          
          // Average the value if needed for "all" locations
          if (selectedLocation === "all" && heatmapData[day]._count && heatmapData[day]._count[timeSlot] > 0) {
            value = value / heatmapData[day]._count[timeSlot];
          }
          
          seriesData.push({
            x: timeSlot,
            y: value / 100  // Convert to 0-1 scale (percentage to decimal)
          });
        }
        
        result.push({
          id: day,
          data: seriesData
        });
      }
      
      return result;
    } catch (err) {
      console.error("Error processing usage data:", err);
      return [];
    }
  };
  
  const chartData = getChartData();
  
  // Error from API
  if (error) {
    return (
      <Card className="shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>Machine Usage Patterns</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-80">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-2" />
          <p className="text-muted-foreground text-center">
            {error instanceof Error ? error.message : "Failed to load usage data"}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>Machine Usage Patterns</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  // No data state
  if (!data || !data.usageData || !data.usageData.length) {
    return (
      <Card className="shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>Machine Usage Patterns</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">No usage data available</p>
        </CardContent>
      </Card>
    );
  }
  
  // Define color scales for the heatmap
  const colorScale = [
    "#dceaf4", // Very light blue for low usage
    "#a9cde0", 
    "#73a4b7", // Medium blue
    "#647991", // Slate blue
    "#2f3944"  // Dark slate for high usage
  ];
  
  return (
    <Card className="shadow-md">
      <CardHeader className="gradient-blue text-white border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Machine Usage Patterns by Time</CardTitle>
            <p className="text-white/80 text-sm">Machine usage patterns by day of week and time</p>
          </div>
          {data?.locations && data.locations.length > 0 && (
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {data.locations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="h-96 pt-6">
        {chartData.length > 0 ? (
          <ResponsiveHeatMap
            data={chartData}
            valueFormat=">-.2p"
            margin={{ top: 20, right: 90, bottom: 60, left: 90 }}
            xOuterPadding={0.1}
            yOuterPadding={0.1}
            axisTop={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: 'Time of Day',
              legendPosition: 'middle',
              legendOffset: -30
            }}
            axisRight={null}
            axisBottom={null}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Day of Week',
              legendPosition: 'middle',
              legendOffset: -70
            }}
            colors={{
              type: 'sequential',
              scheme: 'blues'
            }}
            borderWidth={1}
            borderColor="#ffffff"
            enableLabels={false}
            hoverTarget="cell"
            animate={true}
            theme={{
              tooltip: {
                container: {
                  background: '#ffffff',
                  fontSize: 12,
                }
              }
            }}
            tooltip={({ cell }) => {
              // Define a custom interface for the cell props based on Nivo's structure
              type CellProps = {
                serieId: string | number;
                data: { x: string; y: number };
                value: number | null;
              };
              
              // Type-cast the cell prop
              const cellData = cell as unknown as CellProps;
              
              return (
                <div
                  style={{
                    background: 'white',
                    padding: '9px 12px',
                    border: '1px solid #ccc',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  <div><strong>Day:</strong> {String(cellData.serieId)}</div>
                  <div><strong>Time:</strong> {cellData.data.x}</div>
                  <div>
                    <strong>Usage:</strong> {cellData.value !== null ? `${Math.round(cellData.value * 100)}%` : 'N/A'}
                  </div>
                </div>
              );
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Insufficient data for the selected criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}