import { useState, useEffect } from "react";
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
import { Alert, Location } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

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

  // Fetch locations data
  const { data: locationsData, isLoading: locationsLoading } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });

  // Fetch all alerts with filters
  const { 
    data: alertsData, 
    isLoading: alertsLoading,
    refetch: refetchAlerts
  } = useQuery<{ alerts: Alert[] }>({
    queryKey: [
      '/api/alerts', 
      selectedLocation, 
      selectedServiceType, 
      dateRange,
      activeTab,
      severity,
      filterRecurring,
      minRecurringCount
    ],
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

  // Export alerts to CSV
  const exportToCSV = (data: Alert[]) => {
    if (!data || data.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no alerts matching your current filters.",
        variant: "destructive"
      });
      return;
    }
    
    // Create headers
    const headers = [
      "ID", "Machine ID", "Type", "Service Type", "Message", "Status", 
      "Created At", "Resolved At", "Priority", "Location", "Recurring Count"
    ];
    
    // Create rows
    const rows = data.map(alert => [
      alert.id,
      alert.machineId,
      alert.type,
      alert.serviceType || '',
      alert.message,
      alert.status,
      format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      alert.resolvedAt ? format(new Date(alert.resolvedAt), 'yyyy-MM-dd HH:mm:ss') : '',
      alert.priority || '',
      alert.location || '',
      recurringErrorCounts[alert.machineId] || 1
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `service-alerts-${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
          </TabsList>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchAlerts()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
                
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locationsData?.locations?.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Service Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="general">General</SelectItem>
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
                  onClick={() => exportToCSV(filteredAlerts)}
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
                    <TableHead>Recurring</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">
                          {alert.machineId}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            alert.status === 'active' ? 'destructive' :
                              alert.status === 'in_progress' ? 'default' :
                                'outline'
                          }>
                            {alert.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {alert.serviceType || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <div className="font-medium truncate">{alert.message}</div>
                            <div className="text-xs text-muted-foreground">
                              Type: {alert.type}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.location || 'Unknown'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(alert.createdAt), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            (recurringErrorCounts[alert.machineId] || 1) > 5 ? 'destructive' :
                              (recurringErrorCounts[alert.machineId] || 1) > 2 ? 'default' :
                                'outline'
                          }>
                            {recurringErrorCounts[alert.machineId] || 1}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              alert.priority === 'high' ? 'destructive' :
                              alert.priority === 'medium' ? 'default' : 'outline'
                            }
                          >
                            {alert.priority || 'low'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
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
                              <CheckCircle className="h-10 w-10 text-success opacity-80" />
                              <p>No active service alerts</p>
                            </>
                          )}
                          <Button 
                            variant="link" 
                            onClick={() => {
                              setSearchTerm('');
                              setFilterRecurring(false);
                              setSelectedLocation('all');
                              setSelectedServiceType('all');
                            }}
                          >
                            Clear filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
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