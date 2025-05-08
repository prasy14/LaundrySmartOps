import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, FileDown, AlertTriangle } from "lucide-react";
import { format, subDays } from "date-fns";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Machine {
  id: number;
  name: string;
  externalId: string;
  locationId: number;
  machineTypeId: number;
  serialNumber?: string;
  status?: string;
  manufacturer?: string;
  modelNumber?: string;
}

interface Location {
  id: number;
  name: string;
  externalId: string;
}

interface ComparisonData {
  machineId: number;
  machineName: string;
  machineType: string;
  locationName: string;
  manufacturer?: string;
  modelNumber?: string;
  metrics: any[];
  aggregated: {
    availability: number;
    cyclesCompleted: number;
    errorCount: number;
    energyConsumption: number;
    energyEfficiency: number;
    failureRate: number;
    oeeScore: number;
    averageCycleTime: number;
  };
  timeSeriesData: Array<{
    date: string;
    availability: number;
    cyclesCompleted: number;
    errorCount: number;
    energyConsumption: number;
  }>;
}

export default function MachineComparisonPage() {
  const { toast } = useToast();
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedMachines, setSelectedMachines] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [comparisonMetric, setComparisonMetric] = useState<string>("energyEfficiency");
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch locations
  const { data: locationsData, isLoading: isLocationsLoading } = useQuery<{ locations: Location[] }>({
    queryKey: ["/api/locations"],
  });

  // Fetch machines
  const { data: machinesData, isLoading: isMachinesLoading } = useQuery<{ machines: Machine[] }>({
    queryKey: ["/api/machines"],
  });

  // Filter machines based on selected locations
  const filteredMachines = machinesData?.machines.filter(
    (machine) => 
      selectedLocations.length === 0 || 
      selectedLocations.includes("all") || 
      selectedLocations.includes(machine.locationId.toString())
  ) || [];

  // Query for comparison data
  const {
    data: comparisonData,
    isLoading: isComparisonLoading,
    error: comparisonError,
    refetch: refetchComparison,
  } = useQuery<ComparisonData[]>({
    queryKey: [
      "/api/machine-performance/machine-comparison", 
      {
        machineIds: selectedMachines.join(','),
        startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
      }
    ],
    enabled: selectedMachines.length > 0 && !!dateRange.from && !!dateRange.to,
  });

  // Handle location selection
  const handleLocationChange = (value: string) => {
    if (value === "all") {
      setSelectedLocations(["all"]);
    } else {
      const updatedLocations = selectedLocations.includes("all")
        ? [value]
        : selectedLocations.includes(value)
          ? selectedLocations.filter(id => id !== value)
          : [...selectedLocations, value];
      
      setSelectedLocations(updatedLocations.length ? updatedLocations : ["all"]);
    }
    // Reset machine selection when locations change
    setSelectedMachines([]);
  };

  // Handle machine selection
  const handleMachineToggle = (machineId: number) => {
    setSelectedMachines(prev => 
      prev.includes(machineId)
        ? prev.filter(id => id !== machineId)
        : [...prev, machineId]
    );
  };

  // Handle date range change
  const handleDateChange = (range: DateRange) => {
    setDateRange(range);
  };

  // Prepare data for the comparison chart
  const getChartData = () => {
    if (!comparisonData || !comparisonData.length) return [];

    const metricLabels: Record<string, string> = {
      energyEfficiency: "Energy Efficiency (kWh/cycle)",
      oeeScore: "OEE Score (%)",
      availability: "Availability (%)",
      failureRate: "Failure Rate (%)",
      averageCycleTime: "Avg. Cycle Time (min)"
    };

    return comparisonData.map(item => ({
      name: item.machineName,
      value: item.aggregated[comparisonMetric as keyof typeof item.aggregated] || 0,
      location: item.locationName,
      machineType: item.machineType
    }));
  };

  // Prepare time series data
  const getTimeSeriesData = () => {
    if (!comparisonData || !comparisonData.length) return [];
    
    const timeSeriesMap: Record<string, any> = {};
    
    // Initialize the combined time series data
    comparisonData.forEach(machine => {
      machine.timeSeriesData.forEach(dataPoint => {
        if (!timeSeriesMap[dataPoint.date]) {
          timeSeriesMap[dataPoint.date] = { date: dataPoint.date };
        }
        
        // Add machine-specific data for this date
        timeSeriesMap[dataPoint.date][`${machine.machineName}_${comparisonMetric}`] = 
          dataPoint[comparisonMetric as keyof typeof dataPoint] || 0;
      });
    });
    
    // Convert the map to an array and sort by date
    return Object.values(timeSeriesMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Handle compare button click
  const handleCompareClick = () => {
    if (selectedMachines.length === 0) {
      toast({
        title: "No machines selected",
        description: "Please select at least one machine to compare",
        variant: "destructive",
      });
      return;
    }
    
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Date range required",
        description: "Please select a start and end date for comparison",
        variant: "destructive",
      });
      return;
    }
    
    refetchComparison();
  };

  // Export to CSV 
  const exportToCSV = () => {
    if (!comparisonData || comparisonData.length === 0) return;
    
    // Prepare headers
    const headers = [
      "Machine Name", 
      "Location", 
      "Machine Type", 
      "Availability (%)",
      "Cycles Completed",
      "Error Count",
      "Energy Consumption (kWh)",
      "Energy Efficiency (kWh/cycle)",
      "Failure Rate (%)",
      "OEE Score (%)",
      "Avg. Cycle Time (min)"
    ];
    
    // Prepare data rows
    const dataRows = comparisonData.map(machine => [
      machine.machineName,
      machine.locationName,
      machine.machineType,
      machine.aggregated.availability.toFixed(2),
      machine.aggregated.cyclesCompleted,
      machine.aggregated.errorCount,
      machine.aggregated.energyConsumption.toFixed(2),
      machine.aggregated.energyEfficiency.toFixed(2),
      machine.aggregated.failureRate.toFixed(2),
      machine.aggregated.oeeScore.toFixed(2),
      machine.aggregated.averageCycleTime.toFixed(2)
    ]);
    
    // Combine headers and data
    const csvContent = [
      headers.join(","),
      ...dataRows.map(row => row.join(","))
    ].join("\n");
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `machine-comparison-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Machine Performance Comparison</h1>
        <p className="text-muted-foreground">
          Compare the performance of machines across different metrics and time periods.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Comparison Criteria</CardTitle>
          <CardDescription>
            Select machines and time period for comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Select 
                  value={selectedLocations[0] || "all"} 
                  onValueChange={handleLocationChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locationsData?.locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <DateRangePicker 
                  date={dateRange} 
                  onDateChange={handleDateChange} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Comparison Metric</label>
                <Select 
                  value={comparisonMetric} 
                  onValueChange={setComparisonMetric}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="energyEfficiency">Energy Efficiency</SelectItem>
                      <SelectItem value="oeeScore">OEE Score</SelectItem>
                      <SelectItem value="availability">Availability</SelectItem>
                      <SelectItem value="failureRate">Failure Rate</SelectItem>
                      <SelectItem value="averageCycleTime">Average Cycle Time</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                Select Machines ({selectedMachines.length} selected)
              </label>
              {isMachinesLoading ? (
                <div className="flex items-center justify-center h-[210px]">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredMachines.length === 0 ? (
                <div className="flex items-center justify-center h-[210px] border rounded-md">
                  <p className="text-muted-foreground">No machines available</p>
                </div>
              ) : (
                <div className="border rounded-md p-4 h-[210px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredMachines.map((machine) => (
                      <div key={machine.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`machine-${machine.id}`}
                          checked={selectedMachines.includes(machine.id)}
                          onCheckedChange={() => handleMachineToggle(machine.id)}
                        />
                        <label 
                          htmlFor={`machine-${machine.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {machine.name} {machine.serialNumber ? `(${machine.serialNumber})` : ''}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-4 space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedMachines([])}
                  disabled={selectedMachines.length === 0}
                >
                  Clear Selection
                </Button>
                <Button 
                  onClick={handleCompareClick}
                  disabled={selectedMachines.length === 0 || !dateRange.from || !dateRange.to}
                >
                  Compare Machines
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Comparison Results */}
      {isComparisonLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-muted-foreground">Loading comparison data...</p>
            </div>
          </CardContent>
        </Card>
      ) : comparisonError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-2" />
            <p className="text-muted-foreground">
              {comparisonError instanceof Error
                ? comparisonError.message
                : "Error loading comparison data"}
            </p>
            <Button onClick={() => refetchComparison()} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : comparisonData && comparisonData.length > 0 ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Comparison Results</h2>
            <Button variant="outline" onClick={exportToCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chart">Comparison Chart</TabsTrigger>
              <TabsTrigger value="timeSeries">Time Series</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6 pt-4">
              <Table>
                <TableCaption>
                  Machine performance comparison for the selected period: 
                  {dateRange.from && dateRange.to
                    ? ` ${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                    : ""}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Machine Type</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Total Cycles</TableHead>
                    <TableHead>Failure Rate</TableHead>
                    <TableHead>Energy Efficiency</TableHead>
                    <TableHead>OEE Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.map((item) => (
                    <TableRow key={item.machineId}>
                      <TableCell className="font-medium">{item.machineName}</TableCell>
                      <TableCell>{item.locationName}</TableCell>
                      <TableCell>{item.machineType}</TableCell>
                      <TableCell>{item.aggregated.availability?.toFixed(2)}%</TableCell>
                      <TableCell>{item.aggregated.cyclesCompleted}</TableCell>
                      <TableCell>{item.aggregated.failureRate?.toFixed(2)}%</TableCell>
                      <TableCell>{item.aggregated.energyEfficiency?.toFixed(2)} kWh/cycle</TableCell>
                      <TableCell>{item.aggregated.oeeScore?.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="chart" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{`Machine Comparison by ${comparisonMetric}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name, props) => [
                            value,
                            comparisonMetric === "energyEfficiency" 
                              ? "Energy Efficiency (kWh/cycle)" 
                              : comparisonMetric === "oeeScore" 
                                ? "OEE Score (%)" 
                                : comparisonMetric === "availability" 
                                  ? "Availability (%)" 
                                  : comparisonMetric === "failureRate"
                                    ? "Failure Rate (%)"
                                    : "Avg. Cycle Time (min)"
                          ]}
                        />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          fill="#73a4b7" 
                          name={
                            comparisonMetric === "energyEfficiency" 
                              ? "Energy Efficiency (kWh/cycle)" 
                              : comparisonMetric === "oeeScore" 
                                ? "OEE Score (%)" 
                                : comparisonMetric === "availability" 
                                  ? "Availability (%)" 
                                  : comparisonMetric === "failureRate"
                                    ? "Failure Rate (%)"
                                    : "Avg. Cycle Time (min)"
                          }
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timeSeries" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{`${comparisonMetric} Over Time`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getTimeSeriesData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => format(new Date(date), "MM/dd")}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(date) => format(new Date(date), "MMM dd, yyyy")}
                        />
                        <Legend />
                        {comparisonData.map((machine, index) => (
                          <Line
                            key={machine.machineId}
                            type="monotone"
                            dataKey={`${machine.machineName}_${comparisonMetric}`}
                            name={machine.machineName}
                            stroke={
                              index === 0 ? "#73a4b7" : 
                              index === 1 ? "#e95f2a" : 
                              index === 2 ? "#647991" : 
                              index === 3 ? "#2f3944" : 
                              `#${Math.floor(Math.random()*16777215).toString(16)}`
                            }
                            activeDot={{ r: 8 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : selectedMachines.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No comparison data available for the selected machines and time period.
            </p>
            <Button onClick={() => refetchComparison()} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}