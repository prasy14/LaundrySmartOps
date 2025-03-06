import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function Admin() {
  const { toast } = useToast();

  // Fetch last sync info
  const { data: syncInfo } = useQuery({
    queryKey: ['/api/admin/sync-info'],
  });

  // Mutation for triggering location sync
  const locationSyncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/sync/locations');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sync-info'] });
      toast({
        title: "Success",
        description: "Locations synced successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sync locations",
      });
    },
  });

  // Mutation for triggering machine sync
  const machineSyncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/sync/machines');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sync-info'] });
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Sync Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Location Synchronization</CardTitle>
                <Button 
                  onClick={() => locationSyncMutation.mutate()} 
                  disabled={locationSyncMutation.isPending}
                >
                  {locationSyncMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Locations
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Last Sync Status:</span>
                  {syncInfo?.lastLocationSync?.success ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Success</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Failed</span>
                    </>
                  )}
                </div>
                {syncInfo?.lastLocationSync?.timestamp && (
                  <p className="text-sm text-muted-foreground">
                    Last synced: {format(new Date(syncInfo.lastLocationSync.timestamp), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Machine Sync Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Machine Synchronization</CardTitle>
                <Button 
                  onClick={() => machineSyncMutation.mutate()} 
                  disabled={machineSyncMutation.isPending}
                >
                  {machineSyncMutation.isPending ? (
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Last Sync Status:</span>
                  {syncInfo?.lastMachineSync?.success ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Success</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Failed</span>
                    </>
                  )}
                </div>
                {syncInfo?.lastMachineSync?.timestamp && (
                  <p className="text-sm text-muted-foreground">
                    Last synced: {format(new Date(syncInfo.lastMachineSync.timestamp), 'MMM d, h:mm a')}
                  </p>
                )}
                {syncInfo?.lastMachineSync?.machineCount && (
                  <p className="text-sm text-muted-foreground">
                    Machines synced: {syncInfo.lastMachineSync.machineCount}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}