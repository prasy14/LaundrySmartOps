import { storage } from "../storage";
import { Alert, Machine } from "@shared/schema";

export class AnalyticsService {
  // Get all alerts with optional machine filter
  async getAlerts(machineId?: number): Promise<Alert[]> {
    console.log('[analytics] Getting alerts', machineId ? `for machine ${machineId}` : 'for all machines');
    try {
      const alerts = await storage.getAlerts(machineId);
      console.log(`[analytics] Retrieved ${alerts.length} alerts`);
      return alerts;
    } catch (error) {
      console.error('[analytics] Error getting alerts:', error);
      throw error;
    }
  }
  
  // Get service alerts by location
  async getAlertsByLocation(locationId: number): Promise<Alert[]> {
    console.log(`[analytics] Getting alerts for location ${locationId}`);
    try {
      const machines = await storage.getMachinesByLocation(locationId);
      console.log(`[analytics] Found ${machines.length} machines for location ${locationId}`);
      const machineIds = machines.map(m => m.id);
      const alerts = await storage.getAlertsByMachines(machineIds);
      console.log(`[analytics] Retrieved ${alerts.length} alerts for location ${locationId}`);
      return alerts;
    } catch (error) {
      console.error(`[analytics] Error getting alerts for location ${locationId}:`, error);
      throw error;
    }
  }

  // Get unresolved alerts by location
  async getUnresolvedAlertsByLocation(locationId: number): Promise<Alert[]> {
    console.log(`[analytics] Getting unresolved alerts for location ${locationId}`);
    try {
      const alerts = await this.getAlertsByLocation(locationId);
      const unresolvedAlerts = alerts.filter(alert => alert.status !== 'resolved' && alert.status !== 'cleared');
      console.log(`[analytics] Found ${unresolvedAlerts.length} unresolved alerts out of ${alerts.length} total`);
      return unresolvedAlerts;
    } catch (error) {
      console.error(`[analytics] Error getting unresolved alerts for location ${locationId}:`, error);
      throw error;
    }
  }

  // Get alerts by service type
  async getAlertsByServiceType(serviceType: string): Promise<Alert[]> {
    console.log(`[analytics] Getting alerts for service type ${serviceType}`);
    try {
      const alerts = await storage.getAlertsByServiceType(serviceType);
      console.log(`[analytics] Retrieved ${alerts.length} alerts for service type ${serviceType}`);
      return alerts;
    } catch (error) {
      console.error(`[analytics] Error getting alerts for service type ${serviceType}:`, error);
      throw error;
    }
  }

  // Calculate response time metrics
  async getAverageResponseTime(locationId?: number): Promise<number> {
    const alerts = locationId ? 
      await this.getAlertsByLocation(locationId) :
      await storage.getAlerts();
    
    const responseTimes = alerts
      .filter(alert => alert.responseTime != null)
      .map(alert => alert.responseTime!);

    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((acc, time) => acc + time, 0) / responseTimes.length;
  }

  // Calculate machine uptime metrics
  async getMachineUptimeMetrics(locationId?: number): Promise<{
    machines: Array<{
      id: number;
      name: string;
      uptime: number;
      totalRuntime: number;
      efficiency: number;
    }>;
    averageUptime: number;
    slaDetails: {
      target: number;
      actual: number;
      status: 'met' | 'warning' | 'breached';
    };
  }> {
    console.log(`[analytics] Getting machine uptime metrics`, locationId ? `for location ${locationId}` : 'for all locations');
    try {
      const machines = locationId ?
        await storage.getMachinesByLocation(locationId) :
        await storage.getMachines();
      
      console.log(`[analytics] Retrieved ${machines.length} machines for uptime calculation`);
      
      // Use default metrics or extract from performanceMetrics if available
      const machineMetrics = machines.map(machine => {
        // Default values
        let uptime = 0;
        let totalRuntime = 0;
        let cycles = 0;
        
        // Try to get metrics from various possible properties
        if (machine.performanceMetrics) {
          const perf = typeof machine.performanceMetrics === 'string' 
            ? JSON.parse(machine.performanceMetrics)
            : machine.performanceMetrics;
          
          uptime = perf.uptime || 0;
          totalRuntime = perf.totalRuntime || 0;
          cycles = perf.cycles || 0;
        }
        
        // Calculate efficiency
        const efficiency = totalRuntime > 0 ? cycles / totalRuntime : 0;
        
        return {
          id: machine.id,
          name: machine.name,
          uptime: uptime,
          totalRuntime: totalRuntime,
          efficiency: efficiency
        };
      });

      // Calculate average uptime
      const averageUptime = machines.length > 0 
        ? machineMetrics.reduce((acc, m) => acc + m.uptime, 0) / machines.length 
        : 0;
      
      // Generate SLA details
      const targetUptime = 95; // 95% is typical for enterprise equipment
      const actual = averageUptime;
      let status: 'met' | 'warning' | 'breached' = 'met';
      
      if (actual < targetUptime - 10) {
        status = 'breached';
      } else if (actual < targetUptime) {
        status = 'warning';
      }
      
      console.log(`[analytics] Machine uptime metrics calculated successfully. Average uptime: ${averageUptime.toFixed(2)}%`);

      return {
        machines: machineMetrics,
        averageUptime,
        slaDetails: {
          target: targetUptime,
          actual: actual,
          status: status
        }
      };
    } catch (error) {
      console.error('[analytics] Error calculating machine uptime metrics:', error);
      throw error;
    }
  }

