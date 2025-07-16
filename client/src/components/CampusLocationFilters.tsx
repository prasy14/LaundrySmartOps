import { useCampusLocation } from "@/components/CampusLocationcontext";
import SearchableDropdown from "@/pages/SearchableDropdown";
import { extractCampusAndLocation } from "@/utils/helpers";
import { Location } from "@shared/schema"; 


interface CampusLocationFiltersProps {
  locations: Location[];
}


export const CampusLocationFilters = ({ locations }: CampusLocationFiltersProps) => {
  const {
    selectedCampus,
    setSelectedCampus,
    selectedLocation,
    setSelectedLocation,
  } = useCampusLocation();

  const campusOptions = Array.from(
    new Set(locations.map((loc: Location) => extractCampusAndLocation(loc.name).campus))
  ).sort();

  // 🔧 Filter locations based on selected campus
  const filteredLocations = selectedCampus === "all"
    ? locations
    : locations.filter(
        (loc: Location) =>
          extractCampusAndLocation(loc.name).campus === selectedCampus
      );

  return (
    <div className="flex gap-2">
      <SearchableDropdown
        value={selectedCampus}
        onChange={(campusId) => {
          setSelectedCampus(campusId);
          setSelectedLocation("all"); // 🔁 reset location when campus changes
        }}
        options={[
          { id: "all", name: "All Campuses" },
          ...campusOptions.map((campus) => ({
            id: campus,
            name: campus,
          })),
        ]}
      />

      <SearchableDropdown
        value={selectedLocation}
        onChange={setSelectedLocation}
        options={[
          { id: "all", name: "All Locations" },
          ...filteredLocations.map((location: Location) => {
            const { location: locName } = extractCampusAndLocation(location.name);
            return {
              id: location.id.toString(),
              name: locName,
            };
          }),
        ]}
      />
    </div>
  );
};
