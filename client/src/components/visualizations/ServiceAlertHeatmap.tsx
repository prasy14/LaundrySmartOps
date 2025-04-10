import { useMemo } from "react";
import { Heatmap } from "@nivo/heatmap";
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
  const formattedData = useMemo(() => {
    if (!data.length) return [];
    
    // Get all possible alert types from the data
    const alertTypes = Array.from(
      new Set(
        data.flatMap(location => Object.keys(location.counts))
      )
    );
    
    // Format for Nivo heatmap
    return data.map(location => {
      const result: any = { 
        location: location.location,
        locationId: location.locationId,
      };
      
      // Add all alert types, defaulting to 0 if not present
      alertTypes.forEach(type => {
        result[type] = location.counts[type] || 0;
      });
      
      return result;
    });
  }, [data]);

  // Get keys for the heatmap (alert types)
  const keys = useMemo(() => {
    if (!data.length) return [];
    return Array.from(
      new Set(
        data.flatMap(location => Object.keys(location.counts))
      )
    );
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

  if (!data.length || !keys.length) {
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
        <Heatmap
          data={formattedData}
          keys={keys}
          indexBy="location"
          margin={{ top: 20, right: 60, bottom: 30, left: 100 }}
          forceSquare={false}
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
          cellOpacity={1}
          cellBorderWidth={1}
          cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
          labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
          defs={[
            {
              id: 'lines',
              type: 'patternLines',
              background: 'inherit',
              color: 'rgba(0, 0, 0, 0.1)',
              rotation: -45,
              lineWidth: 4,
              spacing: 7
            }
          ]}
          fill={[{ id: 'lines' }]}
          animate={true}
          motionStiffness={80}
          motionDamping={9}
          hoverTarget="cell"
          cellHoverOthersOpacity={0.25}
          onClick={(cell: any) => {
            if (onLocationSelect && cell.data && cell.data.locationId) {
              onLocationSelect(cell.data.locationId);
            }
          }}
        />
      </CardContent>
    </Card>
  );
}