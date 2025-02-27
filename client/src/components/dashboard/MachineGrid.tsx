import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WashingMachine, AlertTriangle, Clock, RefreshCw, Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Machine, Location } from "@shared/schema";
import { useState } from "react";

export function MachineGrid() {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const { data: machineData, isLoading: isLoadingMachines } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines']
  });

  const { data: locationData } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations']
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/sync/machines');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({
        title: "Success",
        description: "Machines synced successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sync machines",
      });
    },
  });

  if (isLoadingMachines) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Create a map of locationId to location name for easy lookup
  const locationMap = new Map(
    locationData?.locations.map(location => [location.id, location]) || []
  );

  // Filter machines based on selected location
  const filteredMachines = machineData?.machines.filter(machine => 
    selectedLocation === "all" || machine.locationId.toString() === selectedLocation
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Machines</h2>
        <div className="flex items-center gap-4">
          <Select
            value={selectedLocation}
            onValueChange={setSelectedLocation}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locationData?.locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => syncMutation.mutate()} 
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Machines
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMachines?.map((machine) => {
          const location = locationMap.get(machine.locationId);

          return (
            <Card key={machine.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {machine.name}
                </CardTitle>
                <Badge 
                  variant={machine.status === 'online' ? 'default' : 
                          machine.status === 'offline' ? 'destructive' : 'outline'}
                >
                  {machine.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{location?.name || 'Unknown Location'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <WashingMachine className="h-4 w-4" />
                    <span>{machine.model || 'Unknown Model'}</span>
                  </div>
                  {machine.metrics && (
                    <>
                      <div className="flex items-center space-x-2 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{machine.metrics.errors} errors today</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(machine.metrics.uptime)}% uptime</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}