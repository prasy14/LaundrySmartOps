import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, MapPin } from "lucide-react";
import type { Alert as AlertType, Machine } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

export function AlertsList() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const { data: machinesData } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines']
  });

  const { data: alertsData, refetch } = useQuery<{ alerts: AlertType[] }>({
    queryKey: ['/api/alerts']
  });

  const handleClearAlert = async (id: number) => {
    await apiRequest('POST', `/api/alerts/${id}/clear`);
    refetch();
  };

  if (!alertsData || !machinesData) return null;

  // Get unique locations from machines
  const locations = Array.from(new Set(machinesData.machines.map(m => m.location)));

  // Filter alerts by location if one is selected
  const filteredAlerts = alertsData.alerts.filter(alert => {
    if (selectedLocation === 'all') return true;
    const machine = machinesData.machines.find(m => m.id === alert.machineId);
    return machine?.location === selectedLocation;
  });

  // Group active alerts by location
  const activeAlerts = filteredAlerts.filter(alert => alert.status === 'active');

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex justify-between items-center">
          <CardTitle>Active Alerts</CardTitle>
          <Select
            value={selectedLocation}
            onValueChange={setSelectedLocation}
          >
            <SelectTrigger className="w-[180px]">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(location => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {activeAlerts.length} active alerts {selectedLocation !== 'all' ? `in ${selectedLocation}` : 'across all locations'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeAlerts.map((alert) => {
          const machine = machinesData.machines.find(m => m.id === alert.machineId);
          return (
            <Alert 
              key={alert.id}
              variant={alert.type === 'error' ? 'destructive' : 'default'}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span>Machine #{alert.machineId}</span>
                  <span className="text-xs text-muted-foreground">
                    Location: {machine?.location || 'Unknown'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearAlert(alert.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </AlertTitle>
              <AlertDescription className="flex flex-col">
                <span>{alert.message}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                </span>
              </AlertDescription>
            </Alert>
          );
        })}
        {activeAlerts.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No active alerts {selectedLocation !== 'all' ? `in ${selectedLocation}` : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}