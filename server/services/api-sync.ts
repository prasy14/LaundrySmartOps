import { storage } from "../storage";
import type { InsertMachine, InsertAlert } from "@shared/schema";
import { log } from "../vite";

// For development, use mock data until API is available
const MOCK_MACHINES = [
  {
    id: 1,
    machineName: "Washer 101",
    locationName: "Floor 1",
    operationalStatus: "online",
    metrics: {
      totalCycles: 150,
      uptimePercentage: 98.5,
      errorCount: 2,
      currentTemperature: 65,
      waterLevel: 85,
      detergentLevel: 75
    }
  },
  {
    id: 2,
    machineName: "Washer 102",
    locationName: "Floor 1",
    operationalStatus: "offline",
    metrics: {
      totalCycles: 120,
      uptimePercentage: 85.0,
      errorCount: 5,
      currentTemperature: 0,
      waterLevel: 0,
      detergentLevel: 50
    }
  },
  {
    id: 3,
    machineName: "Washer 201",
    locationName: "Floor 2",
    operationalStatus: "maintenance",
    metrics: {
      totalCycles: 200,
      uptimePercentage: 92.0,
      errorCount: 3,
      currentTemperature: 70,
      waterLevel: 90,
      detergentLevel: 60
    }
  }
];

export class ApiSyncService {
  private apiKey: string;
  private useMockData: boolean = true; // Toggle for development

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithAuth(endpoint: string, method: string = 'GET', body?: any) {
    if (this.useMockData) {
      log('Using mock data for development', 'api-sync');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (endpoint) {
        case '/laundry/machines':
          return { machines: MOCK_MACHINES };
        case '/laundry/machines/1/status':
        case '/laundry/machines/2/status':
        case '/laundry/machines/3/status':
          const machineId = parseInt(endpoint.split('/')[3]);
          const machine = MOCK_MACHINES.find(m => m.id === machineId);
          return machine?.metrics || null;
        default:
          throw new Error(`Mock endpoint not found: ${endpoint}`);
      }
    }

    const url = `https://smartlaundry.azurewebsites.net/api/v1${endpoint}`;
    log(`Making API request to: ${url}`, 'api-sync');

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const responseText = await response.text();
      log(`API Response: ${responseText}`, 'api-sync');

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${responseText}`);
      }

      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      log(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  async syncMachineStatus(machineId: number) {
    try {
      log(`Syncing status for machine ${machineId}`, 'api-sync');
      const data = await this.fetchWithAuth(`/laundry/machines/${machineId}/status`);

      if (!data) {
        throw new Error('No data received from API');
      }

      // Map API response to our schema
      const metrics = {
        cycles: data.totalCycles || 0,
        uptime: data.uptimePercentage || 100,
        errors: data.errorCount || 0,
        temperature: data.currentTemperature || 0,
        waterLevel: data.waterLevel || 100,
        detergentLevel: data.detergentLevel || 100
      };

      await storage.updateMachineStatus(machineId, data.operationalStatus || 'offline');
      log(`Successfully updated machine ${machineId} status`, 'api-sync');

      return true;
    } catch (error) {
      log(`Failed to sync machine status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }

  async syncAllMachines() {
    try {
      log('Starting machine sync', 'api-sync');
      const data = await this.fetchWithAuth('/laundry/machines');

      if (!data?.machines) {
        throw new Error('No machine data received from API');
      }

      // Clear existing machines
      await storage.clearAllMachines();
      log('Cleared existing machines from database', 'api-sync');

      for (const machine of data.machines) {
        const machineData: InsertMachine = {
          name: machine.machineName || `Machine ${machine.id}`,
          location: machine.locationName || 'Unknown',
          status: machine.operationalStatus || 'offline',
        };

        const createdMachine = await storage.createMachine(machineData);
        log(`Created machine in database: ${machineData.name}`, 'api-sync');

        // Fetch and update status for each machine
        await this.syncMachineStatus(createdMachine.id);
      }

      log('Machine sync completed successfully', 'api-sync');
      return true;
    } catch (error) {
      log(`Failed to sync machines: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }

  async reportAlert(machineId: number, alert: InsertAlert) {
    try {
      if (this.useMockData) {
        log(`[Mock] Reported alert for machine ${machineId}`, 'api-sync');
        return true;
      }

      log(`Reporting alert for machine ${machineId}`, 'api-sync');
      await this.fetchWithAuth(`/laundry/machines/${machineId}/alerts`, 'POST', {
        type: alert.type,
        message: alert.message,
        status: alert.status
      });
      return true;
    } catch (error) {
      log(`Failed to report alert: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }
}