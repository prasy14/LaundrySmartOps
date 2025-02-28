import { Header } from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Alert, Machine } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: alertsData, isLoading: alertsLoading } = useQuery<{ alerts: Alert[] }>({
    queryKey: ['/api/alerts'],
  });

  const { data: machinesData } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines'],
  });

  if (alertsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getMachineName = (machineId: number) => {
    const machine = machinesData?.machines.find(m => m.id === machineId);
    return machine?.name || 'Unknown Machine';
  };

  const highPriorityAlerts = alertsData?.alerts.filter(alert => 
    alert.status !== 'cleared' && alert.priority === 'high'
  ) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header />
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>High Priority Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {highPriorityAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{getMachineName(alert.machineId)}</h3>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reported: {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <Badge variant="destructive">{alert.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {highPriorityAlerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No high priority alerts at this time.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}