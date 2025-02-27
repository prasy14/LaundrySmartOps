import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WashingMachine, AlertTriangle, Clock, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Machine } from "@shared/schema";

export function MachineGrid() {
  const { toast } = useToast();
  const { data, isLoading: isLoadingMachines } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines']
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/sync/machines');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      toast({
        title: "Success",
        description: "Machines synced successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sync machines",
      });
    },
  });

  if (isLoadingMachines) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Machines</h2>
        <Button 
          onClick={() => syncMutation.mutate()} 
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Machines
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.machines.map((machine) => (
          <Card key={machine.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {machine.name}
              </CardTitle>
              <Badge 
                variant={machine.status === 'online' ? 'default' : 
                        machine.status === 'offline' ? 'destructive' : 'outline'}
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
    </div>
  );
}