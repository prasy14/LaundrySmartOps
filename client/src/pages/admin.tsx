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
import type { 
  Location, 
  Machine, 
  SyncLog, 
  MachineProgram,
  MachineError,
  MachineCycle,
  CycleStep,
  CycleModifier 
} from "@shared/schema";
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

  const { data: errorsData } = useQuery<{ errors: MachineError[] }>({
    queryKey: ['/api/machine-errors'],
  });
  

const { data: cyclesData } = useQuery<{ machineCycles: MachineCycle[] }>({
  queryKey: ['/api/machine-cycles'],
});


const { data: stepsData } = useQuery<{ cycleSteps: CycleStep[] }>({
  queryKey: ['/api/cycle-steps'],
});

  const { data: modifiersData } = useQuery<{ cycleModifiers: CycleModifier[] }>({
    queryKey: ['/api/cycle-modifiers'],
  });
  console.log("modifiers Data:", modifiersData?.cycleModifiers);

  const { data: syncInfo } = useQuery<SyncInfo>({
    queryKey: ['/api/admin/sync-info'],
  });

  // Sync mutations remain the same...
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/sync/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/machine-programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sync-info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/machine-errors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/machine-cycles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cycle-steps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cycle-modifiers'] });
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

  // Other mutations remain the same...
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

  const getStatusDisplay = (machine: Machine) => {
    if (!machine.status) return 'Unknown';
    return machine.status.statusId || 'Unknown';
  };

  const getSelectedCycle = (machine: Machine) => {
    if (!machine.status?.selectedCycle) return 'None';
    return machine.status.selectedCycle.name;
  };

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
            <CardTitle>Database Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="locations" className="space-y-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="machines">Machines</TabsTrigger>
                <TabsTrigger value="programs">Machine Programs</TabsTrigger>
                <TabsTrigger value="errors">Machine Errors</TabsTrigger>
                <TabsTrigger value="cycles">Machine Cycles</TabsTrigger>
                <TabsTrigger value="steps">Cycle Steps</TabsTrigger>
                <TabsTrigger value="modifiers">Cycle Modifiers</TabsTrigger>
              </TabsList>

              {/* Locations Tab */}
              <TabsContent value="locations">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationsData?.locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell>{location.address || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={location.status === 'active' ? 'success' : 'secondary'}>
                            {location.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {location.lastSyncAt ? 
                            format(new Date(location.lastSyncAt), 'MMM d, h:mm a') : 
                            'Never'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Machines Tab */}
              <TabsContent value="machines">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machinesData?.machines.map((machine) => {
                      const location = locationsData?.locations.find(l => l.id === machine.locationId);
                      return (
                        <TableRow key={machine.id}>
                          <TableCell className="font-medium">{machine.name}</TableCell>
                          <TableCell>{machine.modelNumber || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={machine.status?.statusId === 'online' ? 'success' : 'destructive'}>
                              {machine.status?.statusId || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{location?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            {machine.lastSyncAt ? 
                              format(new Date(machine.lastSyncAt), 'MMM d, h:mm a') : 
                              'Never'
                            }
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Machine Programs Tab */}
              <TabsContent value="programs">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Machine ID</TableHead>
                      <TableHead>Machine Name</TableHead>
                      <TableHead>Program Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Sort Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programsData?.programs ? (
                      programsData.programs.map((program) => {
                        const machine = machinesData?.machines.find(m => m.id === program.machineId);
                        const location = locationsData?.locations.find(l => l.id === program.locationId);
                        return (
                          <TableRow key={program.id}>
                            <TableCell>{program.id}</TableCell>
                            <TableCell>{program.machineId || 'N/A'}</TableCell>
                            <TableCell>{machine?.name || 'N/A'}</TableCell>
                            <TableCell className="font-medium">{program.name}</TableCell>
                            <TableCell>{program.type}</TableCell>
                            <TableCell>{location?.name || 'N/A'}</TableCell>
                            <TableCell>{program.sortOrder || 'N/A'}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No machine programs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Machine Errors Tab */}
              <TabsContent value="errors">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Machine</TableHead>
        <TableHead>Location</TableHead>
        <TableHead>Error Name</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Code</TableHead>
        <TableHead>Timestamp</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {errorsData?.errors?.length ? (
        errorsData.errors.map((error) => {
          const machine = machinesData?.machines.find(m => m.id === error.machineId);
          const location = locationsData?.locations.find(l => l.id === error.locationId);
          return (
            <TableRow key={error.id}>
              <TableCell className="font-medium">{machine?.name || 'Unknown'}</TableCell>
              <TableCell>{location?.name || 'Unknown'}</TableCell>
              <TableCell>{error.errorName}</TableCell>
              <TableCell>{error.errorType}</TableCell>
              <TableCell>{error.errorCode}</TableCell>
              <TableCell>{format(new Date(error.timestamp), 'MMM d, h:mm a')}</TableCell>
            </TableRow>
          );
        })
      ) : (
        <TableRow>
          <TableCell colSpan={6} className="text-center">
            No errors found.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</TabsContent>

              {/* Machine Cycles Tab */}
              <TabsContent value="cycles">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sort Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {cyclesData?.machineCycles?.length ? (
  cyclesData.machineCycles.map((cycle) => (
    <TableRow key={cycle.id}>
      <TableCell>{cycle.name}</TableCell>
      <TableCell>{cycle.cycleType}</TableCell>
      <TableCell>{cycle.sortOrder}</TableCell>
    </TableRow>
  ))
) : (
  <TableRow>
    <TableCell colSpan={3} className="text-center">
      No cycles available.
    </TableCell>
  </TableRow>
)}
</TableBody>


                </Table>
              </TabsContent>

              {/* Cycle Steps Tab */}
              <TabsContent value="steps">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Step Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Sort Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {stepsData?.cycleSteps && stepsData.cycleSteps.map((cycleSteps) => (
                  <TableRow key={cycleSteps.id}>
                  <TableCell className="font-medium">{cycleSteps.stepName}</TableCell>
                  <TableCell>{cycleSteps.description || 'N/A'}</TableCell>
                  <TableCell>{cycleSteps.sortOrder || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Cycle Modifiers Tab */}
              <TabsContent value="modifiers">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sort Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {modifiersData?.cycleModifiers?.length ? (
  modifiersData.cycleModifiers.map((cycleModifiers) => (
    <TableRow key={cycleModifiers.id}>
      <TableCell className="font-medium">{cycleModifiers.name}</TableCell>
      <TableCell className="font-medium">{cycleModifiers.sortOrder}</TableCell>
    </TableRow>
  ))
) : (
  <TableRow>
    <TableCell colSpan={3} className="text-center">
      No modifiers available.
    </TableCell>
  </TableRow>
)}
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