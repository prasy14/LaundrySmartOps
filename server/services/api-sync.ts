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

  private async fetchWithAuth(endpoint: string, userId?: number, syncType: 'auto' | 'manual' | 'scheduled' = 'auto') {
    const url = `${this.baseUrl}${endpoint}`;
    log(`Making API request to: ${url}`, 'api-sync');
    
    const startTime = Date.now();
    let responseData: any = null;
    let success = false;
    let statusCode = 0;
    let errorMessage = null;
    
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
      statusCode = response.status;
      
      if (!response.ok) {
        const text = await response.text();
        errorMessage = `API request failed: ${response.status} - ${text}`;
        log(`API error (${response.status}): ${text}`, 'api-sync');
        throw new Error(errorMessage);
      }

      responseData = await response.json();
      success = true;
      log(`API response received for ${endpoint}: ${JSON.stringify(responseData).substring(0, 100)}...`, 'api-sync');
      return responseData;
    } catch (error: any) { // Explicitly type as any to handle both Error and AbortError
      if (error.name === 'AbortError') {
        errorMessage = `API request timed out: ${endpoint}`;
        log(`API request timeout for ${endpoint}`, 'api-sync');
        throw new Error(errorMessage);
      }
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log(`API request failed: ${errorMessage}`, 'api-sync');
      throw error;
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log the API call to the database
      try {
        await storage.createSyncLog({
          timestamp: new Date(),
          success,
          error: errorMessage,
          endpoint,
          method: 'GET',
          requestData: { url },
          responseData: success ? responseData : null,
          duration,
          statusCode,
          userId,
          syncType,
          machineCount: 0,
          locationCount: 0,
          programCount: 0
        });
      } catch (logError) {
        log(`Failed to log API call: ${logError instanceof Error ? logError.message : 'Unknown error'}`, 'api-sync');
      }
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

          // Validate machine data before processing
          if (!machine.machineType?.name) {
            log(`Skipping machine ${machine.id} - invalid machine type data`, 'api-sync');
            continue;
          }

          // Create or update machine type first
          const machineType = await storage.createOrUpdateMachineType({
            name: machine.machineType.name,
            description: machine.machineType.description || '',
            isWasher: Boolean(machine.machineType.isWasher),
            isDryer: Boolean(machine.machineType.isDryer),
            isCombo: Boolean(machine.machineType.isCombo),
          });

          log(`Machine type created/updated: ${machineType.id}`, 'api-sync');

          // Then create or update the machine
          await storage.createOrUpdateMachine({
            externalId: machine.id,
            name: machine.name || `Machine ${machine.id}`,
            locationId: location.id,
            machineTypeId: machineType.id,
            controlId: machine.controlId || null,
            serialNumber: machine.serialNumber || null,
            machineNumber: machine.machineNumber || null,
            networkNode: machine.networkNode || null,
            modelNumber: machine.modelNumber || null,
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
            name: location.name || `Location ${location.id}`,
            timezone: location.timezone || 'UTC',
            address: location.address || null,
            coordinates: location.coordinates || null,
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

  async syncAll(userId?: number, syncType: 'auto' | 'manual' | 'scheduled' = 'scheduled'): Promise<void> {
    const startTime = Date.now();
    try {
      log('Starting full sync', 'api-sync');
      const locationCount = await this.syncLocations();
      const endTime = Date.now();

      // Create an overall sync log entry for the full sync
      await storage.createSyncLog({
        timestamp: new Date(),
        success: true,
        error: null,
        endpoint: '/sync/all',
        method: 'POST',
        requestData: null,
        responseData: { locationCount },
        duration: endTime - startTime,
        statusCode: 200,
        locationCount,
        machineCount: 0, // Updated during individual location syncs
        programCount: 0,  // Updated during individual machine syncs
        userId,
        syncType
      });

      log('Full sync completed successfully', 'api-sync');
    } catch (error) {
      const endTime = Date.now();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log(`Full sync failed: ${errorMessage}`, 'api-sync');
      
      // Log the failure
      await storage.createSyncLog({
        timestamp: new Date(),
        success: false,
        error: errorMessage,
        endpoint: '/sync/all',
        method: 'POST',
        requestData: null,
        responseData: null,
        duration: endTime - startTime,
        statusCode: 500,
        locationCount: 0,
        machineCount: 0,
        programCount: 0,
        userId,
        syncType
      });
      
      throw error;
    }
  }
}