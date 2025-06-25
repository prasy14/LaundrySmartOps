import { storage } from "../storage";
import { Location, Machine } from "@shared/schema";

export class AnalyticsService {

  async getUnresolvedAlertsByLocation(locationId: number) {
   try {
      let machines: Machine[];
      
      if (locationId) {
        machines = await storage.getMachinesByLocation(locationId);
      } else {
        machines = await storage.getMachines();
      }
      
      if (!machines.length) {
        return {
          machines: [],
          aggregated: {
            totalMachines: 0,
            uptimePercentage: 0
          }
        };
      }
      
      // Normally we'd calculate this from historical data
      // but for now we just use a placeholder value
      const averageUptime = 0.00; // 0%
      
      console.log("[analytics] Retrieved", machines.length, "machines for uptime calculation");
      console.log("[analytics] Machine uptime metrics calculated successfully. Average uptime:", (averageUptime * 100).toFixed(2) + "%");
      
      return {
        machines: machines,
        aggregated: {
          totalMachines: machines.length,
          uptimePercentage: averageUptime
        }
      };
    } catch (error) {
      console.error("[analytics] Error calculating machine uptime:", error);
      throw error;
    }
  }
  /**
   * Calculate machine uptime metrics
   */
  async getMachineUptimeMetrics(locationId?: number) {
    try {
      let machines: Machine[];
      
      if (locationId) {
        machines = await storage.getMachinesByLocation(locationId);
      } else {
        machines = await storage.getMachines();
      }
      
      if (!machines.length) {
        return {
          machines: [],
          aggregated: {
            totalMachines: 0,
            uptimePercentage: 0
          }
        };
      }
      
      // Normally we'd calculate this from historical data
      // but for now we just use a placeholder value
      const averageUptime = 0.00; // 0%
      
      console.log("[analytics] Retrieved", machines.length, "machines for uptime calculation");
      console.log("[analytics] Machine uptime metrics calculated successfully. Average uptime:", (averageUptime * 100).toFixed(2) + "%");
      
      return {
        machines: machines,
        aggregated: {
          totalMachines: machines.length,
          uptimePercentage: averageUptime
        }
      };
    } catch (error) {
      console.error("[analytics] Error calculating machine uptime:", error);
      throw error;
    }
  }
  
  /**
   * Generate machine usage patterns data
   */
  async getMachineUsagePatterns(locationId?: number) {
    try {
      let machines: Machine[];
      let locations: Location[] = [];
      
      if (locationId) {
        machines = await storage.getMachinesByLocation(locationId);
        const location = await storage.getLocation(locationId);
        if (location) {
          locations = [location];
        }
      } else {
        machines = await storage.getMachines();
        locations = await storage.getLocations();
      }
      
      // Generate usage data
      const usageData = this.generateUsageData(locations);
      console.log("[analytics] Generated", usageData.length, "usage data points");
      
      return {
        usageData,
        locations: locations.map(l => l.name)
      };
    } catch (error) {
      console.error("[analytics] Error generating machine usage patterns:", error);
      throw error;
    }
  }
  
  /**
   * Generate usage data patterns
   * This is a placeholder until we have real usage data
   */
  private generateUsageData(locations: Location[]) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = [];
    
    for (let day of days) {
      for (let hour = 0; hour < 24; hour++) {
        // Create usage patterns with higher usage during daytime and weekdays
        let baseValue = 0;
        
        // Lower usage at night (0-6, 22-23)
        if (hour < 6 || hour >= 22) {
          baseValue = 10;
        } 
        // Medium usage in early morning and evening (6-8, 19-21)
        else if ((hour >= 6 && hour < 8) || (hour >= 19 && hour < 22)) {
          baseValue = 40;
        }
        // Peak usage during day (8-19)
        else {
          baseValue = 70;
        }
        
        // Lower usage on weekends
        if (day === 'Saturday' || day === 'Sunday') {
          baseValue = Math.max(5, baseValue * 0.6);
        }
        
        // Generate data for each location
        for (const location of locations) {
          // Add some variance
          const value = Math.min(100, Math.max(0, baseValue + (Math.random() * 20 - 10)));
          
          data.push({
            day,
            hour,
            value: Math.round(value),
            location: location.name
          });
        }
      }
    }
    
    return data;
  }
}

export const analyticsService = new AnalyticsService();