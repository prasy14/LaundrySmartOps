import { storage } from "../storage";
import type { InsertLocation, InsertMachine, InsertMachineType, InsertMachineProgram } from "@shared/schema";
import { log } from "../vite";

export class ApiSyncService {
  private apiKey: string;
  private baseUrl: string = 'https://partner.sqinsights.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    log(`API Service initialized with key: ${apiKey ? '[PROVIDED]' : '[MISSING]'}`, 'api-sync');
  }

  private async fetchWithAuth(endpoint: string) {
    const url = `${this.baseUrl}${endpoint}`;
    log(`Making API request to: ${url}`, 'api-sync');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        log(`API error (${response.status}): ${text}`, 'api-sync');
        throw new Error(`API request failed: ${response.status} - ${text}`);
      }

      const data = await response.json();
      log(`API response received for ${endpoint}: ${JSON.stringify(data).substring(0, 100)}...`, 'api-sync');
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        log(`API request timeout for ${endpoint}`, 'api-sync');
        throw new Error(`API request timed out: ${endpoint}`);
      }
      log(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  async syncMachinePrograms(machineId: string, locationId: string): Promise<number> {
    try {
      log(`Starting program sync for machine ${machineId}`, 'api-sync');
      const machine = await storage.getMachineByExternalId(machineId);
      if (!machine) {
        throw new Error(`Machine with external ID ${machineId} not found`);
      }

      const cyclesResponse = await this.fetchWithAuth(`/locations/${locationId}/machines/${machineId}/cycles`);
      let programCount = 0;

      // Process cycles
      if (cyclesResponse.cycles) {
        for (const cycle of cyclesResponse.cycles) {
          await storage.createOrUpdateMachineProgram({
            externalId: cycle.id,
            name: cycle.name,
            machineTypeId: machine.machineTypeId,
            type: 'cycle'
          });
          programCount++;
        }
      }

      // Process modifiers if available
      if (cyclesResponse.modifiers) {
        for (const modifier of cyclesResponse.modifiers) {
          await storage.createOrUpdateProgramModifier({
            externalId: modifier.id,
            name: modifier.name,
            programId: null // This would need to be mapped correctly
          });
          programCount++;
        }
      }

      log(`Successfully synced ${programCount} programs/modifiers for machine ${machineId}`, 'api-sync');
      return programCount;
    } catch (error) {
      log(`Failed to sync programs for machine ${machineId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  async syncMachinesForLocation(locationId: string): Promise<number> {
    try {
      log(`Starting machine sync for location ${locationId}`, 'api-sync');
      const response = await this.fetchWithAuth(`/locations/${locationId}/machines`);

      if (!response?.data) {
        throw new Error(`No machine data received for location ${locationId}`);
      }

      const location = await storage.getLocationByExternalId(locationId);
      if (!location) {
        throw new Error(`Location with external ID ${locationId} not found`);
      }

      let machineCount = 0;
      for (const machine of response.data) {
        try {
          log(`Processing machine ${machine.id}`, 'api-sync');

          // Create or update machine type first
          const machineType = await storage.createOrUpdateMachineType({
            name: machine.machineType.name,
            description: machine.machineType.description || '',
            isWasher: machine.machineType.isWasher || false,
            isDryer: machine.machineType.isDryer || false,
            isCombo: machine.machineType.isCombo || false,
          });

          log(`Machine type created/updated: ${machineType.id}`, 'api-sync');

          // Then create or update the machine
          await storage.createOrUpdateMachine({
            externalId: machine.id,
            name: machine.name,
            locationId: location.id,
            machineTypeId: machineType.id,
            controlId: machine.controlId,
            serialNumber: machine.serialNumber,
            machineNumber: machine.machineNumber,
            networkNode: machine.networkNode,
            modelNumber: machine.modelNumber,
            status: machine.status || {},
            lastSyncAt: new Date()
          });

          machineCount++;
          log(`Machine ${machine.id} processed successfully`, 'api-sync');
        } catch (error) {
          log(`Failed to process machine ${machine.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
          // Continue with next machine even if one fails
        }
      }

      log(`Successfully synced ${machineCount} machines for location ${locationId}`, 'api-sync');
      return machineCount;
    } catch (error) {
      log(`Failed to sync machines for location ${locationId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  async syncLocations(): Promise<number> {
    try {
      log('Starting location sync', 'api-sync');
      const response = await this.fetchWithAuth('/locations');

      if (!response?.data) {
        throw new Error('No location data received from API');
      }

      let totalMachines = 0;
      let locationCount = 0;

      for (const location of response.data) {
        try {
          log(`Processing location: ${location.name} (${location.id})`, 'api-sync');

          await storage.createOrUpdateLocation({
            externalId: location.id,
            name: location.name,
            timezone: location.timezone || 'UTC',
            address: location.address,
            coordinates: location.coordinates,
            status: 'active',
            lastSyncAt: new Date()
          });
          locationCount++;

          const machineCount = await this.syncMachinesForLocation(location.id);
          totalMachines += machineCount;
          log(`Processed ${machineCount} machines for location ${location.name}`, 'api-sync');
        } catch (error) {
          log(`Failed to sync location ${location.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
          // Continue with next location even if one fails
        }
      }

      log(`Successfully synced ${locationCount} locations and ${totalMachines} machines`, 'api-sync');
      return locationCount;
    } catch (error) {
      log(`Failed to sync locations: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  async syncAll(): Promise<void> {
    try {
      log('Starting full sync', 'api-sync');
      const locationCount = await this.syncLocations();

      await storage.createSyncLog({
        timestamp: new Date(),
        success: true,
        error: null,
        locationCount,
        machineCount: 0, // Updated during individual location syncs
        programCount: 0  // Updated during individual machine syncs
      });

      log('Full sync completed successfully', 'api-sync');
    } catch (error) {
      log(`Full sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      await storage.createSyncLog({
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        locationCount: 0,
        machineCount: 0,
        programCount: 0
      });
      throw error;
    }
  }
}