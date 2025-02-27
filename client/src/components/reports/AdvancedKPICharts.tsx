import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { Machine } from "@shared/schema";

// Helper function to generate sample data for the charts
function generateChartData(machines: Machine[]) {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${i.toString().padStart(2, '0')}:00`,
    uptime: machines.reduce((acc, m) => acc + (m.metrics?.uptime || 0), 0) / machines.length,
    errors: machines.reduce((acc, m) => acc + (m.metrics?.errors || 0), 0),
    usage: Math.floor(Math.random() * 100), // Replace with actual usage data
    responseTime: Math.floor(Math.random() * 1000) // Replace with actual response time data
  }));
}

export function AdvancedKPICharts() {
  const { data } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines']
  });

  if (!data) return null;

  const chartData = generateChartData(data.machines);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Service Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: 'var(--foreground)' }}
                />
                <YAxis 
                  tick={{ fill: 'var(--foreground)' }}
                  label={{ 
                    value: 'Response Time (ms)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: 'var(--foreground)'
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="responseTime"
                  stroke="var(--primary)"
                  fillOpacity={1}
                  fill="url(#responseTimeGradient)"
                  name="Response Time"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Machine Usage vs Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: 'var(--foreground)' }}
                />
                <YAxis 
                  tick={{ fill: 'var(--foreground)' }}
                  label={{ 
                    value: 'Count', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: 'var(--foreground)'
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="usage"
                  stroke="var(--primary)"
                  fillOpacity={1}
                  fill="url(#usageGradient)"
                  name="Usage %"
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  stroke="var(--destructive)"
                  fillOpacity={1}
                  fill="url(#errorGradient)"
                  name="Errors"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
