import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Machine } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function Machines() {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const { data: machinesData, isLoading } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines'],
  });

  const { data: locationsData } = useQuery<{ locations: { id: number; name: string }[] }>({
    queryKey: ['/api/locations'],
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

  const filteredMachines = machinesData?.machines.filter(machine =>
    selectedLocation === "all" ||
    (machine.locationId && machine.locationId.toString() === selectedLocation)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-end mb-4">
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Link Quality</TableHead>
                <TableHead>Remaining Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMachines?.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell className="font-medium">{machine.name}</TableCell>
                  <TableCell>{getLocationName(machine.locationId)}</TableCell>
                  <TableCell>{machine.modelNumber || 'N/A'}</TableCell>
                  <TableCell>{machine.serialNumber || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={machine.status?.statusId === 'online' ? 'success' : 'destructive'}>
                      {getStatusDisplay(machine)}
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
              ))}

              {(!filteredMachines || filteredMachines.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No machines found. Contact an administrator to sync machines from SQ Insights.
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