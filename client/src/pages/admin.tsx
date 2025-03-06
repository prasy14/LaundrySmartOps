import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Location, Machine } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();

  // Fetch data
  const { data: locationsData } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });

  const { data: machinesData } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines'],
  });

  const { data: syncInfo } = useQuery({
    queryKey: ['/api/admin/sync-info'],
  });

  // Location sync mutation
  const locationSyncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/sync/locations');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sync-info'] });
      toast({
        title: "Success",
        description: "Locations synced successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sync locations",
      });
    },
  });

  // Machine sync mutation
  const machineSyncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/sync/machines');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sync-info'] });
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Sync Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Location Synchronization</CardTitle>
                <Button 
                  onClick={() => locationSyncMutation.mutate()} 
                  disabled={locationSyncMutation.isPending}
                >
                  {locationSyncMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Locations
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Last Sync Status:</span>
                  {syncInfo?.lastLocationSync?.success ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Success</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Failed</span>
                    </>
                  )}
                </div>
                {syncInfo?.lastLocationSync?.timestamp && (
                  <p className="text-sm text-muted-foreground">
                    Last synced: {format(new Date(syncInfo.lastLocationSync.timestamp), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>

              {/* Locations Table */}
              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationsData?.locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell>
                          {location.address || 'N/A'}
                          {location.city && `, ${location.city}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={location.status === 'active' ? 'success' : 'secondary'}>
                            {location.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{location.type || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                    {(!locationsData?.locations || locationsData.locations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No locations found. Click sync to fetch from SQ Insights.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Machine Sync Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Machine Synchronization</CardTitle>
                <Button 
                  onClick={() => machineSyncMutation.mutate()} 
                  disabled={machineSyncMutation.isPending}
                >
                  {machineSyncMutation.isPending ? (
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Last Sync Status:</span>
                  {syncInfo?.lastMachineSync?.success ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Success</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Failed</span>
                    </>
                  )}
                </div>
                {syncInfo?.lastMachineSync?.timestamp && (
                  <p className="text-sm text-muted-foreground">
                    Last synced: {format(new Date(syncInfo.lastMachineSync.timestamp), 'MMM d, h:mm a')}
                  </p>
                )}
                {syncInfo?.lastMachineSync?.machineCount && (
                  <p className="text-sm text-muted-foreground">
                    Machines synced: {syncInfo.lastMachineSync.machineCount}
                  </p>
                )}
              </div>

              {/* Machines Table */}
              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Ping</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machinesData?.machines.map((machine) => (
                      <TableRow key={machine.id}>
                        <TableCell className="font-medium">{machine.name}</TableCell>
                        <TableCell>{machine.model || 'N/A'}</TableCell>
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
                      </TableRow>
                    ))}
                    {(!machinesData?.machines || machinesData.machines.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No machines found. Click sync to fetch from SQ Insights.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}