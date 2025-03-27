import { ResponsiveLine } from "@nivo/line";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataPoint {
  timestamp: string;
  value: number;
}

interface PerformanceChartProps {
  data: DataPoint[];
  title: string;
  yAxisLabel: string;
  color?: string;
}

export function PerformanceChart({ data, title, yAxisLabel, color = "#73a4b7" }: PerformanceChartProps) {
  const chartData = [
    {
      id: title,
      color,
      data: data.map(point => ({
        x: new Date(point.timestamp).toLocaleString(),
        y: point.value
      }))
    }
  ];

  return (
    <Card className="shadow-md">
      <CardHeader className="gradient-blue text-white border-b">
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-white/80 text-sm">Performance metrics over time</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div style={{ height: '300px' }}>
          <ResponsiveLine
            data={chartData}
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
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
              legend: 'Time',
              legendOffset: 36,
              legendPosition: 'middle'
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: yAxisLabel,
              legendOffset: -40,
              legendPosition: 'middle'
            }}
            pointSize={10}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)'
              }
            ]}
          />
        </div>
      </CardContent>
    </Card>
  );
}
