import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarDatum, ResponsiveBar } from "@nivo/bar";
import { Loader2 } from "lucide-react";

// Define the data structure
interface MetricsData {
  month: string;
  total: number;
  critical: number;
  major: number;
  minor: number;
  resolved: number;
  responseTime: number;
}

interface AlertMetricsChartProps {
  data?: MetricsData[];
  title?: string;
  isLoading?: boolean;
  type?: 'volume' | 'response';
}

type VolumeData = {
  month: string;
  critical: number;
  major: number;
  minor: number;
}

type ResponseData = {
  month: string;
  "Resolved": number;
  "Avg. Response Time": number;
}

export function AlertMetricsChart({
  data = [],
  title = "Alert Metrics",
  isLoading = false,
  type = 'volume'
}: AlertMetricsChartProps) {
  
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
          <p className="text-muted-foreground">No metric data available</p>
        </CardContent>
      </Card>
    );
  }
  
  if (type === 'volume') {
    const volumeData = data.map(item => ({
      month: item.month,
      critical: item.critical,
      major: item.major,
      minor: item.minor
    }));
    
    return (
      <Card className="w-full h-80">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <VolumeBarChart data={volumeData} />
        </CardContent>
      </Card>
    );
  } else {
    const responseData = data.map(item => ({
      month: item.month,
      "Resolved": item.resolved,
      "Avg. Response Time": item.responseTime
    }));
    
    return (
      <Card className="w-full h-80">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponseBarChart data={responseData} />
        </CardContent>
      </Card>
    );
  }
}

function VolumeBarChart({ data }: { data: VolumeData[] }) {
  return (
    <ResponsiveBar
      data={data}
      keys={['critical', 'major', 'minor']}
      indexBy="month"
      margin={{ top: 10, right: 130, bottom: 50, left: 60 }}
      padding={0.3}
      groupMode="grouped"
      valueScale={{ type: 'linear' }}
      indexScale={{ type: 'band', round: true }}
      colors={{ scheme: 'nivo' }}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -45,
        legend: 'Month',
        legendPosition: 'middle',
        legendOffset: 40
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Alert Count',
        legendPosition: 'middle',
        legendOffset: -40
      }}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
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
      ]}
    />
  );
}

function ResponseBarChart({ data }: { data: ResponseData[] }) {
  return (
    <ResponsiveBar
      data={data}
      keys={['Resolved', 'Avg. Response Time']}
      indexBy="month"
      margin={{ top: 10, right: 130, bottom: 50, left: 60 }}
      padding={0.3}
      groupMode="stacked"
      valueScale={{ type: 'linear' }}
      indexScale={{ type: 'band', round: true }}
      colors={{ scheme: 'nivo' }}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -45,
        legend: 'Month',
        legendPosition: 'middle',
        legendOffset: 40
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Minutes / Count',
        legendPosition: 'middle',
        legendOffset: -40
      }}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
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
      ]}
    />
  );
}