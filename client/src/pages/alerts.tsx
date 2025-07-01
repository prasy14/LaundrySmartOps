import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Alert, Location,Machine, MachineError } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import SearchableDropdown from "@/pages/SearchableDropdown";
import { cn } from "@/lib/utils";
import { machine } from "os";



interface EnhancedAlert extends Alert {
  relatedError?: any;
  errorDuration?: number;
  errorDetails?: {
    errorCode: number;
    errorType: string;
    machineName: string;
    locationName: string;
    manufacturer?: string;
    modelNumber?: string;
    serialNumber?: string;
  };
}

export default function AlertsPage() {
  // State management
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [severity, setSeverity] = useState<string[]>(["fatal", "cleared"]);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [filterRecurring, setFilterRecurring] = useState(false);
  const [minRecurringCount, setMinRecurringCount] = useState(3);

  // Tab state
  const [activeTab, setActiveTab] = useState("active");

//Fetch Machine data
  const { data: machinesData, isLoading: machinesLoading } = useQuery<{ machines: Machine[] }>({
  queryKey: ['/api/machines'],
});

  // Fetch locations data
  const { data: locationsData, isLoading: locationsLoading } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });

  // Fetch enhanced service alerts with machine error integration
  const { 
    data: alertsData, 
    isLoading: alertsLoading,
    refetch: refetchAlerts
  } = useQuery<{ alerts: EnhancedAlert[] }>({
    queryKey: ['/api/service-alerts'],
    enabled: !locationsLoading,
  });

  // Fetch persistent machine errors
 const {
  data: persistentErrorsData,
  isLoading: persistentErrorsLoading,
  refetch: refetchPersistentErrors,
} = useQuery<{ persistentErrors: PersistentError[] }>({
  queryKey: ['persistent-errors', activeTab], // Include tab in key
  queryFn: () =>
    fetch(`/api/persistent-errors?activeTab=${activeTab}`).then((res) => res.json()),
  enabled: !locationsLoading,
});


//   const {
//   data: historicalAlertsData,
//   isLoading: historicalAlertsLoading,
//   refetch: refetchHistoricalAlerts,
// } = useQuery<{ historicalAlerts: HistoricalAlert[] }>({
//   queryKey: ['/api/historical-alerts'], 
//   queryFn: async () => {
//     const res = await fetch("/api/historical-alerts", { credentials: "include" }); 
//     if (!res.ok) throw new Error("Failed to fetch historical alerts");
//     return res.json();
//   },
//   enabled: activeTab === 'historical',
// });


  type PersistentError = {
     id: string; 
  machineId: number;
  locationId: number;
  errorName: string;
  errorType: string;
  createdAt: Date;
  timestamp: Date;
  machineName?: string;
  locationName?: string;
  count: number;
  recurring: boolean;
  priority: 'High' | 'Medium' | 'Low';
};

type HistoricalAlert = {
   machineId: number;
  locationId: number;
  errorName: string;
  errorType: string;
  createdAt: Date;
  timestamp: Date;
  machineName?: string;
  locationName?: string;
  count: number;
  recurring: boolean;
  priority: 'High' | 'Medium' | 'Low';
};

  //const getMachineName =  machinesData?.machines.find((m) => m.id === machineId)?.name || `#${machineId}`;
 

