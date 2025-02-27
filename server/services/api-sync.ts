import { storage } from "../storage";
import type {
  InsertMachine, InsertAlert,
  InsertLocation, InsertMachineProgram,
  InsertSyncLog
} from "@shared/schema";
import { log } from "../vite";

export class ApiSyncService {
  private apiKey: string;
  private baseUrl: string = 'https://partner.sqinsights.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithAuth(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    log(`Making API request to: ${url}`, 'api-sync');

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const responseText = await response.text();
      log(`API Response (${response.status}): ${responseText}`, 'api-sync');

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${responseText}`);
      }

      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      log(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  async syncLocations(): Promise<number> {
    try {
      log('Starting location sync', 'api-sync');
      const data = await this.fetchWithAuth('/locations?pageSize=1000&page=1');

      if (!data?.locations) {
        log('No location data in API response', 'api-sync');
        log(`API Response data: ${JSON.stringify(data)}`, 'api-sync');
        throw new Error('No location data received from API');
      }

      let count = 0;
      for (const location of data.locations) {
        try {
          const locationData: InsertLocation = {
            externalId: location.id.toString(),
            name: location.name,
            address: location.address,
            city: location.city,
            state: location.state,
            country: location.country,
            postalCode: location.postalCode,
            type: location.type || 'store',
            status: location.status || 'active',
            timezone: location.timezone,
            contactName: location.contactName,
            contactEmail: location.contactEmail,
            contactPhone: location.contactPhone,
            operatingHours: location.operatingHours || {},
            metadata: location.metadata || {}
          };

          await storage.createOrUpdateLocation(locationData);
          count++;
          log(`Synced location: ${locationData.name}`, 'api-sync');

          // After each location is synced, sync its machines
          await this.syncMachinesForLocation(location.id);
        } catch (error) {
          log(`Failed to sync location ${location.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
          // Continue with next location
        }
      }

      log(`Successfully synced ${count} locations`, 'api-sync');
      return count;
    } catch (error) {
      log(`Failed to sync locations: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  private async syncMachinesForLocation(locationId: string): Promise<number> {
    try {
      log(`Syncing machines for location ${locationId}`, 'api-sync');
      const data = await this.fetchWithAuth(`/locations/${locationId}/machines`);

      if (!data?.machines) {
        log(`No machines found for location ${locationId}`, 'api-sync');
        return 0;
      }

      let count = 0;
      for (const machine of data.machines) {
        try {
          const machineData: InsertMachine = {
            externalId: machine.id.toString(),
            name: machine.name,
            locationId: parseInt(locationId),
            model: machine.model,
            serialNumber: machine.serialNumber,
            status: machine.status || 'offline',
          };

          await storage.createOrUpdateMachine(machineData);
          count++;
          log(`Synced machine: ${machineData.name} for location ${locationId}`, 'api-sync');
        } catch (error) {
          log(`Failed to sync machine ${machine.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
          // Continue with next machine
        }
      }

      return count;
    } catch (error) {
      log(`Failed to sync machines for location ${locationId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return 0;
    }
  }

  async syncAllMachines(): Promise<boolean> {
    try {
      log('Starting full sync', 'api-sync');
      const locationCount = await this.syncLocations();
      const machines = await storage.getMachines();

      // Log the sync attempt
      await storage.createSyncLog({
        timestamp: new Date(),
        success: true,
        error: null,
        machineCount: machines.length,
        locationCount,
        programCount: 0
      });

      log('Sync completed successfully', 'api-sync');
      return true;
    } catch (error) {
      // Log the sync error
      await storage.createSyncLog({
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        machineCount: 0,
        locationCount: 0,
        programCount: 0
      });

      log(`Failed to sync: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }

  async reportAlert(machineId: number, alert: InsertAlert): Promise<boolean> {
    try {
      log(`Reporting alert for machine ${machineId}`, 'api-sync');
      await this.fetchWithAuth(`/machines/${machineId}/alerts`, 'POST', {
        type: alert.type,
        message: alert.message,
        status: alert.status,
        priority: alert.priority,
        category: alert.category
      });
      return true;
    } catch (error) {
      log(`Failed to report alert: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }
}