  // Analyze error trends by timeframe
  async getErrorTrends(timeframe: 'day' | 'week' | 'month'): Promise<{
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byMachine: Record<string, number>;
    trends: Array<{
      errorType: string;
      count: number;
      avgResolutionTime: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>
  }> {
    console.log(`[analytics] Getting error trends for timeframe: ${timeframe}`);
    try {
      // Fetch all alerts
      const alerts = await storage.getAlerts();
      console.log(`[analytics] Retrieved ${alerts.length} alerts for error trend analysis`);
      
      // Filter alerts based on timeframe
      const cutoffDate = new Date();
      if (timeframe === 'day') {
        cutoffDate.setDate(cutoffDate.getDate() - 1);
      } else if (timeframe === 'week') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (timeframe === 'month') {
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      }
      
      const filteredAlerts = alerts.filter(alert => 
        new Date(alert.createdAt) >= cutoffDate
      );
      
      console.log(`[analytics] Filtered to ${filteredAlerts.length} alerts within the ${timeframe} timeframe`);
      
      // Aggregate by type, category and machine
      const byType = filteredAlerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byCategory = filteredAlerts.reduce((acc, alert) => {
        if (alert.category) {
          acc[alert.category] = (acc[alert.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const byMachine = filteredAlerts.reduce((acc, alert) => {
        acc[alert.machineId] = (acc[alert.machineId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate resolution time averages by type
      const resolutionTimes: Record<string, number[]> = {};
      filteredAlerts.forEach(alert => {
        if (alert.status === 'cleared' && alert.resolutionTime) {
          if (!resolutionTimes[alert.type]) {
            resolutionTimes[alert.type] = [];
          }
          resolutionTimes[alert.type].push(alert.resolutionTime);
        }
      });
      
      // Determine trends compared to previous period
      const previousCutoffDate = new Date(cutoffDate);
      if (timeframe === 'day') {
        previousCutoffDate.setDate(previousCutoffDate.getDate() - 1);
      } else if (timeframe === 'week') {
        previousCutoffDate.setDate(previousCutoffDate.getDate() - 7);
      } else if (timeframe === 'month') {
        previousCutoffDate.setMonth(previousCutoffDate.getMonth() - 1);
      }
      
      const previousPeriodAlerts = alerts.filter(alert => 
        new Date(alert.createdAt) >= previousCutoffDate && 
        new Date(alert.createdAt) < cutoffDate
      );
      
      const previousByType = previousPeriodAlerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Generate trend data for report
      const trends = Object.keys(byType).map(errorType => {
        const count = byType[errorType];
        const prevCount = previousByType[errorType] || 0;
        
        // Determine trend
        let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (count > prevCount * 1.1) { // 10% increase
          trendDirection = 'increasing';
        } else if (count < prevCount * 0.9) { // 10% decrease
          trendDirection = 'decreasing';
        }
        
        // Calculate average resolution time
        const resolutionArray = resolutionTimes[errorType] || [];
        const avgResolutionTime = resolutionArray.length > 0
          ? resolutionArray.reduce((sum, time) => sum + time, 0) / resolutionArray.length
          : 0;
          
        return {
          errorType,
          count,
          avgResolutionTime,
          trend: trendDirection
        };
      });
      
      console.log(`[analytics] Generated error trends with ${trends.length} error types`);

      return {
        byType,
        byCategory,
        byMachine,
        trends
      };
    } catch (error) {
      console.error('[analytics] Error analyzing error trends:', error);
      throw error;
    }
  }

  // Get sustainability metrics
  async getSustainabilityMetrics(locationId?: number): Promise<{
    waterConsumption: number;
    energyConsumption: number;
    efficiency: number;
    co2Reduction: number;
    waterSavings: number;
  }> {
    console.log(`[analytics] Getting sustainability metrics`, locationId ? `for location ${locationId}` : 'for all locations');
    try {
      const machines = locationId ?
        await storage.getMachinesByLocation(locationId) :
        await storage.getMachines();
      
      console.log(`[analytics] Retrieved ${machines.length} machines for sustainability metrics calculation`);

      // Extract sustainability metrics from each machine
      const metrics = machines.reduce((acc, machine) => {
        let waterConsumption = 0;
        let energyConsumption = 0;
        
        // Try to get metrics from the performanceMetrics property
        if (machine.performanceMetrics) {
          const perf = typeof machine.performanceMetrics === 'string' 
            ? JSON.parse(machine.performanceMetrics)
            : machine.performanceMetrics;
            
          waterConsumption = perf.waterConsumption || 0;
          energyConsumption = perf.energyConsumption || 0;
        }
        
        acc.waterConsumption += waterConsumption;
        acc.energyConsumption += energyConsumption;
        return acc;
      }, {
        waterConsumption: 0,
        energyConsumption: 0,
      });

      // Calculate efficiency ratio
      const efficiency = machines.length > 0 ?
        ((metrics.waterConsumption / 1000) + (metrics.energyConsumption / 100)) / machines.length :
        0;
        
      // Calculate additional environmental metrics
      // CO2 reduction (estimated): 0.5kg CO2 per kWh saved
      const co2Reduction = metrics.energyConsumption * 0.5 / 1000;
      
      // Water savings compared to industry average (estimated)
      const waterSavings = machines.length * 150 - metrics.waterConsumption;

      console.log(`[analytics] Sustainability metrics calculated successfully:`, {
        waterConsumption: metrics.waterConsumption,
        energyConsumption: metrics.energyConsumption,
        efficiency,
        co2Reduction,
        waterSavings
      });

      return {
        ...metrics,
        efficiency,
        co2Reduction: co2Reduction > 0 ? co2Reduction : 0,
        waterSavings: waterSavings > 0 ? waterSavings : 0
      };
    } catch (error) {
      console.error('[analytics] Error calculating sustainability metrics:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
