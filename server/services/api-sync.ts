import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { campuses } from "shared/schema"; 
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
    
    try 
    {
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
      if (error.name === 'AbortError') 
      {
        errorMessage = `API request timed out: ${endpoint}`;
        log(`API request timeout for ${endpoint}`, 'api-sync');
        throw new Error(errorMessage);
      }
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log(`API request failed: ${errorMessage}`, 'api-sync');
      console.error('Fetch error:', error); // <-- add this
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

    const endpoint = `/locations/${locationId}/machines/${machineId}/cycles`;
    const cyclesResponse = await this.fetchWithAuth(endpoint);

    log(`Raw program API response for machine ${machineId}: ${JSON.stringify(cyclesResponse).substring(0, 300)}...`, 'api-sync');

    let programCount = 0;

    // Validate and process cycles
    if (Array.isArray(cyclesResponse?.cycles)) {
      for (const cycle of cyclesResponse.cycles) {
        if (!cycle?.id || !cycle?.name) {
          log(`Skipping invalid cycle entry: ${JSON.stringify(cycle)}`, 'api-sync');
          continue;
        }

        await storage.createOrUpdateMachineProgram({
          externalId: cycle.id,
          name: cycle.name,
          machineTypeId: machine.machineTypeId,
          type: 'cycle'
        });
        programCount++;
      }
    } else {
      log(`No valid cycles found for machine ${machineId}`, 'api-sync');
    }

    // Validate and process modifiers
    if (Array.isArray(cyclesResponse?.modifiers)) {
      for (const modifier of cyclesResponse.modifiers) {
        if (!modifier?.id || !modifier?.name) {
          log(`Skipping invalid modifier entry: ${JSON.stringify(modifier)}`, 'api-sync');
          continue;
        }

        await storage.createOrUpdateProgramModifier({
          externalId: modifier.id,
          name: modifier.name,
          programId: null // TODO: Map modifier to a program if needed
        });
        programCount++;
      }
    } else {
      log(`No valid modifiers found for machine ${machineId}`, 'api-sync');
    }

    log(`Successfully synced ${programCount} programs/modifiers for machine ${machineId}`, 'api-sync');
    return programCount;

  } catch (error) {
    log(`Failed to sync programs for machine ${machineId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
    throw error;
  }
}

// Machine Errors
async syncMachineErrors(locationId: string, machineId: string, start: string, end: string): Promise<any> {
  try {
    const endpoint = `/locations/${locationId}/machines/${machineId}/errors?start=${start}&end=${end}`;
    const errors = await this.fetchWithAuth(endpoint);
    log(`machine errors found for machine ${machineId}`, 'api-sync');

    const errorList = Array.isArray(errors?.data) ? errors.data : errors;

    if (!Array.isArray(errorList) || errorList.length === 0) {
      log(`No machine errors found for machine ${machineId}`, 'api-sync');
      return [];
    }

    for (const error of errorList) {
      const machine = await storage.getMachineByExternalId(machineId);
      const location = await storage.getLocationByExternalId(locationId);
      
      if (!machine || !location) {
        log(`Skipping error ${error.id}: Machine or Location not found`, 'api-sync');
        continue;
      }

  await storage.createOrUpdateMachineError({
  id: error.id,
  machineId: machine.id,
  locationId: location.id,
  errorCode: error.code,
  errorType: error.type,
  errorName: error.name,
  timestamp: new Date(error.timestamp)
});

      log(`Inserting error ${error.id} for machine ${machineId}`, 'api-sync');
    }

    log(`Synced ${errorList.length} machine errors for machine ${machineId}`, 'api-sync');
    return errorList;
  } catch (error) {
    log(`Failed to sync machine errors for machine ${machineId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
    throw error;
  }
}

async syncCoinVaultReports(locationId: string, start: string, end: string): Promise<number> {
  try {
    log(`Fetching coin vault report for location ${locationId}`, 'api-sync');

    const endpoint = `/reports?reportId=COIN_VAULT&locationIds=${locationId}&startDate=${start}&endDate=${end}`;
    const response = await this.fetchWithAuth(endpoint);

    const locations = response?.data?.locations;
    if (!Array.isArray(locations) || locations.length === 0) {
      log(`No coin vault report data found for location ${locationId}`, 'api-sync');
      return 0;
    }

    const location = await storage.getLocationByExternalId(locationId);
    if (!location) {
      throw new Error(`Location with external ID ${locationId} not found`);
    }

    let vaultCount = 0;

    for (const loc of locations) {
      if (!Array.isArray(loc.machines)) continue;

      for (const machine of loc.machines) {
        if (!machine?.id) {
          log(`Skipping invalid machine entry in coin vault report`, 'api-sync');
          continue;
        }

       await storage.createOrUpdateCoinVault({
  updatedAt: new Date(),
  createdAt: new Date(),
  emptiedAt: null,
  isWasher: machine.machineType?.isWasher ?? false,
  isDryer: machine.machineType?.isDryer ?? false,
  isCombo: machine.machineType?.isCombo ?? false,
  vaultSize: machine.vaultSize ?? 0,
  percentCapacity: machine.percentCapacity ?? 0,
  totalValue: machine.totalValue ?? 0,
  locationId: String(location.id),
  locationName: location.name ?? '',
  machineId: machine.id,
  machineName: machine.name ?? '',
  machineTypeDesc: machine.machineType?.description ?? '',
  machineTypeName: machine.machineType?.name ?? '',
});

        vaultCount++;
        log(`Inserted coin vault report data for machine ${machine.id}`, 'api-sync');
      }
    }

    log(`Finished syncing ${vaultCount} coin vault report(s) for location ${locationId}`, 'api-sync');
    return vaultCount;
  } catch (error) {
    log(`Failed to sync coin vault report for location ${locationId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
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
        await this.syncMachineErrors(locationId, machine.id, '2025-01-01T00:00:00.000Z', new Date().toISOString());
      }

      log(`Successfully synced ${machineCount} machines for location ${locationId}`, 'api-sync');
      return machineCount;
    } catch (error) {
      log(`Failed to sync machines for location ${locationId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

   async  syncLocations(): Promise<number> {
  try {
    log("Starting location sync", "api-sync");

    const response = await this.fetchWithAuth("/locations");

    if (!response?.data) {
      throw new Error("No location data received from API");
    }

      let totalMachines = 0;
      let locationCount = 0;

      for (const location of response.data) {
        try {
           log(`Processing location: ${location.name} (${location.id})`, "api-sync");

        // Extract campus slug and name from location name
        const nameParts = location.name?.split(" - ") || [];
        const campusSlug = nameParts[0]?.trim()?.toLowerCase().replace(/\s+/g, "_") || "unknown_campus";
        const campusName = nameParts.slice(1).join(" - ").trim() || "Unnamed Area";

        // Create or update campus
        await storage.createOrUpdateCampus({
          campusId: campusSlug,
          campusName,
        });

        // Fetch numeric campus.id
        const campus = await db.query.campuses.findFirst({
          where: (c, { eq }) => eq(c.campusId, campusSlug),
        });

        if (!campus) {
          throw new Error(`Campus not found for campusId: ${campusSlug}`);
        }

        // Create or update location with integer campusId
          await storage.createOrUpdateLocation({
            externalId: location.id,
            name: location.name || `Location ${location.id}`,
            timezone: location.timezone || 'UTC',
            address: location.address || null,
            coordinates: location.coordinates || null,
            status: 'active',
            lastSyncAt: new Date(),
             campusId: campus.id,
          });
          locationCount++;

          const machineCount = await this.syncMachinesForLocation(location.id);
          totalMachines += machineCount;

        log(`Processed ${machineCount} machines for location ${location.name}`, "api-sync");

        await this.syncCoinVaultReports(location.id, "2025-01-01T00:00:00.000Z", new Date().toISOString());
        // await this.syncAuditOperationReport(location.id, "2025-01-01T00:00:00.000Z", new Date().toISOString());
        await this.syncAuditTotalVendingReport(location.id, "2025-01-01T00:00:00.000Z", new Date().toISOString());
        await this.syncAuditCycleUsageReport(location.id, "2025-01-01T00:00:00.000Z", new Date().toISOString());
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
  
  async syncCampuses(): Promise<number> {
  try {
    log('Starting campus sync', 'api-sync');

    const campuses = await this.fetchWithAuth('/campuses');
    if (!Array.isArray(campuses)) {
    throw new Error('Invalid campus data received from API');}
    let campusCount = 0;

    for (const campus of campuses) {
      try {
        const campusName = campus.name?.trim() || "Unknown Campus";
        const campusId = campusName.toLowerCase().replace(/\s+/g, "_"); // slugify

        log(`Processing campus: ${campusName}`, 'api-sync');

        await storage.createOrUpdateCampus({
          campusId,
          campusName,
        });

        campusCount++;
      } catch (error) {
        log(
          `Failed to sync campus ${campus.name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          'api-sync'
        );
        // Continue with next campus even if one fails
      }
    }

    log(`Successfully synced ${campusCount} campuses`, 'api-sync');
    return campusCount;
  } catch (error) {
    log(
      `Failed to sync campuses: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      'api-sync'
    );
    throw error;
  }
}

  async syncAuditCycleUsageReport(locationId: string, start: string, end: string): Promise<number> {
  try {
    log(`Fetching audit cycle usage for location ${locationId}`, 'api-sync');

    const endpoint = `/reports?reportId=AUDIT_CYCLE_USAGE&locationIds=${locationId}&startDate=${start}&endDate=${end}`;
    const response = await this.fetchWithAuth(endpoint);

    const locations = response?.data?.locations;
    if (!Array.isArray(locations) || locations.length === 0) {
      log(`No audit cycle usage data for location ${locationId}`, 'api-sync');
      return 0;
    }

    let usageCount = 0;

    for (const loc of locations) {
      for (const machine of loc.machines || []) {
        await storage.createOrUpdateAuditCycleUsage({
          reportId: 'AUDIT_CYCLE_USAGE',
          locationId: loc.id,
          locationName: loc.name,
          machineId: machine.id,
          machineName: machine.name,
          delicateColdCount: machine.delicateColdCount ?? 0,
          delicateHotCount: machine.delicateHotCount ?? 0,
          delicateWarmCount: machine.delicateWarmCount ?? 0,
          normalColdCount: machine.normalColdCount ?? 0,
          normalHotCount: machine.normalHotCount ?? 0,
          normalWarmCount: machine.normalWarmCount ?? 0,
          permanentPressColdCount: machine.permanentPressColdCount ?? 0,
          permanentPressHotCount: machine.permanentPressHotCount ?? 0,
          permanentPressWarmCount: machine.permanentPressWarmCount ?? 0,
          totalCycles: machine.totalCycles ?? 0,
          firstReceivedAt: new Date(machine.firstReceivedAt),
          lastReceivedAt: new Date(machine.lastReceivedAt),
          machineTypeName: machine.machineType?.name ?? '',
          machineTypeDesc: machine.machineType?.description ?? '',
          isWasher: machine.machineType?.isWasher ?? false,
          isDryer: machine.machineType?.isDryer ?? false,
          isCombo: machine.machineType?.isCombo ?? false,
        });

        log(`Synced cycle usage for machine ${machine.id}`, 'api-sync');
        usageCount++;
      }
    }

    log(`Finished syncing ${usageCount} audit cycle usage entries for location ${locationId}`, 'api-sync');
    return usageCount;
  } catch (error) {
    log(
      `Failed to sync audit cycle usage for location ${locationId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'api-sync'
    );
    throw error;
  }
}
  
async syncAuditTotalVendingReport(locationId: string, start: string, end: string): Promise<number> {
  try {
    log(`Fetching audit total vending report for location ${locationId}`, 'api-sync');

    const endpoint = `/reports?reportId=AUDIT_TOTAL_VENDING&locationIds=${locationId}&startDate=${start}&endDate=${end}`;
    const response = await this.fetchWithAuth(endpoint);

    const locations = response?.data?.locations;
    if (!Array.isArray(locations) || locations.length === 0) {
      log(`No audit total vending data found for location ${locationId}`, 'api-sync');
      return 0;
    }

    let insertCount = 0;

    for (const loc of locations) {
      for (const machine of loc.machines || []) {
        await storage.createOrUpdateAuditTotalVending({
          locationId: loc.id,
          locationName: loc.name,
          machineId: machine.id,
          machineName: machine.name,
          totalCycles: parseInt(machine.totalNumberOfMachineCycles || '0'),
          totalVended: parseInt(machine.totalNumberOfRapidAdvanceCycles || '0'),
          firstReceivedAt: new Date(machine.firstReceivedAt),
          lastReceivedAt: new Date(machine.lastReceivedAt),
          machineTypeName: machine.machineType?.name || '',
          machineTypeDesc: machine.machineType?.description || '',
          isWasher: !!machine.machineType?.isWasher,
          isDryer: !!machine.machineType?.isDryer,
          isCombo: !!machine.machineType?.isCombo
        });

        log(`Synced audit total vending for machine ${machine.id}`, 'api-sync');
        insertCount++;
      }
    }

    log(`Finished syncing ${insertCount} audit total vending record(s) for location ${locationId}`, 'api-sync');
    return insertCount;
  } catch (error) {
    log(`Failed to sync audit total vending for location ${locationId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
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

function isValidDate(createdAt: any) {
  throw new Error("Function not implemented.");
}
