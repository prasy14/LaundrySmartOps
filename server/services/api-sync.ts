import { storage } from "../storage";
import type { InsertLocation, InsertMachine } from "@shared/schema";
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
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        log(`API error (${response.status}): ${text}`, 'api-sync');
        throw new Error(`API request failed: ${response.status} - ${text}`);
      }

      const data = await response.json();
      log(`API Response: ${JSON.stringify(data)}`, 'api-sync');
      return data;
    } catch (error) {
      log(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  async syncLocations(): Promise<number> {
    try {
      log('Starting location sync', 'api-sync');
      const response = await this.fetchWithAuth('/locations');

      if (!response?.data) {
        log('No data array in API response', 'api-sync');
        throw new Error('No location data received from API');
      }

      let totalMachines = 0;
      let locationCount = 0;
      for (const location of response.data) {
        try {
          log(`Processing location: ${JSON.stringify(location)}`, 'api-sync');
          await storage.createOrUpdateLocation({
            externalId: location.id,
            name: location.name || 'Unnamed Location',
            address: location.address || null,
            city: location.city || null,
            state: location.state || null,
            country: location.country || null,
            postalCode: location.postalCode || null,
            type: location.type || 'store',
            status: 'active',
            timezone: location.timezone || null,
            contactName: location.contactName || null,
            contactEmail: location.contactEmail || null,
            contactPhone: location.contactPhone || null,
            operatingHours: location.operatingHours || {},
            metadata: location.metadata || {}
          });
          locationCount++;
          log(`Synced location: ${location.name}`, 'api-sync');

          // After syncing each location, sync its machines
          const machineCount = await this.syncMachinesForLocation(location.id);
          totalMachines += machineCount;
        } catch (error) {
          log(`Failed to sync location ${location.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
        }
      }

      log(`Successfully synced ${locationCount} locations and ${totalMachines} machines`, 'api-sync');
      return locationCount;
    } catch (error) {
      log(`Failed to sync locations: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  async syncMachinesForLocation(locationId: string, pageSize: number = 50): Promise<number> {
    try {
      log(`Starting machine sync for location ${locationId}`, 'api-sync');
      let page = 1;
      let totalMachines = 0;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await this.fetchWithAuth(`/locations/${locationId}/machines?pageSize=${pageSize}&page=${page}`);

        if (!response?.data) {
          log('No data array in API response', 'api-sync');
          break;
        }

        for (const machine of response.data) {
          try {
            log(`Processing machine: ${JSON.stringify(machine)}`, 'api-sync');
            await storage.createOrUpdateMachine({
              externalId: machine.id,
              name: machine.name || `Machine ${machine.id}`,
              locationId: parseInt(locationId),
              model: machine.model || null,
              serialNumber: machine.serialNumber || null,
              status: machine.status || 'offline',
              supportedPrograms: machine.supportedPrograms || [],
            });
            totalMachines++;
            log(`Synced machine: ${machine.name}`, 'api-sync');
          } catch (error) {
            log(`Failed to sync machine ${machine.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
          }
        }

        // Check if there are more pages
        hasMorePages = response.data.length === pageSize;
        page++;
      }

      log(`Successfully synced ${totalMachines} machines for location ${locationId}`, 'api-sync');
      return totalMachines;
    } catch (error) {
      log(`Failed to sync machines for location ${locationId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
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
        machineCount: 0, // This will be updated by individual location syncs
        programCount: 0
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