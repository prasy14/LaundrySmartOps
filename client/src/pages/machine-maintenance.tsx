import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SearchableDropdown from "./SearchableDropdown";
import { Loader2, Wrench, Clock, AlertTriangle, CheckCircle, Play, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Machine {
  id: number;
  name: string;
  status: any;
  locationId: number;
  location?: {
    id: number;
    name: string;
  };
  type?: {
    name: string;
  };
  cycleProgress?: number;
  remainingTime?: number;
  lastError?: string;
}

interface Campus {
  id: number;
  name: string;
  locationCount: number;
}

interface Location {
  id: number;
  name: string;
  campusId: number;
}

export default function MachineMaintenance() {
  const { toast } = useToast();
  const [selectedCampus, setSelectedCampus] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("available");

  // Fetch data
  const { data: campusesData, isLoading: campusesLoading } = useQuery<{ campuses: Campus[] }>({
    queryKey: ['/api/campuses']
  });

  const { data: locationsData, isLoading: locationsLoading } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations']
  });

  const { data: machinesData, isLoading: machinesLoading } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines']
  });

  // Filter locations based on selected campus
  const filteredLocations = useMemo(() => {
    if (!locationsData?.locations || selectedCampus === "all") {
      return locationsData?.locations || [];
    }
    return locationsData.locations.filter(location => 
      location.campusId === parseInt(selectedCampus)
    );
  }, [locationsData, selectedCampus]);

  // Filter machines based on selected location
  const filteredMachines = useMemo(() => {
    if (!machinesData?.machines || selectedLocation === "all") {
      return machinesData?.machines || [];
    }
    return machinesData.machines.filter(machine => 
      machine.locationId === parseInt(selectedLocation)
    );
  }, [machinesData, selectedLocation]);

  // Categorize machines by status
  const categorizedMachines = useMemo(() => {
    const machines = filteredMachines;
    
    const available = machines.filter(machine => 
      machine.status?.status === 'IDLE' || machine.status?.status === 'READY'
    );
    
    const inCycle = machines.filter(machine => 
      machine.status?.status === 'RUNNING' || machine.status?.status === 'IN_CYCLE'
    );
    
    const errors = machines.filter(machine => 
      machine.status?.status === 'ERROR' || machine.status?.status === 'FAULT'
    );

    return { available, inCycle, errors };
  }, [filteredMachines]);

  // Fix error mutation
  const fixErrorMutation = useMutation({
    mutationFn: async (machineId: number) => {
      const response = await fetch(`/api/machines/${machineId}/fix-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fix machine error');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      toast({
        title: "Success",
        description: "Machine error fix initiated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to fix machine error",
        variant: "destructive",
      });
    },
  });

  const handleFixError = (machineId: number) => {
    fixErrorMutation.mutate(machineId);
  };

  if (campusesLoading || locationsLoading || machinesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const campusOptions = [
    { id: "all", name: "All Campuses" },
    ...(campusesData?.campuses || [])
  ];

  const locationOptions = [
    { id: "all", name: "All Locations" },
    ...filteredLocations
  ];

  const machineOptions = [
    { id: "all", name: "All Machines" },
    ...filteredMachines.map(machine => ({ id: machine.id.toString(), name: machine.name }))
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Machine Maintenance</h1>
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">
            Real-time machine status and maintenance
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campus</label>
              <SearchableDropdown
                value={selectedCampus}
                onChange={setSelectedCampus}
                options={campusOptions}
                placeholder="Select campus..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <SearchableDropdown
                value={selectedLocation}
                onChange={setSelectedLocation}
                options={locationOptions}
                placeholder="Select location..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Machine</label>
              <SearchableDropdown
                value={selectedMachine}
                onChange={setSelectedMachine}
                options={machineOptions}
                placeholder="Select machine..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Machine Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{categorizedMachines.available.length}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Play className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{categorizedMachines.inCycle.length}</p>
                <p className="text-sm text-muted-foreground">In Cycle</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{categorizedMachines.errors.length}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Machine Lists */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Available Machines</TabsTrigger>
          <TabsTrigger value="in-cycle">In Cycle</TabsTrigger>
          <TabsTrigger value="errors">Error Machines</TabsTrigger>
        </TabsList>

        {/* Available Machines */}
        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Available Machines ({categorizedMachines.available.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categorizedMachines.available.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No available machines found for the selected filters
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedMachines.available.map((machine) => (
                    <Card key={machine.id} className="border-green-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{machine.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {machine.location?.name}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Available
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Type:</span> {machine.type?.name || 'Unknown'}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Status:</span> {machine.status?.status || 'Ready'}
                          </p>
                          <Button size="sm" className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Schedule Maintenance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* In Cycle Machines */}
        <TabsContent value="in-cycle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-500" />
                Machines In Cycle ({categorizedMachines.inCycle.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categorizedMachines.inCycle.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No machines currently in cycle for the selected filters
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedMachines.inCycle.map((machine) => (
                    <Card key={machine.id} className="border-blue-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{machine.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {machine.location?.name}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            In Cycle
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm">
                            <span className="font-medium">Type:</span> {machine.type?.name || 'Unknown'}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm">{machine.cycleProgress || 65}%</span>
                            </div>
                            <Progress value={machine.cycleProgress || 65} className="h-2" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {machine.remainingTime || 15} min remaining
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Machines */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Machines with Errors ({categorizedMachines.errors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categorizedMachines.errors.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Great! No machines with errors found for the selected filters.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedMachines.errors.map((machine) => (
                    <Card key={machine.id} className="border-red-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{machine.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {machine.location?.name}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            Error
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm">
                            <span className="font-medium">Type:</span> {machine.type?.name || 'Unknown'}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Error:</span> {machine.lastError || machine.status?.errorMessage || 'Unknown error'}
                          </p>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleFixError(machine.id)}
                            disabled={fixErrorMutation.isPending}
                          >
                            {fixErrorMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Wrench className="h-4 w-4 mr-2" />
                            )}
                            Fix Error
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}