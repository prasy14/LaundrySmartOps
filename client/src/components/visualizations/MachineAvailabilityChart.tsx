import { ResponsiveLine } from "@nivo/line";
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

// Define the data structure for machine availability
interface AvailabilityDataPoint {
  date: string;
  availability: number;
  location?: string;
}

interface MachineAvailabilityProps {
  data?: AvailabilityDataPoint[];
  title?: string;
  isLoading?: boolean;
  error?: string;
  locations?: string[];
}

export function MachineAvailabilityChart({
  data = [],
  title = "Machine Availability Trend",
  isLoading = false,
  error = "",
  locations = [],
}: MachineAvailabilityProps) {
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
      
      // Group by date
      const groupedByDate = filteredData.reduce((acc, item) => {
        const date = new Date(item.date);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (!acc[dateKey]) {
          acc[dateKey] = { 
            total: 0, 
            count: 0 
          };
        }
        
        acc[dateKey].total += item.availability;
        acc[dateKey].count += 1;
        
        return acc;
      }, {} as Record<string, { total: number, count: number }>);
      
      // Calculate average availability per day
      const availabilityByDate = Object.entries(groupedByDate).map(([date, values]) => ({
        x: date,
        y: values.total / values.count,
      })).sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
      
      // Format data for Nivo line chart
      const formattedData = [{
        id: "availability",
        data: availabilityByDate,
        color: "#73a4b7"
      }];
      
      setChartData(formattedData);
    } catch (err) {
      console.error("Error processing availability data:", err);
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
          <p className="text-muted-foreground">No availability data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="gradient-blue text-white border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-white/80 text-sm">Machine uptime percentage over time</p>
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
      <CardContent className="h-80 pt-6">
        {chartData.length > 0 && chartData[0].data.length > 0 ? (
          <ResponsiveLine
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{
              type: 'linear',
              min: 0,
              max: 100,
              stacked: false,
              reverse: false
            }}
            curve="monotoneX"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: 'Date',
              legendOffset: 40,
              legendPosition: 'middle'
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Availability (%)',
              legendOffset: -50,
              legendPosition: 'middle',
              format: value => `${value}%`
            }}
            enableGridX={false}
            colors={{ scheme: 'category10' }}
            lineWidth={3}
            pointSize={8}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
              {
                anchor: 'top-right',
                direction: 'column',
                justify: false,
                translateX: 0,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemBackground: 'rgba(0, 0, 0, .03)',
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            theme={{
              axis: {
                ticks: {
                  text: {
                    fontSize: 12,
                    fill: '#333333'
                  }
                },
                legend: {
                  text: {
                    fontSize: 14,
                    fill: '#333333'
                  }
                }
              },
              grid: {
                line: {
                  stroke: '#dddddd',
                  strokeWidth: 1
                }
              },
              crosshair: {
                line: {
                  stroke: '#000000',
                  strokeWidth: 1,
                  strokeOpacity: 0.35
                }
              },
              tooltip: {
                container: {
                  background: '#ffffff',
                  fontSize: 12,
                }
              }
            }}
            tooltip={({ point }) => (
              <div
                style={{
                  background: 'white',
                  padding: '9px 12px',
                  border: '1px solid #ccc',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                }}
              >
                <div style={{ marginBottom: 5 }}>
                  <strong>Date:</strong> {point.data.x}
                </div>
                <div>
                  <strong>Availability:</strong> {point.data.y.toFixed(1)}%
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