const getLocationName = (locationId: number) => {
  return locationsData?.locations.find((l) => l.id === locationId)?.name || `#${locationId}`;
};

  // Fetch alert statistics
  const { 
    data: alertStatistics, 
    isLoading: statisticsLoading
  } = useQuery<any>({
    queryKey: ['/api/alert-statistics'],
    enabled: !locationsLoading,
  });

  // Count of recurring errors per machine
  const [recurringErrorCounts, setRecurringErrorCounts] = useState<{[key: number]: number}>({});

  // Calculate recurring error counts when alerts data changes
  useEffect(() => {
    if (alertsData?.alerts) {
      const counts: {[key: number]: number} = {};
      
      alertsData.alerts.forEach(alert => {
        if (!counts[alert.machineId]) {
          counts[alert.machineId] = 1;
        } else {
          counts[alert.machineId]++;
        }
      });
      
      setRecurringErrorCounts(counts);
    }
  }, [alertsData]);

  // Filter and sort alerts
  const filteredAlerts = alertsData?.alerts?.filter(alert => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const messageMatch = alert.message?.toLowerCase().includes(searchLower);
    const serviceTypeMatch = alert.serviceType?.toLowerCase().includes(searchLower);
    const locationMatch = alert.location?.toLowerCase().includes(searchLower);
    const searchMatch = !searchTerm || messageMatch || serviceTypeMatch || locationMatch;
    
    // Recurring filter
    const recurringMatch = !filterRecurring || 
      (recurringErrorCounts[alert.machineId] && recurringErrorCounts[alert.machineId] >= minRecurringCount);
    
    return searchMatch && recurringMatch;
  }).sort((a, b) => {
    // Handle date sorting
    if (sortBy === 'createdAt') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    // Handle priority sorting
    if (sortBy === 'priority') {
      const priorityMap: {[key: string]: number} = { high: 3, medium: 2, low: 1 };
      const priorityA = priorityMap[a.priority || 'low'] || 0;
      const priorityB = priorityMap[b.priority || 'low'] || 0;
      return sortOrder === 'asc' ? priorityA - priorityB : priorityB - priorityA;
    }
    
    // Handle recurring count sorting
    if (sortBy === 'recurring') {
      const countA = recurringErrorCounts[a.machineId] || 0;
      const countB = recurringErrorCounts[b.machineId] || 0;
      return sortOrder === 'asc' ? countA - countB : countB - countA;
    }
    
    return 0;
  }) || [];

  // Filtered data for export
const filteredActiveAlerts = persistentErrorsData?.persistentErrors?.filter(error => {
  const created = new Date(error.createdAt);
  const isOlderThanOneHour = new Date().getTime() - created.getTime() > 60 * 60 * 1000;
  const isMatchingLocation = selectedLocation === "all" || error.locationId === parseInt(selectedLocation);
  const isMatchingErrorType = selectedServiceType === "all" || error.errorType === selectedServiceType;
  return isOlderThanOneHour && isMatchingLocation && isMatchingErrorType;
}) || [];

const filteredHistoricalAlerts = persistentErrorsData?.persistentErrors?.filter(error => {
  const now = new Date();
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const ts = new Date(error.timestamp);
  const isInDateRange = ts >= twoYearsAgo && ts < yesterday;
  const isMatchingLocation = selectedLocation === "all" || error.locationId === parseInt(selectedLocation);
  const isMatchingErrorType = selectedServiceType === "all" || error.errorType === selectedServiceType;
  return isInDateRange && isMatchingLocation && isMatchingErrorType;
}) || [];

const filteredPersistentErrors = persistentErrorsData?.persistentErrors?.filter(error => {
  const counts: Record<string, number> = {};
  persistentErrorsData.persistentErrors.forEach(e => {
    counts[e.errorName] = (counts[e.errorName] || 0) + 1;
  });
  const isMatchingLocation = selectedLocation === "all" || error.locationId === parseInt(selectedLocation);
  const isMatchingErrorType = selectedServiceType === "all" || error.errorType === selectedServiceType;
  return isMatchingLocation && isMatchingErrorType && counts[error.errorName] > 3;
}) || [];

const errors = persistentErrorsData?.persistentErrors || [];

const now = new Date();
const twoYearsAgo = new Date(now);
twoYearsAgo.setFullYear(now.getFullYear() - 2);
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const errorNameCounts: Record<string, number> = {};
errors.forEach(error => {
  errorNameCounts[error.errorName] = (errorNameCounts[error.errorName] || 0) + 1;
});

const searchLower = searchTerm.toLowerCase();

const matchesSearch = (error: any, machine: any, location: any) => {
  const matchText = `
    ${error.errorName}
    ${error.errorType}
    ${error.createdAt}
    ${error.timestamp}
    ${machine?.name || ""}
    ${location?.name || ""}
   ${machine?.status?.statusId || ""}
  `.toLowerCase();
  return !searchTerm || matchText.includes(searchLower);
};

