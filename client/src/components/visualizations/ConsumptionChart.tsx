import { useMemo } from "react";
import { Line } from "@nivo/line";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ConsumptionChartProps {
  data?: {
    locationName: string;
    data: {
      date: string;
      energy: number;
      water: number;
    }[];
  }[];
  title: string;
  type: 'energy' | 'water';
  isLoading?: boolean;
}

export function ConsumptionChart({
  data = [],
  title,
  type,
  isLoading = false
}: ConsumptionChartProps) {
  const chartData = useMemo(() => {
    // Format data for Nivo Line Chart
    return data.map(location => ({
      id: location.locationName,
      data: location.data.map(item => ({
        x: new Date(item.date).toLocaleDateString(),
        y: type === 'energy' ? item.energy : item.water
      }))
    }));
  }, [data, type]);

  if (isLoading) {
    return (
      <Card className="w-full h-72">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-56">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="w-full h-72">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-56">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-72">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <Line
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            min: "auto",
            max: "auto",
            stacked: false,
            reverse: false
          }}
          yFormat=" >-.2f"
          curve="monotoneX"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: "Date",
            legendOffset: 40,
            legendPosition: "middle"
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: type === 'energy' ? "Energy (kWh)" : "Water (gallons)",
            legendOffset: -40,
            legendPosition: "middle"
          }}
          pointSize={10}
          pointColor={{ theme: "background" }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          pointLabelYOffset={-12}
          useMesh={true}
          legends={[
            {
              anchor: "top",
              direction: "row",
              justify: false,
              translateX: 0,
              translateY: -20,
              itemsSpacing: 0,
              itemDirection: "left-to-right",
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: "circle",
              symbolBorderColor: "rgba(0, 0, 0, .5)",
              effects: [
                {
                  on: "hover",
                  style: {
                    itemBackground: "rgba(0, 0, 0, .03)",
                    itemOpacity: 1
                  }
                }
              ]
            }
          ]}
          theme={{
            axis: {
              ticks: {
                text: {
                  fontSize: 11,
                }
              },
              legend: {
                text: {
                  fontSize: 12,
                  fontWeight: 'bold',
                }
              }
            },
            grid: {
              line: {
                stroke: "#e2e8f0",
                strokeWidth: 1
              }
            },
            tooltip: {
              container: {
                background: '#ffffff',
                fontSize: 12,
                borderRadius: 4,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }
            }
          }}
        />
      </CardContent>
    </Card>
  );
}