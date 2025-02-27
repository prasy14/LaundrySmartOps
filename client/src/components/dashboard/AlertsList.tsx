import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInMinutes } from "date-fns";
import { AlertTriangle, CheckCircle, MapPin, Clock, AlertCircle } from "lucide-react";
import type { Alert as AlertType, Machine } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function AlertsList() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  // Filter alerts by location and category
  const filteredAlerts = alertsData.alerts.filter(alert => {
    const locationMatch = selectedLocation === 'all' ? true :
      machinesData.machines.find(m => m.id === alert.machineId)?.location === selectedLocation;
    const categoryMatch = selectedCategory === 'all' ? true :
      alert.category === selectedCategory;
    return locationMatch && categoryMatch;
  });

  // Group active alerts
  const activeAlerts = filteredAlerts.filter(alert => alert.status === 'active');

  // Calculate resolution times for alerts
  const getResolutionTime = (alert: AlertType) => {
    if (!alert.clearedAt) return null;
    return differenceInMinutes(new Date(alert.clearedAt), new Date(alert.createdAt));
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex justify-between items-center">
          <CardTitle>Active Alerts</CardTitle>
          <div className="flex space-x-2">
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
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px]">
                <AlertCircle className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {activeAlerts.length} active alerts 
          {selectedLocation !== 'all' ? ` in ${selectedLocation}` : ''}
          {selectedCategory !== 'all' ? ` (${selectedCategory})` : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeAlerts.map((alert) => {
          const machine = machinesData.machines.find(m => m.id === alert.machineId);
          const resolutionTime = getResolutionTime(alert);

          return (
            <Alert 
              key={alert.id}
              variant={alert.priority === 'high' ? 'destructive' : 
                      alert.priority === 'medium' ? 'default' : 'outline'}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span>Machine #{alert.machineId}</span>
                    <Badge variant="outline">{alert.category}</Badge>
                    <Badge variant={
                      alert.priority === 'high' ? 'destructive' :
                      alert.priority === 'medium' ? 'default' : 'outline'
                    }>
                      {alert.priority}
                    </Badge>
                  </div>
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
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Created: {format(new Date(alert.createdAt), 'MMM d, h:mm a')}</span>
                  {resolutionTime && (
                    <span>
                      (Resolved in {resolutionTime} minutes)
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
        {activeAlerts.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No active alerts 
            {selectedLocation !== 'all' ? ` in ${selectedLocation}` : ''}
            {selectedCategory !== 'all' ? ` (${selectedCategory})` : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}