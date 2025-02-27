import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { Alert as AlertType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function AlertsList() {
  const { data, refetch } = useQuery<{ alerts: AlertType[] }>({
    queryKey: ['/api/alerts']
  });

  const handleClearAlert = async (id: number) => {
    await apiRequest('POST', `/api/alerts/${id}/clear`);
    refetch();
  };

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.alerts
          .filter(alert => alert.status === 'active')
          .map((alert) => (
          <Alert 
            key={alert.id}
            variant={alert.type === 'error' ? 'destructive' : 'default'}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>Machine #{alert.machineId}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearAlert(alert.id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </AlertTitle>
            <AlertDescription className="flex flex-col">
              <span>{alert.message}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
              </span>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
