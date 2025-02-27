import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Location } from "@shared/schema";

export default function LocationsPage() {
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/locations', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to sync locations');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Locations synced successfully",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync locations",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">Error loading locations: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Locations</h1>
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
              Sync Locations
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.locations.map((location) => (
          <Card key={location.id}>
            <CardHeader>
              <CardTitle>{location.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{location.address}</p>
              <p className="text-sm text-gray-500">Status: {location.status}</p>
              {location.timezone && (
                <p className="text-sm text-gray-500">Timezone: {location.timezone}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {data?.locations.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No locations found. Click the sync button to fetch locations from SQ Insights.</p>
          </div>
        )}
      </div>
    </div>
  );
}