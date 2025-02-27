import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Machine } from "@shared/schema";

export function PerformanceChart() {
  const { data } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines']
  });

  if (!data) return null;

  // Generate sample data for the last 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const chartData = dates.map(date => ({
    date,
    uptime: data.machines.reduce((acc, m) => acc + (m.metrics?.uptime || 0), 0) / data.machines.length,
    errors: data.machines.reduce((acc, m) => acc + (m.metrics?.errors || 0), 0)
  }));

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'var(--foreground)' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'var(--foreground)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="uptime" 
                stroke="var(--primary)" 
                strokeWidth={2}
                name="Uptime %"
              />
              <Line 
                type="monotone" 
                dataKey="errors" 
                stroke="var(--destructive)" 
                strokeWidth={2}
                name="Errors"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
