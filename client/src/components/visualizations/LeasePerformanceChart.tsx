import { ResponsiveBar } from "@nivo/bar";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Define the data structure for lease performance
interface LeaseData {
  location: string;
  revenue: number;
  maintenance: number;
  utilization: number;
  roi: number;
  machineCount: number;
}

interface LeasePerformanceChartProps {
  data?: LeaseData[];
  title?: string;
  isLoading?: boolean;
  error?: string;
}

export function LeasePerformanceChart({
  data = [],
  title = "Lease Performance Comparison",
  isLoading = false,
  error = "",
}: LeasePerformanceChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentMetric, setCurrentMetric] = useState<string>("roi");
  const [sortBy, setSortBy] = useState<string>("value");
  
  // Format data based on selected metric and sorting
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }
    
    try {
      // Create a deep copy to avoid mutating the original data
      let formattedData = data.map(item => ({
        location: item.location,
        value: item[currentMetric as keyof LeaseData] as number,
        machineCount: item.machineCount
      }));

      // Sort data based on selected sorting option
      if (sortBy === "value") {
        formattedData.sort((a, b) => b.value - a.value);
      } else if (sortBy === "location") {
        formattedData.sort((a, b) => a.location.localeCompare(b.location));
      } else if (sortBy === "machineCount") {
        formattedData.sort((a, b) => b.machineCount - a.machineCount);
      }
      
      // Limit to top 15 locations for readability
      formattedData = formattedData.slice(0, 15);
      
      setChartData(formattedData);
    } catch (err) {
      console.error("Error processing lease performance data:", err);
      setChartData([]);
    }
  }, [data, currentMetric, sortBy]);

  // Get the appropriate label and format based on the selected metric
  const getMetricConfig = () => {
    switch (currentMetric) {
      case "revenue":
        return {
          label: "Revenue ($)",
          format: (value: number) => `$${value.toLocaleString()}`,
          color: "#73a4b7"
        };
      case "maintenance":
        return {
          label: "Maintenance Cost ($)",
          format: (value: number) => `$${value.toLocaleString()}`,
          color: "#e95f2a"
        };
      case "utilization":
        return {
          label: "Utilization (%)",
          format: (value: number) => `${value}%`,
          color: "#647991"
        };
      case "roi":
        return {
          label: "Return on Investment (%)",
          format: (value: number) => `${value}%`,
          color: "#2f3944"
        };
      default:
        return {
          label: "Value",
          format: (value: number) => `${value}`,
          color: "#73a4b7"
        };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
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
        <CardContent className="flex flex-col items-center justify-center h-96">
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
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">No lease performance data available</p>
        </CardContent>
      </Card>
    );
  }

  const metricConfig = getMetricConfig();

  return (
    <Card className="shadow-md">
      <CardHeader className="gradient-blue text-white border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-white/80 text-sm">Comparative analysis of lease performance metrics</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[500px] pt-6">
        <div className="flex justify-between items-center mb-4">
          <Tabs defaultValue="roi" value={currentMetric} onValueChange={setCurrentMetric}>
            <TabsList>
              <TabsTrigger value="roi">ROI</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="utilization">Utilization</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Sort by Value</SelectItem>
              <SelectItem value="location">Sort by Location</SelectItem>
              <SelectItem value="machineCount">Sort by Machine Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {chartData.length > 0 ? (
          <div className="h-[400px]">
            <ResponsiveBar
              data={chartData}
              keys={['value']}
              indexBy="location"
              margin={{ top: 10, right: 20, bottom: 70, left: 80 }}
              padding={0.3}
              layout="horizontal"
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={[metricConfig.color]}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: metricConfig.label,
                legendPosition: 'middle',
                legendOffset: 45
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Location',
                legendPosition: 'middle',
                legendOffset: -60
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor="#ffffff"
              tooltip={({ indexValue, value, color }) => (
                <div
                  style={{
                    background: 'white',
                    padding: '9px 12px',
                    border: '1px solid #ccc',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  <div><strong>Location:</strong> {indexValue}</div>
                  <div><strong>{metricConfig.label}:</strong> {metricConfig.format(value)}</div>
                  <div><strong>Machine Count:</strong> {chartData.find(d => d.location === indexValue)?.machineCount || 'N/A'}</div>
                </div>
              )}
              role="application"
              ariaLabel="Lease performance bar chart"
              barAriaLabel={e => `${e.indexValue}: ${metricConfig.format(e.value)} ${metricConfig.label}`}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">No data available for the selected metric</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}