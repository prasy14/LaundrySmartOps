import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MapPin, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Campus {
  id: number;
  campusId: string;
  campusName: string;
  createdAt: string;
  updatedAt: string;
}

interface Location {
  id: number;
  name: string;
  locationName: string;
  campusId: number;
  externalId: string;
  timezone: string;
  status: string;
}

export default function CampusesPage() {
  const { toast } = useToast();

  // Fetch campuses data
  const { data: campusesData, isLoading: campusesLoading } = useQuery<{ campuses: Campus[] }>({
    queryKey: ['/api/campuses'],
  });

  // Fetch locations data
  const { data: locationsData, isLoading: locationsLoading } = useQuery<{ locations: Location[] }>({
    queryKey: ['/api/locations'],
  });

  const campuses = campusesData?.campuses || [];
  const locations = locationsData?.locations || [];

  // Group locations by campus
  const locationsByCampus = locations.reduce((acc, location) => {
    const campusId = location.campusId;
    if (!acc[campusId]) {
      acc[campusId] = [];
    }
    acc[campusId].push(location);
    return acc;
  }, {} as Record<number, Location[]>);

  const handleGenerateCampusData = async () => {
    try {
      const response = await fetch('/api/campuses/generate', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: result.message || "Campus data generated successfully",
        });
        
        // Refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/campuses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      } else {
        throw new Error('Failed to generate campus data');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate campus data",
        variant: "destructive",
      });
    }
  };

  if (campusesLoading || locationsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-blue bg-clip-text text-transparent">
            Campus Management
          </h1>
          <p className="text-gray-600 mt-2">
            Organize and manage laundry locations by campus
          </p>
        </div>
        <Button onClick={handleGenerateCampusData} className="bg-blue-600 hover:bg-blue-700">
          <RotateCcw className="w-4 h-4 mr-2" />
          Regenerate Campus Data
        </Button>
      </div>

      {/* Campus Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campuses</p>
                <p className="text-2xl font-bold text-gray-900">{campuses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Locations</p>
                <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Locations/Campus</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campuses.length > 0 ? Math.round(locations.length / campuses.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campus Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {campuses.map((campus) => {
          const campusLocations = locationsByCampus[campus.id] || [];
          
          return (
            <Card key={campus.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="gradient-blue text-white">
                <CardTitle className="flex items-center justify-between">
                  <span>{campus.campusName}</span>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {campusLocations.length} locations
                  </Badge>
                </CardTitle>
                <p className="text-blue-100 text-sm">ID: {campus.campusId}</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Locations:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {campusLocations.length > 0 ? (
                        campusLocations.map((location) => (
                          <div
                            key={location.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                          >
                            <span className="text-gray-700">{location.locationName}</span>
                            <Badge 
                              variant={location.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {location.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No locations found</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Created:</span>
                      <span>{new Date(campus.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {campuses.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Campuses Found</h3>
            <p className="text-gray-600 mb-4">
              Generate campus data from your existing locations to get started.
            </p>
            <Button onClick={handleGenerateCampusData} className="bg-blue-600 hover:bg-blue-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Generate Campus Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}