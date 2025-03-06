import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Location } from "@shared/schema";

export default function LocationsPage() {
  const { data, isLoading, error } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">Loading...</div>
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
        <h1 className="text-2xl font-bold">All Locations</h1>
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
            <p className="text-gray-500">No locations found. Contact an administrator to sync locations from SQ Insights.</p>
          </div>
        )}
      </div>
    </div>
  );
}