const filteredActive = errors.filter(error => {
  const created = new Date(error.createdAt);
  const isOlderThanOneHour = now.getTime() - created.getTime() > 3600000;
  const locationMatch = selectedLocation === "all" || error.locationId === parseInt(selectedLocation);
  const typeMatch = selectedServiceType === "all" || error.errorType === selectedServiceType;
  const machine = machinesData?.machines.find(m => m.id === error.machineId);
  const location = locationsData?.locations.find(l => l.id === error.locationId);
  return isOlderThanOneHour && locationMatch && typeMatch && matchesSearch(error, machine, location);
});

const filteredHistorical = errors.filter(error => {
  const ts = new Date(error.timestamp);
  const inDateRange = ts >= twoYearsAgo && ts < yesterday;
  const locationMatch = selectedLocation === "all" || error.locationId === parseInt(selectedLocation);
  const typeMatch = selectedServiceType === "all" || error.errorType === selectedServiceType;
  const machine = machinesData?.machines.find(m => m.id === error.machineId);
  const location = locationsData?.locations.find(l => l.id === error.locationId);
  return inDateRange && locationMatch && typeMatch && matchesSearch(error, machine, location);
});

const filteredPersistent = errors.filter(error => {
  const locationMatch = selectedLocation === "all" || error.locationId === parseInt(selectedLocation);
  const typeMatch = selectedServiceType === "all" || error.errorType === selectedServiceType;
  const count = errorNameCounts[error.errorName];
  const machine = machinesData?.machines.find(m => m.id === error.machineId);
  const location = locationsData?.locations.find(l => l.id === error.locationId);
  return count > 3 && locationMatch && typeMatch && matchesSearch(error, machine, location);
});

const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

const getPaginated = <T,>(data: T[]) =>
  data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

const filteredErrors = 
  activeTab === "active"
    ? filteredActive
    : activeTab === "historical"
    ? filteredHistorical
    : filteredPersistent;

const paginatedErrors = getPaginated(filteredErrors);

const activeErrors = getPaginated(filteredActive);
const historicalErrors = getPaginated(filteredHistorical);
const persistentErrors = getPaginated(filteredPersistent);
const totalPages = Math.ceil(
  (activeTab === "historical"
    ? filteredHistorical
    : activeTab === "persistent-errors"
    ? filteredPersistent
    : filteredActive
  ).length / itemsPerPage
);

const getPriorityColor = (priorityNumber: number) =>
  priorityNumber === 5 ? "bg-red-600 text-white" :
  priorityNumber === 4 ? "bg-orange-600 text-white" :
  priorityNumber === 3 ? "bg-yellow-500 text-white" :
  priorityNumber === 2 ? "bg-blue-500 text-black" :
  "bg-green-500 text-black";

