import { useQuery, useMutation } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Machine } from "@shared/schema";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Header } from "@/components/layout/Header";

export default function Machines() {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const { data, isLoading } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines'],
  });

  const { data: locationsData } = useQuery<{ locations: { id: number; name: string }[] }>({
    queryKey: ['/api/locations'],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/sync/machines');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getLocationName = (locationId: number) => {
    const location = locationsData?.locations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const filteredMachines = data?.machines.filter(machine => 
    selectedLocation === "all" || machine.locationId.toString() === selectedLocation
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Machine Management</h1>
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
              {locationsData?.locations.map((location) => (
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Ping</TableHead>
                <TableHead>Cycles</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMachines?.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell className="font-medium">{machine.name}</TableCell>
                  <TableCell>{getLocationName(machine.locationId)}</TableCell>
                  <TableCell>
                    <Badge variant={machine.status === 'online' ? 'success' : 'destructive'}>
                      {machine.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {machine.lastPing ? 
                      format(new Date(machine.lastPing), 'MMM d, h:mm a') : 
                      'Never'
                    }
                  </TableCell>
                  <TableCell>{machine.metrics?.cycles || 0}</TableCell>
                  <TableCell>{machine.metrics?.uptime ? `${machine.metrics.uptime.toFixed(1)}%` : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={machine.metrics?.errors ? 'destructive' : 'secondary'}>
                      {machine.metrics?.errors || 0}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {(!filteredMachines || filteredMachines.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No machines found. Add machines or sync with the SQ Insights API.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}