import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isAfter, isBefore, addMonths, differenceInDays } from "date-fns";
import type { Machine, MachineError } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Info, 
  Settings, 
  ShieldAlert, 
  Timer, 
  Wrench,
  LineChart,
  ChevronDown,
  ChevronUp,
  Minimize2
} from "lucide-react";
import MachineLifecycleChart from "@/components/visualizations/MachineLifecycleChart";
import MachineCycleAnalysis from "@/components/dashboard/MachineCycleAnalysis";

export default function Machines() {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [detailsExpanded, setDetailsExpanded] = useState<boolean>(false);

  const { data: machinesData, isLoading } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines'],
  });

  const { data: locationsData } = useQuery<{ locations: { id: number; name: string }[] }>({
    queryKey: ['/api/locations'],
  });

  const { data: errorsData } = useQuery<{ errors: MachineError[] }>({
    queryKey: ['/api/machine-errors', selectedMachine?.id],
    enabled: !!selectedMachine,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  const getLocationName = (locationId: number | null) => {
    if (!locationId) return 'Unknown Location';
    const location = locationsData?.locations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const getStatusDisplay = (machine: Machine) => {
    if (!machine.status) return 'Unknown';
    return machine.status.statusId || 'Unknown';
  };

  const getRemainingTime = (machine: Machine) => {
    if (!machine.status?.remainingSeconds) return null;
    const minutes = Math.round(machine.status.remainingSeconds / 60);
    return `${minutes} min`;
  };

  const getLinkQuality = (machine: Machine) => {
    if (!machine.status?.linkQualityIndicator) return null;
    return Math.round(machine.status.linkQualityIndicator);
  };

  const getWarrantyStatus = (machine: Machine) => {
    if (!machine.warrantyExpiryDate) return { status: 'unknown', label: 'Unknown', variant: 'default' as const };
    
    const today = new Date();
    const warrantyDate = new Date(machine.warrantyExpiryDate);
    const threeMonthsBeforeExpiry = addMonths(warrantyDate, -3);
    
    if (isBefore(warrantyDate, today)) {
      return { status: 'expired', label: 'Expired', variant: 'destructive' as const };
    } else if (isBefore(threeMonthsBeforeExpiry, today)) {
      return { status: 'expiring-soon', label: 'Expiring Soon', variant: 'secondary' as const };
    } else {
      return { status: 'active', label: 'Active', variant: 'success' as const };
    }
  };

  const getDaysUntilExpiry = (machine: Machine) => {
    if (!machine.warrantyExpiryDate) return null;
    
    const today = new Date();
    const warrantyDate = new Date(machine.warrantyExpiryDate);
    
    if (isBefore(warrantyDate, today)) {
      return 'Expired';
    }
    
    const days = differenceInDays(warrantyDate, today);
    return `${days} days remaining`;
  };

  const getPerformanceMetricsDisplay = (machine: Machine) => {
    if (!machine.performanceMetrics) {
      return (
        <div className="text-muted-foreground">
          No performance data available
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Uptime</span>
            <span className="font-medium">{machine.performanceMetrics.uptime?.toFixed(1) || 'N/A'}%</span>
          </div>
          <Progress value={machine.performanceMetrics.uptime || 0} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Efficiency</span>
            <span className="font-medium">{machine.performanceMetrics.efficiency?.toFixed(1) || 'N/A'}%</span>
          </div>
          <Progress value={machine.performanceMetrics.efficiency || 0} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Avg. Cycles/Day</span>
            <p className="text-xl font-semibold">{machine.performanceMetrics.averageCyclesPerDay?.toFixed(1) || 'N/A'}</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Avg. Cycle Time</span>
            <p className="text-xl font-semibold">{machine.performanceMetrics.averageCycleTime ? 
              `${Math.floor(machine.performanceMetrics.averageCycleTime / 60)}:${(machine.performanceMetrics.averageCycleTime % 60).toString().padStart(2, '0')}` : 
              'N/A'
            }</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Error Frequency</span>
            <p className="text-xl font-semibold">{machine.performanceMetrics.errorFrequency?.toFixed(2) || 'N/A'}/week</p>
          </div>
        </div>
      </div>
    );
  };

  const filteredMachines = machinesData?.machines.filter(machine =>
    selectedLocation === "all" ||
    (machine.locationId && machine.locationId.toString() === selectedLocation)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Machine Management</h1>
        <Select
          value={selectedLocation}
          onValueChange={(value: string) => setSelectedLocation(value)}
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
      </div>
      
      {/* Machine Cycle Analysis Section */}
      <div className="lg:col-span-3 mb-4">
        <MachineCycleAnalysis />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Machine Inventory</CardTitle>
              <CardDescription>
                Click on a machine to view detailed information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Warranty Status</TableHead>
                    <TableHead>Link Quality</TableHead>
                    <TableHead>Remaining Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMachines?.map((machine) => {
                    const warrantyStatus = getWarrantyStatus(machine);
                    return (
                      <TableRow 
                        key={machine.id} 
                        onClick={() => setSelectedMachine(machine)}
                        className="cursor-pointer hover:bg-accent/50"
                      >
                        <TableCell className="font-medium">{machine.name}</TableCell>
                        <TableCell>{getLocationName(machine.locationId)}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span>{machine.modelNumber || 'N/A'}</span>
                            {machine.manufacturer && (
                              <span className="text-xs text-muted-foreground">
                                {machine.manufacturer}
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>{machine.serialNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={machine.status?.statusId === 'online' ? 'success' : 'destructive'}>
                            {getStatusDisplay(machine)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={warrantyStatus.variant}>
                            {warrantyStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getLinkQuality(machine) !== null ? (
                            <span>{getLinkQuality(machine)}%</span>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {getRemainingTime(machine) || 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {(!filteredMachines || filteredMachines.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No machines found. Contact an administrator to sync machines from SQ Insights.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Machine Details Section - Show when a machine is selected */}
        {selectedMachine && (
          <>
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-xl">Machine Details: {selectedMachine.name}</CardTitle>
                    <CardDescription>
                      {getLocationName(selectedMachine.locationId)} • {selectedMachine.serialNumber || 'S/N: Unknown'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusDisplay(selectedMachine) === 'online' ? 'success' : 'destructive'}>
                      {getStatusDisplay(selectedMachine)}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDetailsExpanded(!detailsExpanded)}
                      className="ml-2"
                    >
                      {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {detailsExpanded ? "Hide Details" : "Show Details"}
                    </Button>
                  </div>
                </CardHeader>
                <Collapsible open={detailsExpanded} onOpenChange={setDetailsExpanded}>
                  <CollapsibleContent>
                    <CardContent>
                      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList>
                          <TabsTrigger value="overview">
                            <Info className="h-4 w-4 mr-2" />
                            Overview
                          </TabsTrigger>
                          <TabsTrigger value="performance">
                            <Settings className="h-4 w-4 mr-2" />
                            Performance
                          </TabsTrigger>
                          <TabsTrigger value="lifecycle">
                            <LineChart className="h-4 w-4 mr-2" />
                            Lifecycle
                          </TabsTrigger>
                          <TabsTrigger value="maintenance">
                            <Wrench className="h-4 w-4 mr-2" />
                            Maintenance
                          </TabsTrigger>
                          <TabsTrigger value="errors">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Errors
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Machine Details */}
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Machine Details</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <dl className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Model:</dt>
                                    <dd>{selectedMachine.modelNumber || 'N/A'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Manufacturer:</dt>
                                    <dd>{selectedMachine.manufacturer || 'N/A'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Serial Number:</dt>
                                    <dd>{selectedMachine.serialNumber || 'N/A'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Control ID:</dt>
                                    <dd>{selectedMachine.controlId || 'N/A'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Machine Number:</dt>
                                    <dd>{selectedMachine.machineNumber || 'N/A'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Network Node:</dt>
                                    <dd>{selectedMachine.networkNode || 'N/A'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Last Sync:</dt>
                                    <dd>{selectedMachine.lastSyncAt ? format(new Date(selectedMachine.lastSyncAt), 'MMM d, yyyy HH:mm') : 'Never'}</dd>
                                  </div>
                                </dl>
                              </CardContent>
                            </Card>
                            
                            {/* Warranty Information */}
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Warranty Information</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div className="text-center">
                                    {(() => {
                                      const status = getWarrantyStatus(selectedMachine);
                                      return (
                                        <div className="flex flex-col items-center">
                                          {status.status === 'active' && <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />}
                                          {status.status === 'expiring-soon' && <Clock className="w-10 h-10 text-amber-500 mb-2" />}
                                          {status.status === 'expired' && <ShieldAlert className="w-10 h-10 text-red-500 mb-2" />}
                                          {status.status === 'unknown' && <Info className="w-10 h-10 text-slate-400 mb-2" />}
                                          <span className="text-lg font-semibold">{status.label}</span>
                                          {selectedMachine.warrantyExpiryDate && (
                                            <span className="text-sm text-muted-foreground">
                                              {getDaysUntilExpiry(selectedMachine)}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  
                                  <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <dt className="text-muted-foreground">Install Date:</dt>
                                      <dd>{selectedMachine.installDate ? format(new Date(selectedMachine.installDate), 'MMM d, yyyy') : 'N/A'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-muted-foreground">Warranty Expiry:</dt>
                                      <dd>{selectedMachine.warrantyExpiryDate ? format(new Date(selectedMachine.warrantyExpiryDate), 'MMM d, yyyy') : 'N/A'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-muted-foreground">Life Cycle Status:</dt>
                                      <dd>{selectedMachine.lifeCycleStatus || 'N/A'}</dd>
                                    </div>
                                  </dl>
                                </div>
                              </CardContent>
                            </Card>
                            
                            {/* Current Status */}
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Current Status</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <dl className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Status:</dt>
                                    <dd>
                                      <Badge variant={selectedMachine.status?.statusId === 'online' ? 'success' : 'destructive'}>
                                        {getStatusDisplay(selectedMachine)}
                                      </Badge>
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Link Quality:</dt>
                                    <dd>{getLinkQuality(selectedMachine) !== null ? `${getLinkQuality(selectedMachine)}%` : 'N/A'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Current Cycle:</dt>
                                    <dd>{selectedMachine.status?.selectedCycle?.name || 'None'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Remaining Time:</dt>
                                    <dd>{getRemainingTime(selectedMachine) || 'N/A'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Door:</dt>
                                    <dd>{selectedMachine.status?.isDoorOpen ? 'Open' : 'Closed'}</dd>
                                  </div>
                                </dl>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="performance">
                          <div className="grid grid-cols-1 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {getPerformanceMetricsDisplay(selectedMachine)}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="lifecycle">
                          <MachineLifecycleChart machine={selectedMachine} />
                        </TabsContent>
                        
                        <TabsContent value="maintenance">
                          <div className="grid grid-cols-1 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Maintenance History</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <dl className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Last Maintenance:</dt>
                                    <dd>{selectedMachine.lastMaintenanceDate ? format(new Date(selectedMachine.lastMaintenanceDate), 'MMM d, yyyy') : 'N/A'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Next Scheduled:</dt>
                                    <dd>{selectedMachine.nextMaintenanceDate ? format(new Date(selectedMachine.nextMaintenanceDate), 'MMM d, yyyy') : 'N/A'}</dd>
                                  </div>
                                </dl>
                                
                                <div className="mt-4 text-center text-muted-foreground">
                                  <Wrench className="h-8 w-8 mx-auto mb-2" />
                                  <p>Maintenance records will be displayed here</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="errors">
                          <div className="grid grid-cols-1 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {errorsData?.errors && errorsData.errors.length > 0 ? (
                                  <div className="space-y-4">
                                    {errorsData.errors.map((error) => (
                                      <div 
                                        key={error.id} 
                                        className="flex items-start p-3 border border-red-200 rounded-md bg-red-50"
                                      >
                                        <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                                        <div>
                                          <p className="font-medium">{error.errorName}</p>
                                          <p className="text-sm text-muted-foreground">
                                            Code: {error.errorCode || 'N/A'} • Type: {error.errorType} • 
                                            {format(new Date(error.timestamp), 'MMM d, yyyy HH:mm')}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center text-muted-foreground py-8">
                                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                    <p>No errors recorded for this machine</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}