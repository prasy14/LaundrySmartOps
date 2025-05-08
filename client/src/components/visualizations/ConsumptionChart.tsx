import { ResponsiveLine } from "@nivo/line";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useMemo } from "react";

interface ConsumptionDataPoint {
  date: string;
  value: number;
}

interface ConsumptionChartProps {
  data?: ConsumptionDataPoint[];
  title: string;
  unitLabel: string;
  isLoading?: boolean;
  error?: string;
  type: 'energy' | 'water' | 'carbon';
}

export function ConsumptionChart({
  data = [],
  title,
  unitLabel,
  isLoading = false,
  error = "",
  type = 'energy'
}: ConsumptionChartProps) {
  
  // Prepare chart data in the right format for Nivo
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return [{
      id: type === 'energy' ? 'Energy Consumption' : 
           type === 'water' ? 'Water Usage' : 'Carbon Footprint',
      color: type === 'energy' ? '#e95f2a' : 
             type === 'water' ? '#73a4b7' : '#647991',
      data: data.map(point => ({
        x: point.date,
        y: point.value
      }))
    }];
  }, [data, type]);
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full h-80 shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="w-full h-80 shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-2" />
          <p className="text-muted-foreground text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  // No data state
  if (!chartData.length || chartData[0].data.length === 0) {
    return (
      <Card className="w-full h-80 shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No consumption data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full h-80 shadow-md">
      <CardHeader className="gradient-blue text-white border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
            reverse: false
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Date',
            legendOffset: 40,
            legendPosition: 'middle'
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: unitLabel,
            legendOffset: -40,
            legendPosition: 'middle'
          }}
          enableGridX={false}
          enableGridY={true}
          colors={d => d.color}
          lineWidth={3}
          pointSize={8}
          pointColor="#ffffff"
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={true}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 0,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: 'circle',
              symbolBorderColor: 'rgba(0, 0, 0, .5)',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: 'rgba(0, 0, 0, .03)',
                    itemOpacity: 1
                  }
                }
              ]
            }
          ]}
        />
      </CardContent>
    </Card>
  );
}