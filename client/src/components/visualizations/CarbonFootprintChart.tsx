import { ResponsiveBar } from "@nivo/bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useMemo } from "react";

interface CarbonFootprintDataPoint {
  date: string;
  value: number;
  location?: string;
}

interface CarbonFootprintChartProps {
  data?: CarbonFootprintDataPoint[];
  title?: string;
  isLoading?: boolean;
  error?: string;
  showLocationBreakdown?: boolean;
}

export function CarbonFootprintChart({
  data = [],
  title = "Carbon Footprint (kg CO₂e)",
  isLoading = false,
  error = "",
  showLocationBreakdown = false
}: CarbonFootprintChartProps) {
  
  // Prepare chart data in the right format for Nivo
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(point => ({
      date: point.date,
      value: point.value,
      location: point.location || 'Unknown'
    }));
  }, [data]);
  
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
  if (!chartData.length) {
    return (
      <Card className="w-full h-80 shadow-md">
        <CardHeader className="gradient-blue text-white border-b">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No carbon footprint data available</p>
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
        <ResponsiveBar
          data={chartData}
          keys={showLocationBreakdown ? ['value'] : ['value']}
          indexBy="date"
          margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={showLocationBreakdown 
            ? { scheme: 'nivo' } 
            : () => '#647991'} // Using the slate blue color for non-location breakdown
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Date',
            legendPosition: 'middle',
            legendOffset: 40
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Carbon Emissions (kg CO₂e)',
            legendPosition: 'middle',
            legendOffset: -50
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 1.6]]
          }}
          legends={showLocationBreakdown ? [
            {
              dataFrom: 'keys',
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 120,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: 'left-to-right',
              itemOpacity: 0.85,
              symbolSize: 20,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemOpacity: 1
                  }
                }
              ]
            }
          ] : []}
          role="application"
          ariaLabel="Carbon footprint chart"
          barAriaLabel={e => `${e.id}: ${e.formattedValue} kg CO₂e on date: ${e.indexValue}`}
          tooltip={({ id, value, color, indexValue }) => (
            <div
              style={{
                padding: 12,
                background: '#fff',
                color: '#333',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <strong>{indexValue}</strong>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'block',
                    width: 12,
                    height: 12,
                    background: color,
                    marginRight: 8,
                  }}
                />
                <span>
                  {value} kg CO₂e
                </span>
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}