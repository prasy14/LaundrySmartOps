import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WashingMachine, AlertTriangle, Clock } from "lucide-react";
import type { Machine } from "@shared/schema";

export function MachineGrid() {
  const { data } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines']
  });

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.machines.map((machine) => (
        <Card key={machine.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {machine.name}
            </CardTitle>
            <Badge 
              variant={machine.status === 'online' ? 'default' : 
                      machine.status === 'offline' ? 'destructive' : 'warning'}
            >
              {machine.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <WashingMachine className="h-4 w-4" />
                <span>{machine.location}</span>
              </div>
              {machine.metrics && (
                <>
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{machine.metrics.errors} errors today</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{Math.round(machine.metrics.uptime)}% uptime</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
