import { ResponsiveHeatMap } from "@nivo/heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the data structure for time-based usage
interface UsageDataPoint {
  hour: number;
  day: string;
  value: number;
  location?: string;
}

interface UsageByTimeChartProps {
  data?: UsageDataPoint[];
  title?: string;
  isLoading?: boolean;
  error?: string;
  locations?: string[];
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => 
  i < 12 
    ? `${i === 0 ? 12 : i}am` 
    : `${i === 12 ? 12 : i - 12}pm`
);

export function UsageByTimeChart({
  data = [],
  title = "Machine Usage by Time",
  isLoading = false,
  error = "",
  locations = [],
}: UsageByTimeChartProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [chartData, setChartData] = useState<any[]>([]);

  
  // Filter and format data when location selection changes
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }
    
    try {
      let filteredData = data;
      
      // Filter by location if not "all"
      if (selectedLocation !== "all") {
        filteredData = data.filter(d => d.location === selectedLocation);
      }
      
      // Create a map for all days and hours
      const usageMap: Record<string, { [hour: string]: number }> = {};
      
      // Initialize the map with zeros for all days and hours
      DAYS_OF_WEEK.forEach(day => {
        usageMap[day] = {};
        TIME_SLOTS.forEach((_, hourIndex) => {
          usageMap[day][hourIndex] = 0;
        });
      });
      
      // Fill in the data
      filteredData.forEach(item => {
        if (usageMap[item.day] && item.hour >= 0 && item.hour < 24) {
          usageMap[item.day][item.hour] = item.value;
        }
      });
      
      // Format data for Nivo heatmap
      const formattedData = DAYS_OF_WEEK.map(day => {
        const dayData: Record<string, any> = { day };
        
        TIME_SLOTS.forEach((timeSlot, hourIndex) => {
          dayData[timeSlot] = usageMap[day][hourIndex];
        });
        
        return dayData;
      });
      
      setChartData(formattedData);
    } catch (err) {
      console.error("Error processing usage data:", err);
      setChartData([]);
    }
  }, [data, selectedLocation]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-80">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-2" />
          <p className="text-muted-foreground text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  // No data state
  if (!data.length) {
    return (
      <Card className="shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>{title}</CardTitle>
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
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-white/80 text-sm">Machine usage patterns by day of week and time</p>
          </div>
          {locations.length > 0 && (
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(location => (
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
            keys={TIME_SLOTS}
            indexBy="day"
            margin={{ top: 20, right: 90, bottom: 60, left: 90 }}
            forceSquare={false}
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
            cellOpacity={1}
            cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
            defs={[
              {
                id: 'gradient',
                type: 'linearGradient',
                colors: colorScale.map((color, i, colors) => ({
                  offset: (i / (colors.length - 1)) * 100 + '%',
                  color,
                })),
              },
            ]}
            fill={[{ id: 'gradient' }]}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
            hoverTarget="cell"
            cellHoverOthersOpacity={0.5}
            theme={{
              axis: {
                legend: {
                  text: {
                    fontSize: 16,
                    fontWeight: 700, 
                  },
                },
              },
              tooltip: {
                container: {
                  background: '#ffffff',
                  fontSize: 12,
                }
              }
            }}
            tooltip={({ xKey, yKey, value, color }) => (
              <div
                style={{
                  background: 'white',
                  padding: '9px 12px',
                  border: '1px solid #ccc',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                }}
              >
                <div><strong>Day:</strong> {yKey}</div>
                <div><strong>Time:</strong> {xKey}</div>
                <div>
                  <strong>Usage:</strong> {value !== null ? `${value}%` : 'N/A'}
                </div>
              </div>
            )}
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