import { storage } from "../storage";
import type { InsertLocation } from "@shared/schema";
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
      const response = await this.fetchWithAuth('/locations?pageSize=10&page=1');

      if (!response?.data) {
        log('No data array in API response', 'api-sync');
        throw new Error('No location data received from API');
      }

      let count = 0;
      for (const location of response.data) {
        try {
          log(`Processing location: ${JSON.stringify(location)}`, 'api-sync');

          const locationData: InsertLocation = {
            externalId: location.id,
            name: location.name || 'Unnamed Location',
            address: location.address || null,
            city: null,
            state: null,
            country: null,
            postalCode: null,
            type: 'store',
            status: 'active',
            timezone: location.timezone || null,
            contactName: null,
            contactEmail: null,
            contactPhone: null,
            operatingHours: {},
            metadata: {
              coordinates: location.coordinates || null
            }
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
}