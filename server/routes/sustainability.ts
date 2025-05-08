import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../middleware/auth";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { machines, machinePerformanceMetrics } from "@shared/schema";

export const registerSustainabilityRoutes = (router: Router) => {
  // Get sustainability metrics based on location, machine, and date range
  router.get("/api/reports/sustainability", isAuthenticated, async (req, res) => {
    try {
      const { locationId, machineId, from, to } = req.query;
      
      // Build date filters
      const fromDate = from ? new Date(from as string) : new Date(new Date().setDate(new Date().getDate() - 30));
      const toDate = to ? new Date(to as string) : new Date();

      // Ensure proper date filtering
      if (fromDate > toDate) {
        return res.status(400).json({ error: "Invalid date range: 'from' date must be before 'to' date" });
      }

      // Sample energy, water, and carbon data based on machine performance metrics
      const baseMetrics = await storage.db
        .select({
          id: machinePerformanceMetrics.id,
          machineId: machinePerformanceMetrics.machineId,
          date: machinePerformanceMetrics.date,
          uptime: machinePerformanceMetrics.uptime,
          cycleCount: machinePerformanceMetrics.cycleCount,
          averageCycleTime: machinePerformanceMetrics.averageCycleTime,
          temperature: machinePerformanceMetrics.temperature,
          waterUsage: machinePerformanceMetrics.waterUsage,
          energyUsage: machinePerformanceMetrics.energyUsage,
        })
        .from(machinePerformanceMetrics)
        .where(
          and(
            gte(machinePerformanceMetrics.date, fromDate),
            lte(machinePerformanceMetrics.date, toDate),
            // Add location filter if specified
            ...(locationId && locationId !== "all"
              ? [
                  eq(
                    machinePerformanceMetrics.machineId,
                    storage.db
                      .select({ id: machines.id })
                      .from(machines)
                      .where(eq(machines.locationId, parseInt(locationId as string)))
                  )
                ]
              : []),
            // Add machine filter if specified
            ...(machineId && machineId !== "all"
              ? [eq(machinePerformanceMetrics.machineId, parseInt(machineId as string))]
              : [])
          )
        )
        .orderBy(desc(machinePerformanceMetrics.date));

      // Get related machine information to include location name
      const machineIds = [...new Set(baseMetrics.map(metric => metric.machineId))];
      const machineData = await storage.db
        .select({
          id: machines.id,
          name: machines.name,
          locationId: machines.locationId,
          locationName: machines.location,
        })
        .from(machines)
        .where(
          machineIds.length > 0 
            ? eq(machines.id, machineIds[0]) 
            : undefined
        );

      // Create a lookup for machine to location mapping
      const machineLookup: Record<number, { name: string, location: string }> = {};
      machineData.forEach(machine => {
        machineLookup[machine.id] = {
          name: machine.name,
          location: machine.locationName || "Unknown Location"
        };
      });
      
      // Process metrics to calculate carbon footprint (approximation based on energy usage)
      // For this example, we use a simple conversion: 1 kWh = 0.5 kg CO2
      const carbonFactor = 0.5; // kg CO2 per kWh
      
      // Format the data for response
      const formattedData = baseMetrics.map(metric => {
        const machine = machineLookup[metric.machineId] || { name: `Machine ${metric.machineId}`, location: "Unknown Location" };
        
        return {
          date: metric.date.toISOString().split('T')[0], // YYYY-MM-DD format
          machineId: metric.machineId,
          machineName: machine.name,
          location: machine.location,
          energy: Math.round(metric.energyUsage * 100) / 100, // kWh to 2 decimal places
          water: Math.round(metric.waterUsage), // gallons, rounded to integer
          carbon: Math.round(metric.energyUsage * carbonFactor * 100) / 100, // kg CO2 to 2 decimal places
          cycles: metric.cycleCount,
          uptime: metric.uptime,
        };
      });
      
      // Group by date and location to summarize
      const groupedData: Record<string, any> = {};
      formattedData.forEach(item => {
        const key = `${item.date}-${item.location}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            date: item.date,
            location: item.location,
            energy: 0,
            water: 0,
            carbon: 0,
            cycles: 0,
          };
        }
        
        groupedData[key].energy += item.energy;
        groupedData[key].water += item.water;
        groupedData[key].carbon += item.carbon;
        groupedData[key].cycles += item.cycles;
      });
      
      // Convert back to array and sort by date
      const result = Object.values(groupedData).sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return res.json({ data: result });
    } catch (error) {
      console.error("Error fetching sustainability metrics:", error);
      return res.status(500).json({ error: "Failed to retrieve sustainability metrics" });
    }
  });
};