import { useMemo } from "react";
import { ResponsiveHeatMapCanvas } from "@nivo/heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AlertMapData {
  location: string;
  locationId: number;
  counts: { [key: string]: number };
}

interface ServiceAlertHeatmapProps {
  data?: AlertMapData[];
  title: string;
  isLoading?: boolean;
  onLocationSelect?: (locationId: number) => void;
}

export function ServiceAlertHeatmap({
  data = [],
  title,
  isLoading = false,
  onLocationSelect
}: ServiceAlertHeatmapProps) {
  // Format data for the heatmap
  const { heatmapData, alertTypes } = useMemo(() => {
    if (!data.length) return { heatmapData: [], alertTypes: [] };
    
    // Get all possible alert types from the data
    const alertTypes = Array.from(
      new Set(
        data.flatMap(location => Object.keys(location.counts))
      )
    );
    
    // Format for Nivo heatmap - each location gets a row
    const heatmapData = data.map(location => {
      // Create a data point for each alert type
      const dataPoints = alertTypes.map(type => ({
        x: type,
        y: location.counts[type] || 0,
        locationId: location.locationId
      }));
      
      return {
        id: location.location,
        data: dataPoints
      };
    });
    
    return { heatmapData, alertTypes };
  }, [data]);

  if (isLoading) {
    return (
      <Card className="w-full h-80">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="w-full h-80">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No alert data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveHeatMapCanvas
          data={heatmapData}
          valueFormat=">-.2s"
          margin={{ top: 20, right: 60, bottom: 30, left: 100 }}
          xOuterPadding={0.2}
          yOuterPadding={0.2}
          axisTop={null}
          axisRight={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Alert Type',
            legendPosition: 'middle',
            legendOffset: 52
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Location',
            legendPosition: 'middle',
            legendOffset: -80
          }}
          colors={{
            type: 'sequential',
            scheme: 'oranges'
          }}
          emptyColor="#f5f5f5"
          enableLabels={true}
          labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          
          onClick={(cell: any) => {
            if (onLocationSelect && cell.data && cell.data.locationId) {
              onLocationSelect(cell.data.locationId);
            }
          }}
          tooltip={({ cell }) => (
            <div
              style={{
                padding: '8px 12px',
                background: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
                color: '#333'
              }}
            >
              <strong>{cell.serieId}</strong>: {cell.data.x}
              <br />
              <strong>Count</strong>: {cell.data.y}
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}