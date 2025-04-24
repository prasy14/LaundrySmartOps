import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MachineAvailabilityChart } from "@/components/visualizations/MachineAvailabilityChart";
import { UsageByTimeChart } from "@/components/visualizations/UsageByTimeChart";
import { ComponentReliabilityChart } from "@/components/visualizations/ComponentReliabilityChart";
import { LeasePerformanceChart } from "@/components/visualizations/LeasePerformanceChart";
import { MachineStatusChart } from "@/components/visualizations/MachineStatusChart";
import { SLAComplianceChart } from "@/components/visualizations/SLAComplianceChart";
import { AlertMetricsChart } from "@/components/visualizations/AlertMetricsChart";
import { ServiceAlertHeatmap } from "@/components/visualizations/ServiceAlertHeatmap";
import { UsagePatternChart } from "@/components/visualizations/UsagePatternChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function AnalyticsDashboard() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [machineTypes, setMachineTypes] = useState<string[]>([]);
  const [componentCategories, setComponentCategories] = useState<string[]>([
    "Motor", "Pump", "Valve", "Control Board", "Sensor", "Heating Element", "Door Mechanism", "Drum"
  ]);
  
  // Generate time-based usage data
  const generateUsageData = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = [];
    
    for (let day of days) {
      for (let hour = 0; hour < 24; hour++) {
        // Create usage patterns with higher usage during daytime and weekdays
        let baseValue = 0;
        
        // Lower usage at night (0-6, 22-23)
        if (hour < 6 || hour >= 22) {
          baseValue = 10;
        } 
        // Medium usage in early morning and evening (6-8, 19-21)
        else if ((hour >= 6 && hour < 8) || (hour >= 19 && hour < 22)) {
          baseValue = 40;
        }
        // Peak usage during day (8-19)
        else {
          baseValue = 70;
        }
        
        // Lower usage on weekends
        if (day === 'Saturday' || day === 'Sunday') {
          baseValue = Math.max(5, baseValue * 0.6);
        }
        
        // Add some variance
        const value = Math.min(100, Math.max(0, baseValue + (Math.random() * 20 - 10)));
        
        data.push({
          day,
          hour,
          value: Math.round(value),
          location: locations.length > 0 ? locations[Math.floor(Math.random() * locations.length)]?.name : 'Unknown'
        });
      }
    }
    
    return data;
  };

  // Basic API queries
  const { data: machinesData, isLoading: machinesLoading } = useQuery({
    queryKey: ['/api/machines']
  });

  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/locations']
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/reports/performance-metrics']
  });

  const { data: errorTrendsData, isLoading: errorTrendsLoading } = useQuery({
    queryKey: ['/api/reports/error-trends']
  });

  const { data: serviceMetricsData, isLoading: serviceAlertsLoading } = useQuery({
    queryKey: ['/api/reports/performance-metrics']
  });

  // Update locations and machine types when data is available
  useEffect(() => {
    if (locationsData && Array.isArray(locationsData)) {
      setLocations(locationsData);
    }
    
    if (machinesData && Array.isArray(machinesData)) {
      // Use type assertion to help TypeScript understand this is an array
      const machines = machinesData as any[];
      const typeSet = new Set<string>();
      
      // Safely extract machine types
      machines.forEach(m => {
        if (m?.type?.name) {
          typeSet.add(m.type.name);
        }
      });
      
      // Convert set to array
      setMachineTypes(Array.from(typeSet));
    }
  }, [locationsData, machinesData]);

  // Sample data for availability trend
  const availabilityData = [
    { date: "2024-04-01", availability: 95, location: "Campus Main" },
    { date: "2024-04-02", availability: 94, location: "Campus Main" },
    { date: "2024-04-03", availability: 92, location: "Campus Main" },
    { date: "2024-04-04", availability: 96, location: "Campus Main" },
    { date: "2024-04-05", availability: 91, location: "Campus Main" },
    { date: "2024-04-06", availability: 89, location: "Campus Main" },
    { date: "2024-04-07", availability: 90, location: "Campus Main" },
    { date: "2024-04-08", availability: 93, location: "Campus Main" },
    { date: "2024-04-09", availability: 95, location: "Campus Main" },
    { date: "2024-04-10", availability: 97, location: "Campus Main" },
    { date: "2024-04-01", availability: 92, location: "Residential Hall" },
    { date: "2024-04-02", availability: 90, location: "Residential Hall" },
    { date: "2024-04-03", availability: 88, location: "Residential Hall" },
    { date: "2024-04-04", availability: 91, location: "Residential Hall" },
    { date: "2024-04-05", availability: 87, location: "Residential Hall" },
    { date: "2024-04-06", availability: 86, location: "Residential Hall" },
    { date: "2024-04-07", availability: 89, location: "Residential Hall" },
    { date: "2024-04-08", availability: 90, location: "Residential Hall" },
    { date: "2024-04-09", availability: 92, location: "Residential Hall" },
    { date: "2024-04-10", availability: 94, location: "Residential Hall" },
  ];

  // Sample component reliability data
  const componentData = [
    { name: "Water Inlet Valve", failureRate: 3.2, mtbf: 5600, avgRepairTime: 2.1, machineType: "Washer", category: "Valve" },
    { name: "Main Drive Motor", failureRate: 1.8, mtbf: 7200, avgRepairTime: 3.5, machineType: "Washer", category: "Motor" },
    { name: "Drain Pump", failureRate: 5.4, mtbf: 3800, avgRepairTime: 1.8, machineType: "Washer", category: "Pump" },
    { name: "Door Lock", failureRate: 2.7, mtbf: 6100, avgRepairTime: 1.2, machineType: "Washer", category: "Door Mechanism" },
    { name: "Control Board", failureRate: 1.2, mtbf: 9500, avgRepairTime: 2.7, machineType: "Washer", category: "Control Board" },
    { name: "Water Level Sensor", failureRate: 4.5, mtbf: 4200, avgRepairTime: 1.5, machineType: "Washer", category: "Sensor" },
    { name: "Heating Element", failureRate: 3.9, mtbf: 4800, avgRepairTime: 2.2, machineType: "Dryer", category: "Heating Element" },
    { name: "Drum Belt", failureRate: 7.2, mtbf: 2800, avgRepairTime: 1.9, machineType: "Dryer", category: "Drum" },
    { name: "Thermostat", failureRate: 2.1, mtbf: 6900, avgRepairTime: 1.3, machineType: "Dryer", category: "Sensor" },
    { name: "Timer", failureRate: 1.6, mtbf: 8200, avgRepairTime: 1.7, machineType: "Dryer", category: "Control Board" },
    { name: "Blower Wheel", failureRate: 3.3, mtbf: 5200, avgRepairTime: 2.5, machineType: "Dryer", category: "Motor" },
    { name: "Idler Pulley", failureRate: 4.7, mtbf: 4000, avgRepairTime: 1.6, machineType: "Dryer", category: "Drum" },
  ];

  // Sample lease performance data
  const leaseData = [
    { location: "Campus Main", revenue: 38500, maintenance: 4200, utilization: 85, roi: 26, machineCount: 24 },
    { location: "Residential Hall", revenue: 29700, maintenance: 5100, utilization: 78, roi: 19, machineCount: 18 },
    { location: "Student Center", revenue: 12400, maintenance: 1800, utilization: 82, roi: 22, machineCount: 8 },
    { location: "Athletics Building", revenue: 8900, maintenance: 2300, utilization: 67, roi: 15, machineCount: 6 },
    { location: "Faculty Housing", revenue: 15600, maintenance: 1950, utilization: 74, roi: 21, machineCount: 10 },
    { location: "Graduate Apartments", revenue: 22800, maintenance: 3600, utilization: 81, roi: 18, machineCount: 14 },
    { location: "International House", revenue: 17200, maintenance: 2200, utilization: 79, roi: 24, machineCount: 12 },
    { location: "Medical Center", revenue: 9800, maintenance: 1400, utilization: 71, roi: 20, machineCount: 6 },
    { location: "Science Building", revenue: 7500, maintenance: 1100, utilization: 68, roi: 17, machineCount: 4 },
    { location: "Library Annex", revenue: 5200, maintenance: 900, utilization: 62, roi: 14, machineCount: 3 },
  ];

  // Alert metrics data
  const alertMetricsData = [
    { month: "Jan", total: 67, critical: 12, major: 25, minor: 30, resolved: 62, responseTime: 120 },
    { month: "Feb", total: 58, critical: 8, major: 22, minor: 28, resolved: 55, responseTime: 95 },
    { month: "Mar", total: 72, critical: 15, major: 27, minor: 30, resolved: 65, responseTime: 105 },
    { month: "Apr", total: 63, critical: 10, major: 23, minor: 30, resolved: 60, responseTime: 88 },
    { month: "May", total: 70, critical: 14, major: 26, minor: 30, resolved: 68, responseTime: 92 },
    { month: "Jun", total: 75, critical: 16, major: 29, minor: 30, resolved: 70, responseTime: 110 },
  ];

  // Get location names from available data
  const getLocationNames = () => {
    if (locations && locations.length > 0) {
      return locations.map(loc => loc.name);
    }
    return ['Campus Main', 'Residential Hall', 'Student Center', 'Athletics Building'];
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6 gradient-text">Analytics Dashboard</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reliability">Reliability Analysis</TabsTrigger>
          <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
          <TabsTrigger value="performance">Lease Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MachineStatusChart 
              machines={Array.isArray(machinesData) ? machinesData : []} 
              locations={Array.isArray(locationsData) ? locationsData : []}
              isLoading={machinesLoading || locationsLoading}
              error={""}
            />
            
            <MachineAvailabilityChart 
              data={availabilityData}
              locations={getLocationNames()}
              title="Machine Availability Trend"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AlertMetricsChart 
              data={alertMetricsData}
              title="Alert Volume by Severity"
              type="volume"
            />
            
            <SLAComplianceChart 
              data={[]} // Fallback to empty array for now
              isLoading={performanceLoading}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="reliability" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ComponentReliabilityChart 
              data={componentData}
              machineTypes={machineTypes}
              categories={componentCategories}
              title="Component Reliability Analysis"
            />
            
            <ServiceAlertHeatmap 
              data={[]} // Using empty array instead of potentially undefined data 
              isLoading={false}
              title="Service Alert Distribution"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <AlertMetricsChart 
              data={alertMetricsData}
              title="Response Time Analysis"
              type="response"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <UsagePatternChart />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MachineAvailabilityChart 
              data={availabilityData}
              locations={getLocationNames()}
              title="Machine Availability by Location"
            />
            
            <MachineStatusChart 
              machines={Array.isArray(machinesData) ? machinesData : []} 
              locations={Array.isArray(locationsData) ? locationsData : []}
              isLoading={machinesLoading || locationsLoading}
              error={""}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <LeasePerformanceChart 
              data={leaseData}
              title="Lease Performance Comparison"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ComponentReliabilityChart 
              data={componentData}
              machineTypes={machineTypes}
              categories={componentCategories}
              title="Component Reliability by Machine Type"
            />
            
            <AlertMetricsChart 
              data={alertMetricsData}
              title="Alert Volume Trends"
              type="volume"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}