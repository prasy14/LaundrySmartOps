import { storage } from "../storage";
import type { 
  InsertMachine, InsertAlert, 
  InsertLocation, InsertMachineProgram,
  InsertSyncLog 
} from "@shared/schema";
import { log } from "../vite";

export class ApiSyncService {
  private apiKey: string;
  private baseUrl: string = 'https://partner.sqinsights.com/api/v1';

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
          'Authorization': `Bearer ${this.apiKey}`,
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
      const data = await this.fetchWithAuth('/locations');

      if (!data?.locations) {
        throw new Error('No location data received from API');
      }

      let count = 0;
      for (const location of data.locations) {
        try {
          const locationData: InsertLocation = {
            externalId: location.id.toString(),
            name: location.name,
            address: location.address,
            type: location.type || 'store',
            status: location.status || 'active',
          };

          await storage.createOrUpdateLocation(locationData);
          count++;
          log(`Synced location: ${locationData.name}`, 'api-sync');
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

  async syncMachinePrograms(): Promise<number> {
    try {
      log('Starting machine programs sync', 'api-sync');
      const data = await this.fetchWithAuth('/programs');

      if (!data?.programs) {
        throw new Error('No program data received from API');
      }

      let count = 0;
      for (const program of data.programs) {
        try {
          const programData: InsertMachineProgram = {
            externalId: program.id.toString(),
            name: program.name,
            description: program.description,
            duration: program.duration,
            type: program.type || 'wash',
          };

          await storage.createOrUpdateMachineProgram(programData);
          count++;
          log(`Synced program: ${programData.name}`, 'api-sync');
        } catch (error) {
          log(`Failed to sync program ${program.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
          // Continue with next program
        }
      }

      log(`Successfully synced ${count} machine programs`, 'api-sync');
      return count;
    } catch (error) {
      log(`Failed to sync machine programs: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  async syncAllMachines(): Promise<boolean> {
    try {
      log('Starting full sync', 'api-sync');

      // First sync locations and programs
      let locationCount = 0;
      let programCount = 0;

      try {
        locationCount = await this.syncLocations();
      } catch (error) {
        log(`Location sync failed but continuing: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      }

      try {
        programCount = await this.syncMachinePrograms();
      } catch (error) {
        log(`Program sync failed but continuing: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      }

      // Then sync machines
      const data = await this.fetchWithAuth('/machines');

      if (!data?.machines) {
        throw new Error('No machine data received from API');
      }

      let machineCount = 0;
      for (const machine of data.machines) {
        try {
          const location = await storage.getLocationByExternalId(machine.locationId.toString());
          if (!location) {
            log(`Warning: Location not found for machine ${machine.id}`, 'api-sync');
            continue;
          }

          const machineData: InsertMachine = {
            externalId: machine.id.toString(),
            name: machine.name,
            locationId: location.id,
            model: machine.model,
            serialNumber: machine.serialNumber,
            status: machine.status || 'offline',
          };

          await storage.createOrUpdateMachine(machineData);
          machineCount++;
          log(`Synced machine: ${machineData.name}`, 'api-sync');
        } catch (error) {
          log(`Failed to sync machine ${machine.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
          // Continue with next machine
        }
      }

      // Log the sync attempt
      await storage.createSyncLog({
        timestamp: new Date(),
        success: true,
        error: null,
        machineCount,
        locationCount,
        programCount
      });

      log('Machine sync completed successfully', 'api-sync');
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

      log(`Failed to sync machines: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
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