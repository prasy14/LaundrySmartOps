import { ResponsiveBar } from "@nivo/bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import type { Location } from "@shared/schema";

interface AlertMetric {
  type: string;
  count: number;
  avgResolutionTime: number;
  locationId?: number;
}

interface AlertMetricsChartProps {
  data: AlertMetric[];
  locations?: Location[];
}

export function AlertMetricsChart({ data, locations }: AlertMetricsChartProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [filteredData, setFilteredData] = useState(data);
  
  useEffect(() => {
    if (selectedLocation === "all") {
      setFilteredData(data);
    } else {
      const locationId = parseInt(selectedLocation, 10);
      setFilteredData(data.filter(metric => metric.locationId === locationId));
    }
  }, [selectedLocation, data]);
  
  const chartData = filteredData.map(metric => ({
    type: metric.type,
    count: metric.count,
    resolutionTime: metric.avgResolutionTime,
  }));

  return (
    <Card className="shadow-md">
      <CardHeader className="gradient-blue text-white border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Alert Metrics by Type</CardTitle>
            <p className="text-white/80 text-sm">Alert frequency and resolution times</p>
          </div>
          {locations && locations.length > 0 && (
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Select Location" />
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
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div style={{ height: '300px' }}>
          <ResponsiveBar
            data={chartData}
            keys={['count', 'resolutionTime']}
            indexBy="type"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={['#73a4b7', '#e95f2a']}
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
