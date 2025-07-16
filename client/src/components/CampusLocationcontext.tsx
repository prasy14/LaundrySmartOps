import React, { createContext, useContext, useState } from "react";

type CampusLocationContextType = {
  selectedCampus: string;
  selectedLocation: string;
  setSelectedCampus: (campus: string) => void;
  setSelectedLocation: (location: string) => void;
};

const CampusLocationContext = createContext<CampusLocationContextType | undefined>(undefined);

export const CampusLocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCampus, setSelectedCampus] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  return (
    <CampusLocationContext.Provider value={{ selectedCampus, selectedLocation, setSelectedCampus, setSelectedLocation }}>
      {children}
    </CampusLocationContext.Provider>
  );
};

export const useCampusLocation = (): CampusLocationContextType => {
  const context = useContext(CampusLocationContext);
  if (!context) {
    throw new Error("useCampusLocation must be used within a CampusLocationProvider");
  }
  return context;
};
