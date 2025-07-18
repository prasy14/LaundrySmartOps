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
import { 
  type Location, 
  type Machine, 
  type SyncLog, 
  type MachineProgram,
  type MachineError,
  type MachineCycle,
  type CycleStep,
  type CycleModifier, 
  machinePrograms
} from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaginationControls from "@/pages/paginationcontrol";

import { useState, useMemo, useEffect } from "react";

interface SyncInfo {
  lastLocationSync?: SyncLog;
  lastMachineSync?: SyncLog;
}
export default function Admin() {
  const { toast } = useToast();
   const itemsPerPage = 10;
  const [locationPage, setLocationPage] = useState(1);
  const [machinePage, setMachinePage] = useState(1);
  const [programPage, setProgramPage] = useState(1);
  const [errorPage, setErrorPage] = useState(1);
  const [machinecyclePage, setMachineCyclePage] = useState(1);
  const [cyclestepPage, setCyclestepPage] = useState(1);
  const [cyclemodifierPage, setCyclemodifierPage] = useState(1);
  
  const paginate = <T,>(data: T[], currentPage: number, perPage: number): T[] => {
  const start = (currentPage - 1) * perPage;
  return data.slice(start, start + perPage);
};

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

  const [activeTab, setActiveTab] = useState("locations");

useEffect(() => {
  setLocationPage(1);
  setMachinePage(1);
  setProgramPage(1);
  setErrorPage(1);
  setMachineCyclePage(1);
  setCyclestepPage(1);
  setCyclemodifierPage(1);
}, [activeTab]);


const paginatedLocations = useMemo(() => paginate(locationsData?.locations || [], locationPage, itemsPerPage), [locationsData, locationPage]);
const paginatedMachines = useMemo(() => paginate(machinesData?.machines || [], machinePage, itemsPerPage), [machinesData, machinePage]);
const paginatedPrograms = useMemo(() => paginate(programsData?.programs || [], programPage, itemsPerPage), [programsData, programPage]);
const paginatedErrors = useMemo(() => paginate(errorsData?.errors || [], errorPage, itemsPerPage), [errorsData, errorPage]);
const paginatedCycles = useMemo(() => paginate(cyclesData?.machineCycles || [], machinecyclePage, itemsPerPage), [cyclesData, machinecyclePage]);
const paginatedSteps = useMemo(() => paginate(stepsData?.cycleSteps || [], cyclestepPage, itemsPerPage), [stepsData, cyclestepPage]);
const paginatedModifiers = useMemo(() => paginate(modifiersData?.cycleModifiers || [], cyclemodifierPage, itemsPerPage), [modifiersData, cyclemodifierPage]);

const locationTotalPages = useMemo(() => Math.ceil((locationsData?.locations.length || 0) / itemsPerPage), [locationsData]);
const machineTotalPages = useMemo(() => Math.ceil((machinesData?.machines.length || 0) / itemsPerPage), [machinesData]);
const programTotalPages = useMemo(() => Math.ceil((programsData?.programs.length || 0) / itemsPerPage), [programsData]);
const errorTotalPages = useMemo(() => Math.ceil((errorsData?.errors.length || 0) / itemsPerPage), [errorsData]);
const cycleTotalPages = useMemo(() => Math.ceil((cyclesData?.machineCycles.length || 0) / itemsPerPage), [cyclesData]);
const stepTotalPages = useMemo(() => Math.ceil((stepsData?.cycleSteps.length || 0) / itemsPerPage), [stepsData]);
const modifierTotalPages = useMemo(() => Math.ceil((modifiersData?.cycleModifiers.length || 0) / itemsPerPage), [modifiersData]);

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
          //duration: 40000,
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
 const getStatusBadgeColor = (statusId: string) => {
  switch (statusId) {
    case "AVAILABLE":
    case "READY_TO_START":
    case "ONLINE":
      case "IN_USE":
      return "bg-green-500 text-white";
    case "COMPLETE":
      return "bg-blue-500 text-white";
    case "UNAVAILABLE":
      case "OFFLINE":
        case "NETWORK_ERROR":
      return "bg-red-500 text-white";
    case "MAINTENANCE":
      return "bg-yellow-500 text-black";
    
     // return "bg-gray-400 text-black";
    default:
      return "bg-gray-200 text-gray-800";
  }
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4" defaultValue="locations">
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
                    {paginatedLocations .map((location) => (
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
                <PaginationControls
  currentPage={locationPage}
  totalPages={locationTotalPages}
  onPageChange={setLocationPage}
  totalItems={locationsData?.locations.length || 0}
  label="Locations"
/>

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
                    {paginatedMachines.map((machine) => {
                      const location = locationsData?.locations.find(l => l.id === machine.locationId);
                      
                      const statusId = machine?.status?.statusId || "unknown";
                      const statusColor = getStatusBadgeColor(statusId);
                      return (
                        <TableRow key={machine.id}>
                          <TableCell className="font-medium">{machine.name}</TableCell>
                          <TableCell>{machine.modelNumber || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={statusColor}>  
                              {statusId}
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
                <PaginationControls
  currentPage={machinePage}
  totalPages={machineTotalPages}
  onPageChange={setMachinePage}
  totalItems={machinesData?.machines.length || 0}
  label="machines"
/>
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
                      paginatedPrograms .map((program) => {
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
                 <PaginationControls
  currentPage={programPage}
  totalPages={programTotalPages}
  onPageChange={setProgramPage}
  totalItems={programsData?.programs.length || 0}
  label="programs"
/>
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
       paginatedErrors.map((error) => {
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
   <PaginationControls
  currentPage={errorPage}
  totalPages={errorTotalPages}
  onPageChange={setErrorPage}
  totalItems={errorsData?.errors.length || 0}
  label="errors"
/>
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
  paginatedCycles.map((cycle) => (
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
                  <PaginationControls
  currentPage={cyclestepPage}
  totalPages={cycleTotalPages}
  onPageChange={setCyclestepPage}
  totalItems={cyclesData?.machineCycles.length || 0}
  label="cycles"
/>
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
                  {stepsData?.cycleSteps &&paginatedSteps.map((cycleSteps) => (
                  <TableRow key={cycleSteps.id}>
                  <TableCell className="font-medium">{cycleSteps.stepName}</TableCell>
                  <TableCell>{cycleSteps.description || 'N/A'}</TableCell>
                  <TableCell>{cycleSteps.sortOrder || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                 <PaginationControls
  currentPage={cyclestepPage}
  totalPages={stepTotalPages}
  onPageChange={setCyclestepPage}
  totalItems={stepsData?.cycleSteps.length || 0}
  label="steps"
/>
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
  paginatedModifiers.map((cycleModifiers) => (
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
                <PaginationControls
  currentPage={cyclemodifierPage}
  totalPages={modifierTotalPages}
  onPageChange={setCyclemodifierPage}
  totalItems={modifiersData?.cycleModifiers.length || 0}
  label="modifiers"
/>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}