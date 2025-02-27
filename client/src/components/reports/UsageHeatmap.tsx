import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Machine } from "@shared/schema";

// Helper function to generate sample data for the heatmap
function generateHeatmapData(machines: Machine[]) {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // In a real application, this would come from actual usage data
  return days.map(day => ({
    id: day,
    data: hours.map(hour => ({
      x: hour,
      y: Math.floor(Math.random() * 100) // Replace with actual usage data
    }))
  }));
}

export function UsageHeatmap() {
  const { data } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines']
  });

  if (!data) return null;

  const heatmapData = generateHeatmapData(data.machines);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Machine Usage Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveHeatMap
            data={heatmapData}
            margin={{ top: 20, right: 90, bottom: 60, left: 90 }}
            valueFormat=">-.2s"
            axisTop={null}
            axisRight={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -90,
              legend: '',
              legendPosition: 'middle',
              legendOffset: 70
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Day',
              legendPosition: 'middle',
              legendOffset: -72
            }}
            colors={{
              type: 'sequential',
              scheme: 'blues'
            }}
            emptyColor="#555555"
            borderRadius={4}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 0.6]]
            }}
            enableLabels={false}
            legends={[
              {
                anchor: 'bottom',
                translateX: 0,
                translateY: 30,
                length: 400,
                thickness: 8,
                direction: 'row',
                tickPosition: 'after',
                tickSize: 3,
                tickSpacing: 4,
                tickOverlap: false,
                title: 'Usage %',
                titleAlign: 'start',
                titleOffset: 4
              }
            ]}
            theme={{
              textColor: "var(--foreground)",
              fontSize: 12,
              axis: {
                ticks: {
                  text: {
                    fill: "var(--muted-foreground)"
                  }
                }
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
