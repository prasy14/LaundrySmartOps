import { storage } from "../storage";
import { Alert, Machine } from "@shared/schema";

export class AnalyticsService {
  // Get all alerts with optional machine filter
  async getAlerts(machineId?: number): Promise<Alert[]> {
    return await storage.getAlerts(machineId);
  }
  
  // Get service alerts by location
  async getAlertsByLocation(locationId: number): Promise<Alert[]> {
    const machines = await storage.getMachinesByLocation(locationId);
    const machineIds = machines.map(m => m.id);
    return await storage.getAlertsByMachines(machineIds);
  }

  // Get unresolved alerts by location
  async getUnresolvedAlertsByLocation(locationId: number): Promise<Alert[]> {
    const alerts = await this.getAlertsByLocation(locationId);
    return alerts.filter(alert => alert.status !== 'resolved' && alert.status !== 'cleared');
  }

  // Get alerts by service type
  async getAlertsByServiceType(serviceType: string): Promise<Alert[]> {
    return await storage.getAlertsByServiceType(serviceType);
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
  }> {
    const machines = locationId ?
      await storage.getMachinesByLocation(locationId) :
      await storage.getMachines();

    const machineMetrics = machines.map(machine => ({
      id: machine.id,
      name: machine.name,
      uptime: machine.metrics?.uptime || 0,
      totalRuntime: machine.metrics?.totalRuntime || 0,
      efficiency: machine.metrics?.cycles / (machine.metrics?.totalRuntime || 1)
    }));

    const averageUptime = machineMetrics.reduce((acc, m) => acc + m.uptime, 0) / machines.length;

    return {
      machines: machineMetrics,
      averageUptime
    };
  }

  // Analyze error trends
  async getErrorTrends(timeframe: 'day' | 'week' | 'month'): Promise<{
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byMachine: Record<string, number>;
  }> {
    const alerts = await storage.getAlerts();
    
    const byType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = alerts.reduce((acc, alert) => {
      if (alert.category) {
        acc[alert.category] = (acc[alert.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const byMachine = alerts.reduce((acc, alert) => {
      acc[alert.machineId] = (acc[alert.machineId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      byType,
      byCategory,
      byMachine
    };
  }

  // Get sustainability metrics
  async getSustainabilityMetrics(locationId?: number): Promise<{
    waterConsumption: number;
    energyConsumption: number;
    efficiency: number;
  }> {
    const machines = locationId ?
      await storage.getMachinesByLocation(locationId) :
      await storage.getMachines();

    const metrics = machines.reduce((acc, machine) => {
      acc.waterConsumption += machine.metrics?.waterConsumption || 0;
      acc.energyConsumption += machine.metrics?.energyConsumption || 0;
      return acc;
    }, {
      waterConsumption: 0,
      energyConsumption: 0,
    });

    const efficiency = machines.length > 0 ?
      (metrics.waterConsumption + metrics.energyConsumption) / machines.length :
      0;

    return {
      ...metrics,
      efficiency
    };
  }
}

export const analyticsService = new AnalyticsService();
