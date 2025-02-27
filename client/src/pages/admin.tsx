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

  // Mutation for triggering sync
  const syncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/sync/machines');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sync-info'] });
      toast({
        title: "Success",
        description: "API sync completed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sync with API",
      });
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>API Synchronization</CardTitle>
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
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Last Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {syncInfo?.lastSync?.success ? (
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
                  {syncInfo?.lastSync?.error && (
                    <p className="text-sm text-red-500 mt-2">
                      Error: {syncInfo.lastSync.error}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Last Sync Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {syncInfo?.lastSync?.timestamp ? (
                    <span>{format(new Date(syncInfo.lastSync.timestamp), 'MMM d, h:mm a')}</span>
                  ) : (
                    <span>Never</span>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Machines Synced</CardTitle>
                </CardHeader>
                <CardContent>
                  <span>{syncInfo?.lastSync?.machineCount || 0} machines</span>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