const getStatusBadgeColor = (statusId: string) => {
  switch (statusId) {
    case "AVAILABLE":
    case "READY_TO_START":
    case "ONLINE":
      return "bg-green-500 text-white";
    case "COMPLETE":
      return "bg-blue-500 text-white";
    case "UNAVAILABLE":
      return "bg-red-500 text-white";
    case "MAINTENANCE":
      return "bg-yellow-500 text-black";
    case "OFFLINE":
      return "bg-gray-400 text-black";
    default:
      return "bg-gray-200 text-gray-800";
  }
};




  // Function to generate alerts from persistent errors
  const generateAlertsFromErrors = async () => {
    try {
      const response = await fetch('/api/generate-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate alerts');
      }

      const result = await response.json();
      toast({
        title: "Alerts Generated",
        description: result.message,
      });

      // Refresh data
      refetchAlerts();
      refetchPersistentErrors();
      //refetchHistoricalAlerts();

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate alerts from persistent errors",
        variant: "destructive",
      });
    }
  };

 const exportToCSV = (data: MachineError[],  activeTab: string) => {
  if (!data || data.length === 0) {
    toast({
      title: "No data to export",
      description: "There are no alerts matching your current filters.",
      variant: "destructive"
    });
    return;
  }

  const headers = [
    "Machine Name", "Location Name", "Error Type", "Error Name", "Created At", "Timestamp", "Recurring Count", "Priority"
  ];

  const errorNameCounts: Record<string, number> = {};
  data.forEach(error => {
    errorNameCounts[error.errorName] = (errorNameCounts[error.errorName] || 0) + 1;
  });

  const rows = data.map(error => {
    const machineName = machinesData?.machines.find(m => m.id === error.machineId)?.name || "Unknown";
    const locationName = locationsData?.locations.find(l => l.id === error.locationId)?.name || "Unknown";
    const recurrenceCount = errorNameCounts[error.errorName] || 1;
    const priority =
      recurrenceCount >= 10 ? "5" :
      recurrenceCount >= 7 ? "4" :
      recurrenceCount >= 5 ? "3" :
      recurrenceCount >= 3 ? "2" : "1";

    return [
      machineName,
      locationName,
      error.errorType,
      error.errorName,
      format(new Date(error.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      format(new Date(error.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      recurrenceCount.toString(),
      priority
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
   const tabName = activeTab.replace(/\s+/g, '-').toLowerCase();
  link.setAttribute('href', url);
  link.setAttribute('download', `alerts-${tabName}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Service Alerts</h1>
        <p className="text-muted-foreground">
          Search, filter and manage service alerts across all locations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Alerts</TabsTrigger>
            <TabsTrigger value="historical">Historical Alerts</TabsTrigger>
            <TabsTrigger value="persistent-errors">Persistent Errors</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateAlertsFromErrors}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Generate Alerts
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchAlerts()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader className="bg-card pb-4">
            <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
              <div>
                <CardTitle className="text-xl">Service Alerts</CardTitle>
                <CardDescription>
                  {activeTab === 'active' 
                    ? 'Currently active service issues requiring attention' 
                    : 'Historical service alerts for analysis'}
                </CardDescription>
              </div>
              
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search alerts..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9"
                    />
                  </div>
                </div>
                
                 <SearchableDropdown
                      className="w-[300px]" 
                      value={selectedLocation}
                      onChange={setSelectedLocation}
                       options={[{ id: "all", name: "All Locations" }, ...(locationsData?.locations || [])]}
                  />
                
               <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Service Type" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="all">All Types</SelectItem>
    <SelectItem value="NO_FLOW_ERROR">NO_FLOW_ERROR</SelectItem>
    <SelectItem value="FATAL_DOOR_LOCK_ERROR">FATAL_DOOR_LOCK_ERROR</SelectItem>
    <SelectItem value="CONTROL">CONTROL</SelectItem>
    <SelectItem value="BROKEN_BELT_ERROR">BROKEN_BELT_ERROR</SelectItem>
    <SelectItem value="LOCKER_ROTOR_ERROR">LOCKER_ROTOR_ERROR</SelectItem>
    <SelectItem value="BOARD_NOT_READY_ERROR">BOARD_NOT_READY_ERROR</SelectItem>
    <SelectItem value="DRAIN_ERROR">DRAIN_ERROR</SelectItem>
    <SelectItem value="THERMAL_PROTECT_ERROR">THERMAL_PROTECT_ERROR</SelectItem>
    <SelectItem value="SHORTED_THERMISTOR_ERROR">SHORTED_THERMISTOR_ERROR</SelectItem>
    <SelectItem value="OVERFLOW_ERROR">OVERFLOW_ERROR</SelectItem>
    <SelectItem value="SUDS_LOCK_ERROR">SUDS_LOCK_ERROR</SelectItem>
    <SelectItem value="DOOR_OPEN_ERROR1">DOOR_OPEN_ERROR1</SelectItem>
  </SelectContent>
</Select>

                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-4">
                    <h4 className="font-medium mb-2">Alert Filters</h4>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Severity</h5>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="severity-fatal" 
                              checked={severity.includes('fatal')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSeverity([...severity, 'fatal']);
                                } else {
                                  setSeverity(severity.filter(s => s !== 'fatal'));
                                }
                              }}
                            />
                            <Label htmlFor="severity-fatal">Fatal (Uncleared)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="severity-cleared" 
                              checked={severity.includes('cleared')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSeverity([...severity, 'cleared']);
                                } else {
                                  setSeverity(severity.filter(s => s !== 'cleared'));
                                }
                              }}
                            />
                            <Label htmlFor="severity-cleared">Cleared</Label>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox 
                            id="filter-recurring" 
                            checked={filterRecurring}
                            onCheckedChange={(checked) => {
                              setFilterRecurring(checked as boolean);
                            }}
                          />
                          <Label htmlFor="filter-recurring">Show recurring errors only</Label>
                        </div>
                        {filterRecurring && (
                          <div className="mt-2 flex items-center">
                            <Label htmlFor="min-recurring" className="mr-2 text-sm">
                              Min count:
                            </Label>
                            <Input
                              id="min-recurring"
                              type="number"
                              value={minRecurringCount}
                              onChange={(e) => setMinRecurringCount(parseInt(e.target.value) || 2)}
                              className="w-16 h-8"
                              min={2}
                            />
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">Sort By</h5>
                        <Select 
                          value={sortBy} 
                          onValueChange={setSortBy}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="createdAt">Date</SelectItem>
                            <SelectItem value="priority">Priority</SelectItem>
                            <SelectItem value="recurring">Recurring Count</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex items-center mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={sortOrder === 'asc' ? 'bg-primary/10' : ''}
                            onClick={() => setSortOrder('asc')}
                          >
                            Ascending
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={sortOrder === 'desc' ? 'bg-primary/10' : ''}
                            onClick={() => setSortOrder('desc')}
                          >
                            Descending
                          </Button>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <DatePickerWithRange
                        date={dateRange}
                        setDate={setDateRange}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                
              <Button
  variant="outline"
  size="icon"
  onClick={() => {
  const rawExportData =
    activeTab === "persistent-errors"
      ? filteredPersistentErrors
      : activeTab === "historical"
      ? filteredHistoricalAlerts
      : activeTab === "active"
      ? filteredActiveAlerts
      : [];

  const exportData = rawExportData.map(error => ({
    ...error,
    errorCode: null, // since PersistentError doesn’t have this
    id: `${error.machineId}-${error.errorName}-${error.timestamp}` // generate an ID if needed
  }));

  exportToCSV(exportData,activeTab);
}}

>
  <Download className="h-4 w-4" />
</Button>


              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {alertsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Issue Description</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                    {activeTab === "persistent-errors" && (
                      <TableHead>Timestamp</TableHead>
                    )}
                    <TableHead>Recurring</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                 
             
{activeTab === "historical" && paginatedErrors.map((error, index) => {
  const machine = machinesData?.machines.find(m => m.id === error.machineId);
  const location = locationsData?.locations.find(l => l.id === error.locationId);
  const count = errorNameCounts[error.errorName] || 1;
  let priority = 1;
  if (count >= 10) priority = 5;
  else if (count >= 7) priority = 4;
  else if (count >= 5) priority = 3;
  else if (count >= 3) priority = 2;

  const statusId = machine?.status?.statusId || "unknown";
  const statusColor = getStatusBadgeColor(statusId);
  const priorityColor = getPriorityColor(priority);

  return (
    <TableRow key={`${error.machineId}-${error.errorName}-${error.timestamp}-${index}`}>
      <TableCell>{machine?.name || "Unknown"}</TableCell>
      <TableCell>
        <div className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColor}`}>{statusId}</div>
      </TableCell>
      <TableCell>{error.errorType}</TableCell>
      <TableCell>{error.errorName}</TableCell>
      <TableCell>{location?.name}</TableCell>
      <TableCell>{format(new Date(error.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
      <TableCell><Badge variant="default">{count}</Badge></TableCell>
      <TableCell>
        <div className={`inline-block px-2 py-1 text-xs font-medium rounded ${priorityColor}`}>{priority}</div>
      </TableCell>
    </TableRow>
  );
})}

{activeTab === "active" && activeErrors.map((error, index) => {
  const machine = machinesData?.machines.find(m => m.id === error.machineId);
  const location = locationsData?.locations.find(l => l.id === error.locationId);
  const count = errorNameCounts[error.errorName] || 1;

  let priority = 1;
  if (count >= 10) priority = 5;
  else if (count >= 7) priority = 4;
  else if (count >= 5) priority = 3;
  else if (count >= 3) priority = 2;

  const statusId = machine?.status?.statusId || "unknown";
  const statusColor = getStatusBadgeColor(statusId);
  const priorityColor = getPriorityColor(priority);

  return (
    <TableRow key={`${error.machineId}-${error.errorName}-${error.timestamp}-${index}`}>
      <TableCell>{machine?.name || "Unknown"}</TableCell>
      <TableCell>
        <div className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColor}`}>{statusId}</div>
      </TableCell>
      <TableCell>{error.errorType}</TableCell>
      <TableCell>{error.errorName}</TableCell>
      <TableCell>{location?.name || "Unknown"}</TableCell>
      <TableCell>{format(new Date(error.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
      <TableCell><Badge variant="default">{count}</Badge></TableCell>
      <TableCell>
        <div className={`inline-block px-2 py-1 text-xs font-medium rounded ${priorityColor}`}>{priority}</div>
      </TableCell>
    </TableRow>
  );
})}
{activeTab === "persistent-errors" && persistentErrors.map((error, index) => {
  const machine = machinesData?.machines.find(m => m.id === error.machineId);
  const location = locationsData?.locations.find(l => l.id === error.locationId);
  const count = errorNameCounts[error.errorName] || 1;

  let priority = 1;
  if (count >= 10) priority = 5;
  else if (count >= 7) priority = 4;
  else if (count >= 5) priority = 3;
  else if (count >= 3) priority = 2;

  const statusId = machine?.status?.statusId || "unknown";
  const statusColor = getStatusBadgeColor(statusId);
  const priorityColor = getPriorityColor(priority);

  return (
    <TableRow key={`${error.machineId}-${error.errorName}-${error.timestamp}-${index}`}>
      <TableCell>{machine?.name || "Unknown"}</TableCell>
      <TableCell>
        <div className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColor}`}>{statusId}</div>
      </TableCell>
      <TableCell>{error.errorType}</TableCell>
      <TableCell>{error.errorName}</TableCell>
      <TableCell>{location?.name || "Unknown"}</TableCell>
      <TableCell>{format(new Date(error.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
      <TableCell>{format(new Date(error.timestamp), 'MMM d, yyyy h:mm a')}</TableCell>
      <TableCell><Badge variant="default">{count}</Badge></TableCell>
      <TableCell>
        <div className={`inline-block px-2 py-1 text-xs font-medium rounded ${priorityColor}`}>{priority}</div>
      </TableCell>
    </TableRow>
  );
})}

<TableRow className="bg-muted/30">
  <TableCell colSpan={9}>
    <div className="flex justify-between items-center text-sm text-muted-foreground px-2">
      <span>
        Total Alerts: <strong>
          {activeTab === "historical" ? filteredHistorical.length :
           activeTab === "persistent-errors" ? filteredPersistent.length : filteredActive.length}
        </strong>
      </span>
      <span>
        Page {currentPage} of {totalPages}
        <button
          className="ml-4 text-blue-600 disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          Prev
        </button>
        <button
          className="ml-2 text-blue-600 disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Next
        </button>
      </span>
    </div>
  </TableCell>
</TableRow>

                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2">
                          {searchTerm || filterRecurring ? (
                            <>
                              <Search className="h-10 w-10 text-muted-foreground opacity-20" />
                              <p>No alerts match your search criteria</p>
                            </>
                          ) : (
                            <>
                            </>
                          )}
                          <Button 
                            variant="link" 
                            onClick={() => {
                              setSearchTerm('');
                              setFilterRecurring(false);
                              setSelectedLocation('all');
                              setSelectedServiceType('all');
                            }}>
                            Clear filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-between mt-6 text-sm text-muted-foreground">
          <div>
            {filteredAlerts.length > 0 && (
              <p>
                Showing {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <p>Service alerts are automatically escalated based on priority and recurring pattern</p>
          </div>
        </div>


      </Tabs>
    </div>
  );
}
