import { ResponsiveBar } from "@nivo/bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AlertMetric {
  type: string;
  count: number;
  avgResolutionTime: number;
}

interface AlertMetricsChartProps {
  data: AlertMetric[];
}

export function AlertMetricsChart({ data }: AlertMetricsChartProps) {
  const chartData = data.map(metric => ({
    type: metric.type,
    count: metric.count,
    resolutionTime: metric.avgResolutionTime,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Metrics by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <ResponsiveBar
            data={chartData}
            keys={['count', 'resolutionTime']}
            indexBy="type"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={{ scheme: 'paired' }}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 1.6]]
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Alert Type',
              legendPosition: 'middle',
              legendOffset: 32
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Count / Resolution Time (min)',
              legendPosition: 'middle',
              legendOffset: -40
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            legends={[
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
                symbolSize: 20
              }
            ]}
            role="application"
            ariaLabel="Alert metrics chart"
          />
        </div>
      </CardContent>
    </Card>
  );
}
