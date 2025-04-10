import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDown, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface HistoricalExportProps {
  locations: Array<{ id: number; name: string }>;
  hasPermission: (roles: string[]) => boolean;
}

export function HistoricalExport({ locations, hasPermission }: HistoricalExportProps) {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedExportType, setSelectedExportType] = useState<string>("machine_events");
  const [selectedFormat, setSelectedFormat] = useState<string>("csv");
  const [includeDetails, setIncludeDetails] = useState<boolean>(true);
  const initialDateRange: DateRange = {
    from: new Date(new Date().setDate(new Date().getDate() - 90)),
    to: new Date()
  };
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);

  // Handle date change while ensuring from/to are defined
  const handleDateChange = (newRange: DateRange) => {
    // If both dates are defined, use them directly
    if (newRange.from && newRange.to) {
      setDateRange(newRange);
    }
    // If only from is defined, keep the current "to" date
    else if (newRange.from && !newRange.to) {
      setDateRange({
        from: newRange.from,
        to: dateRange.to
      });
    }
    // If only to is defined, keep the current "from" date
    else if (!newRange.from && newRange.to) {
      setDateRange({
        from: dateRange.from,
        to: newRange.to
      });
    }
  };

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!dateRange.from || !dateRange.to) {
        throw new Error("Please select a valid date range");
      }

      const formattedFrom = format(dateRange.from, 'yyyy-MM-dd');
      const formattedTo = format(dateRange.to, 'yyyy-MM-dd');
      
      const params = new URLSearchParams({
        locationId: selectedLocation,
        exportType: selectedExportType,
        format: selectedFormat,
        includeDetails: includeDetails.toString(),
        fromDate: formattedFrom,
        toDate: formattedTo
      });
      
      const response = await apiRequest(
        'GET', 
        `/api/reports/export?${params.toString()}`,
        null,
        { responseType: 'blob' }
      );
      
      return response.blob();
    },
    onSuccess: (blob) => {
      // Create file name based on export type and date range
      const fromStr = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
      const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
      const fileName = `${selectedExportType}_${fromStr}_to_${toStr}.${selectedFormat}`;
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `Your data has been exported to ${fileName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const exportOptions = [
    { id: "machine_events", name: "Machine Events" },
    { id: "service_logs", name: "Service Logs" },
    { id: "machine_usage", name: "Machine Usage" },
    { id: "error_codes", name: "Error Codes" },
    { id: "energy_consumption", name: "Energy Consumption" },
    { id: "water_usage", name: "Water Usage" },
    { id: "maintenance_records", name: "Maintenance Records" },
    { id: "parts_usage", name: "Parts Usage" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Data Export</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="export-type">Export Type</Label>
              <Select 
                value={selectedExportType} 
                onValueChange={setSelectedExportType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select export type" />
                </SelectTrigger>
                <SelectContent>
                  {exportOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Select 
                value={selectedLocation} 
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Date Range</Label>
              <DateRangePicker 
                date={dateRange}
                onDateChange={handleDateChange}
              />
            </div>
            
            <div>
              <Label htmlFor="format">Export Format</Label>
              <Select 
                value={selectedFormat} 
                onValueChange={setSelectedFormat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-6">
          <Checkbox 
            id="include-details" 
            checked={includeDetails}
            onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
          />
          <Label htmlFor="include-details">Include detailed metadata</Label>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={() => exportMutation.mutate()} 
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}