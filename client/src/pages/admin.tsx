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
import type { Location, Machine, SyncLog, MachineProgram } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SyncInfo {
  lastLocationSync?: SyncLog;
  lastMachineSync?: SyncLog;
}

export default function Admin() {
  const { toast } = useToast();

  // Fetch data
  const { data: locationsData } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });

  const { data: machinesData } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines'],
  });

  const { data: programsData } = useQuery<{ programs: MachineProgram[] }>({
    queryKey: ['/api/machine-programs'],
  });

  const { data: syncInfo } = useQuery<SyncInfo>({
    queryKey: ['/api/admin/sync-info'],
  });

  // Sync all mutation
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/sync/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/machine-programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sync-info'] });
      toast({
        title: "Success",
        description: "All data synced successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sync data",
      });
    },
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
      <div className="flex-1 p-6 space-y-6">
        {/* Sync All Button */}
        <div className="flex justify-end">
          <Button 
            onClick={() => syncAllMutation.mutate()} 
            disabled={syncAllMutation.isPending}
            size="lg"
            className="mb-4"
          >
            {syncAllMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Syncing All Data...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Sync All Data
              </>
            )}
          </Button>
        </div>

        {/* Sync Status Cards */}
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Synchronized Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="locations" className="space-y-4">
              <TabsList>
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="machines">Machines</TabsTrigger>
                <TabsTrigger value="programs">Machine Programs</TabsTrigger>
              </TabsList>

              <TabsContent value="locations">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationsData?.locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell>
                          {location.address}
                          {location.city && `, ${location.city}`}
                          {location.state && `, ${location.state}`}
                        </TableCell>
                        <TableCell>
                          {location.contactName && (
                            <div>
                              <div>{location.contactName}</div>
                              <div className="text-sm text-muted-foreground">{location.contactEmail}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={location.status === 'active' ? 'success' : 'secondary'}>
                            {location.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{location.type || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="machines">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Ping</TableHead>
                      <TableHead>Metrics</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machinesData?.machines.map((machine) => {
                      const location = locationsData?.locations.find(l => l.id === machine.locationId);
                      return (
                        <TableRow key={machine.id}>
                          <TableCell className="font-medium">{machine.name}</TableCell>
                          <TableCell>{machine.model || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={machine.status === 'online' ? 'success' : 'destructive'}>
                              {machine.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{location?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            {machine.lastPing ? 
                              format(new Date(machine.lastPing), 'MMM d, h:mm a') : 
                              'Never'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Cycles: {machine.metrics?.cycles || 0}</div>
                              <div>Uptime: {machine.metrics?.uptime}%</div>
                              <div>Errors: {machine.metrics?.errors || 0}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="programs">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programsData?.programs.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.name}</TableCell>
                        <TableCell>{program.type}</TableCell>
                        <TableCell>{program.duration} min</TableCell>
                        <TableCell>{program.description || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}