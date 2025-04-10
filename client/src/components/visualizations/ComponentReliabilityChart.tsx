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

// Define the data structure for component reliability
interface ComponentData {
  name: string;
  failureRate: number;
  mtbf: number; // Mean time between failures (hours)
  avgRepairTime: number; // Average repair time (hours)
  machineType?: string;
  category?: string;
}

interface ComponentReliabilityChartProps {
  data?: ComponentData[];
  title?: string;
  isLoading?: boolean;
  error?: string;
  machineTypes?: string[];
  categories?: string[];
}

export function ComponentReliabilityChart({
  data = [],
  title = "Component Reliability Analysis",
  isLoading = false,
  error = "",
  machineTypes = [],
  categories = [],
}: ComponentReliabilityChartProps) {
  const [selectedMachineType, setSelectedMachineType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<string>("failureRate");
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Filter and format data based on selections
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }
    
    try {
      let filteredData = data;
      
      // Filter by machine type if not "all"
      if (selectedMachineType !== "all") {
        filteredData = filteredData.filter(d => d.machineType === selectedMachineType);
      }
      
      // Filter by component category if not "all"
      if (selectedCategory !== "all") {
        filteredData = filteredData.filter(d => d.category === selectedCategory);
      }
      
      // Sort data based on selected metric (in descending order for failure rate,
      // ascending for MTBF, and descending for repair time)
      if (selectedMetric === "failureRate") {
        filteredData.sort((a, b) => b.failureRate - a.failureRate);
      } else if (selectedMetric === "mtbf") {
        filteredData.sort((a, b) => a.mtbf - b.mtbf);
      } else if (selectedMetric === "avgRepairTime") {
        filteredData.sort((a, b) => b.avgRepairTime - a.avgRepairTime);
      }
      
      // Limit to top 10 components for readability
      const limitedData = filteredData.slice(0, 10);
      
      // Format data for Nivo bar chart
      const formattedData = limitedData.map(item => ({
        component: item.name,
        [selectedMetric]: item[selectedMetric],
        category: item.category || 'Unknown',
      }));
      
      setChartData(formattedData);
    } catch (err) {
      console.error("Error processing component reliability data:", err);
      setChartData([]);
    }
  }, [data, selectedMachineType, selectedCategory, selectedMetric]);

  // Get the appropriate label based on the selected metric
  const getMetricLabel = () => {
    switch (selectedMetric) {
      case "failureRate":
        return "Failure Rate (%)";
      case "mtbf":
        return "Mean Time Between Failures (hours)";
      case "avgRepairTime":
        return "Average Repair Time (hours)";
      default:
        return "Value";
    }
  };

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
          <p className="text-muted-foreground">No component reliability data available</p>
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
            <p className="text-white/80 text-sm">Analysis of component-level reliability metrics</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-96 pt-6">
        <div className="flex gap-2 mb-4">
          {machineTypes.length > 0 && (
            <Select value={selectedMachineType} onValueChange={setSelectedMachineType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Machine Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {machineTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {categories.length > 0 && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Component Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="failureRate">Failure Rate</SelectItem>
              <SelectItem value="mtbf">Mean Time Between Failures</SelectItem>
              <SelectItem value="avgRepairTime">Avg. Repair Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveBar
              data={chartData}
              keys={[selectedMetric]}
              indexBy="component"
              margin={{ top: 10, right: 10, bottom: 50, left: 80 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={selectedMetric === "failureRate" ? ["#e95f2a"] : 
                    selectedMetric === "avgRepairTime" ? ["#647991"] : ["#73a4b7"]}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Component',
                legendPosition: 'middle',
                legendOffset: 40
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: getMetricLabel(),
                legendPosition: 'middle',
                legendOffset: -60
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              role="application"
              ariaLabel="Component reliability bar chart"
              barAriaLabel={e => `${e.indexValue}: ${e.formattedValue} ${getMetricLabel()}`}
              theme={{
                tooltip: {
                  container: {
                    background: '#ffffff',
                    fontSize: 12,
                  }
                }
              }}
              tooltip={({ indexValue, value, color }) => (
                <div
                  style={{
                    background: 'white',
                    padding: '9px 12px',
                    border: '1px solid #ccc',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  <div><strong>Component:</strong> {indexValue}</div>
                  <div><strong>{getMetricLabel()}:</strong> {value}</div>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-72">
            <p className="text-muted-foreground">No data available for the selected criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}