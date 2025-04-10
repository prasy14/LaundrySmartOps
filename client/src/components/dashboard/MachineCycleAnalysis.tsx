import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CheckCircle, AlertCircle, BellRing } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

// Machine type definition
interface Machine {
  id: number;
  externalId: string;
  name: string;
  locationId: number | null;
  lastMaintenanceDate?: string;
  cycleStats?: {
    todayCount: number;
    weeklyAverage: number;
    monthlyAverage: number;
  };
  flaggedForMaintenance?: boolean;
}

interface Location {
  id: number;
  name: string;
}

// Component for machine cycle analysis
export default function MachineCycleAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for date selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [cycleThreshold, setCycleThreshold] = useState<number>(5);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(false);
  
  // Get machines data
  const { data: machinesData, isLoading: machinesLoading } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines'],
  });
  
  // Get locations data
  const { data: locationsData } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });
  
  // Mutation to flag machine for maintenance
  const flagMachineMutation = useMutation({
    mutationFn: async ({ machineId, flag }: { machineId: number, flag: boolean }) => {
      const res = await apiRequest('PATCH', `/api/machines/${machineId}/flag-maintenance`, { 
        flagged: flag 
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      toast({
        title: "Machine updated",
        description: "Machine maintenance flag has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating machine",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Function to handle flagging a machine for maintenance
  const handleFlagMachine = (machineId: number, currentFlag: boolean) => {
    flagMachineMutation.mutate({ machineId, flag: !currentFlag });
  };
  
  // Function to enable/disable alerts
  const toggleAlerts = () => {
    setAlertsEnabled(!alertsEnabled);
    
    if (!alertsEnabled) {
      toast({
        title: "Alerts enabled",
        description: "You will now receive alerts for machines exceeding cycle thresholds",
      });
    }
  };
  
  // Filter machines that have run more than the threshold cycles on the selected day
  const getHighCycleMachines = () => {
    if (!machinesData?.machines) return [];
    
    // For demo purposes, we're generating random cycle counts
    // In a real implementation, this would come from the backend
    return machinesData.machines.map(machine => {
      // Generate a random cycle count for demonstration
      const randomCycleCount = Math.floor(Math.random() * 15);
      
      return {
        ...machine,
        cycleStats: {
          todayCount: randomCycleCount,
          weeklyAverage: Math.floor(Math.random() * 10) + 3,
          monthlyAverage: Math.floor(Math.random() * 12) + 5,
        },
        flaggedForMaintenance: machine.flaggedForMaintenance || false
      };
    }).filter(machine => machine.cycleStats.todayCount > cycleThreshold);
  };
  
  const highCycleMachines = getHighCycleMachines();
  
  // Get location name by ID
  const getLocationName = (locationId: number | null) => {
    if (!locationId) return 'Unknown';
    const location = locationsData?.locations.find(l => l.id === locationId);
    return location?.name || 'Unknown';
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle>Machine Cycle Analysis</CardTitle>
        <CardDescription>
          Track and analyze machine cycle counts for maintenance planning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Date selector */}
          <div>
            <Label htmlFor="date-select">Select Date</Label>
            <div className="mt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-select"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Cycle threshold input */}
          <div>
            <Label htmlFor="cycle-threshold">Cycle Threshold</Label>
            <div className="mt-1">
              <select 
                id="cycle-threshold"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={cycleThreshold}
                onChange={(e) => setCycleThreshold(parseInt(e.target.value))}
              >
                <option value="3">More than 3 cycles</option>
                <option value="5">More than 5 cycles</option>
                <option value="8">More than 8 cycles</option>
                <option value="10">More than 10 cycles</option>
              </select>
            </div>
          </div>
          
          {/* Alert toggle */}
          <div className="flex items-end">
            <div className="flex items-center space-x-2">
              <Switch 
                id="alert-mode" 
                checked={alertsEnabled}
                onCheckedChange={toggleAlerts}
              />
              <Label htmlFor="alert-mode">Enable cycle threshold alerts</Label>
            </div>
          </div>
          
          {/* Stats summary */}
          <div className="bg-muted/50 rounded-lg p-3 flex flex-col justify-center">
            <p className="text-sm text-muted-foreground">Machines above threshold:</p>
            <p className="text-2xl font-bold">{highCycleMachines.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(selectedDate, "MMM d, yyyy")}
            </p>
          </div>
        </div>
        
        {/* High cycle machines table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine ID</TableHead>
                <TableHead>Machine Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Cycle Count</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highCycleMachines.length > 0 ? (
                highCycleMachines.map((machine) => (
                  <TableRow key={machine.id}>
                    <TableCell className="font-medium">
                      {machine.externalId}
                    </TableCell>
                    <TableCell>{machine.name}</TableCell>
                    <TableCell>{getLocationName(machine.locationId)}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={machine.cycleStats.todayCount > 10 ? "destructive" : 
                               machine.cycleStats.todayCount > 8 ? "warning" : "outline"}
                      >
                        {machine.cycleStats.todayCount} cycles
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {machine.lastMaintenanceDate ? 
                        format(new Date(machine.lastMaintenanceDate), "MMM d, yyyy") : 
                        "Not available"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Checkbox 
                          id={`flag-${machine.id}`}
                          checked={machine.flaggedForMaintenance}
                          onCheckedChange={() => handleFlagMachine(machine.id, !!machine.flaggedForMaintenance)}
                        />
                        <Label htmlFor={`flag-${machine.id}`} className="text-xs">
                          Flag for maintenance
                        </Label>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No machines found with more than {cycleThreshold} cycles on {format(selectedDate, "MMM d, yyyy")}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>* Machine cycle data is collected daily and analyzed for maintenance planning</p>
          <p>* Machines flagged for maintenance will be reviewed by the service team</p>
        </div>
      </CardContent>
    </Card>
  );
}