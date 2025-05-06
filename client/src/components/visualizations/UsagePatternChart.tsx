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
import SearchableDropdown from "@/pages/SearchableDropdown";

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

export function UsagePatternChart() {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  
  // Fetch the usage data from API
  const { data, isLoading, error } = useQuery<UsageApiResponse>({
    queryKey: ['/api/reports/usage-patterns'],
  });
  console.log("API Data:", data);

  // Process the data for visualization
  const getChartData = () => {
    if (!data || !data.usageData || !data.usageData.length) {
      return [];
    }
    
    try {
      let filteredData = data.usageData;
      
      // Filter by location if not "all"
      if (selectedLocation !== "all") {
        filteredData = data.usageData.filter(d => d.location === selectedLocation);
      }
      
      // Create a map for all days and hours
      const usageMap: Record<string, Record<string, number>> = {};
      
      // Initialize the map with zeros for all days and hours
      DAYS_OF_WEEK.forEach(day => {
        usageMap[day] = {};
        TIME_SLOTS.forEach(timeSlot => {
          usageMap[day][timeSlot] = 0;
        });
      });
      
      // Fill in the data
      filteredData.forEach(item => {
        if (usageMap[item.day] && item.hour >= 0 && item.hour < 24) {
          const timeSlot = TIME_SLOTS[item.hour];
          
          // If multiple entries for same day/hour (from different locations),
          // we'll average or take the max depending on business logic
          if (selectedLocation === "all") {
            // For "all" locations, we'll take the average
            const currentValue = usageMap[item.day][timeSlot];
            usageMap[item.day][timeSlot] = currentValue ? (currentValue + item.value) / 2 : item.value;
          } else {
            // For specific location, just use the value
            usageMap[item.day][timeSlot] = item.value;
          }
        }
      });
      
      // Format data for Nivo heatmap
      const formattedData = [];
      
      for (const day of Object.keys(usageMap)) {
        //const dayData = { id: day };
        const dayData: { id: string; [key: string]: number | string } = { id: day };
        // Add each time slot as a property
        for (const timeSlot of Object.keys(usageMap[day])) {
          // Convert to decimal for proper formatting (0-100% -> 0-1)
          dayData[timeSlot] = usageMap[day][timeSlot] / 100;
        }
        
        formattedData.push(dayData);
      }
      
      return formattedData;
    } catch (err) {
      console.error("Error processing usage data:", err);
      return [];
    }
  };
  
  const chartData = getChartData();
  const transformedChartData = chartData.map((item) => {
    const { id, ...rest } = item;
    return {
      id,
      data: Object.entries(rest).map(([key, value]) => ({
        x: key,
        y: typeof value === 'number' ? value : parseFloat(value),
      })),
    };
  });
  
  
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
      <SearchableDropdown
        value={selectedLocation}
        onChange={setSelectedLocation}
        options={[
        { id: "all", name: "All Locations" },
        ...data.locations.map(location => ({
        id: location,
        name: location
        }))
       ]}
     />
  )}
</div>
      </CardHeader>
      <CardContent className="h-96 pt-6">
        {chartData.length > 0 ? (
          <ResponsiveHeatMap
            data={transformedChartData}
            valueFormat=">-.2p"
            margin={{ top: 50, right: 90, bottom: 60, left: 90 }}
            forceSquare={false}
            axisTop={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Time of Day',
              legendPosition: 'middle',
              legendOffset: -40
            }}
            axisRight={null}
            axisBottom={null}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Day of Week',
              legendPosition: 'middle',
              legendOffset: -80,
              legendRotation: -90
            }}
            colors={{ type: 'sequential', scheme: 'blues' }}
            borderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
            animate={true}
            theme={{
              tooltip: {
                container: {
                  background: '#ffffff',
                  fontSize: 12,
                },
              },
            }}
           tooltip={(props) => {
  const datum = props.cell;
  return (
    <div
      style={{
        background: 'white',
        padding: '9px 12px',
        border: '1px solid #ccc',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      }}
    >
      <div><strong>Day:</strong> {datum.serieId}</div>
      <div><strong>Time:</strong> {datum.id}</div>
      <div>
        <strong>Usage:</strong> {datum.value !== null ? `${Math.round(datum.value * 100)}%` : 'N/A'}
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