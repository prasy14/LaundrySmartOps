import { Router, Request, Response, NextFunction } from 'express';
import { ApiSyncService } from '../services/api-sync';
import { storage } from '../storage';
import { log } from '../vite';
import { isManagerOrAdmin } from '../middleware/auth';
import bcrypt from 'bcryptjs';

// Type declarations are already defined in auth.ts

if (!process.env.SQ_INSIGHTS_API_KEY) {
  throw new Error('SQ_INSIGHTS_API_KEY environment variable is required');
}

const syncRouter = Router();
const apiService = new ApiSyncService(process.env.SQ_INSIGHTS_API_KEY);

// Initialize test admin user if needed
async function ensureTestAdmin() {
  try {
    const testUser = await storage.getUserByUsername('admin');
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await storage.createUser({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        name: 'Test Admin',
        email: 'admin@test.com',
      });
      log('Created test admin user', 'sync');
    }
  } catch (error) {
    log(`Error ensuring test admin: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');
  }
}

// Call this when the router is initialized
ensureTestAdmin();

// Apply the isManagerOrAdmin middleware to protect all sync routes
syncRouter.use(isManagerOrAdmin);

// GET endpoint to fetch sync logs with filtering options
syncRouter.get('/logs', async (req, res) => {
  try {
    const { fromDate, toDate, syncType, status } = req.query;
    
    // Get all logs from the database, ordered by timestamp descending (most recent first)
    const allLogs = await storage.getSyncLogs();
    
    // Apply filters
    let filteredLogs = [...allLogs];
    
    // Filter by date range
    if (fromDate) {
      const fromDateTime = new Date(fromDate as string);
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= fromDateTime
      );
    }
    
    if (toDate) {
      const toDateTime = new Date(toDate as string);
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= toDateTime
      );
    }
    
    // Filter by sync type
    if (syncType) {
      filteredLogs = filteredLogs.filter(log => 
        log.syncType === syncType
      );
    }
    
    // Filter by status (success or failure)
    if (status === 'success') {
      filteredLogs = filteredLogs.filter(log => log.success);
    } else if (status === 'failure') {
      filteredLogs = filteredLogs.filter(log => !log.success);
    }
    
    // Return the filtered logs
    res.json({
      logs: filteredLogs
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve sync logs';
    log(`Error fetching sync logs: ${errorMessage}`, 'sync');
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Test sync endpoint to verify data storage
syncRouter.post('/test', async (req, res) => {
  // Set a timeout for the entire operation
  const SYNC_TIMEOUT = 60000; // 60 seconds
  let timeoutHandle: NodeJS.Timeout | undefined;

  try {
    log('Starting test sync process...', 'sync');
    const userId = req.user?.id;
    const startTime = Date.now();

    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('Sync operation timed out'));
      }, SYNC_TIMEOUT);
    });

    const syncPromise = (async () => {
      // First sync locations
      const locationCount = await apiService.syncLocations();
      const locations = await storage.getLocations();

      // Log location data
      log(`Synced ${locationCount} locations`, 'sync');
      for (const location of locations) {
        log(`Location: ${location.name} (${location.externalId})`, 'sync');
      }

      // Then sync machines for each location
      let totalMachines = 0;
      for (const location of locations) {
        try {
          const machineCount = await apiService.syncMachinesForLocation(location.externalId);
          totalMachines += machineCount;
          log(`Synced ${machineCount} machines for location ${location.name}`, 'sync');
        } catch (error) {
          log(`Error syncing machines for location ${location.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');
        }
      }

      // Get all machines to verify data
      const machines = await storage.getMachines();
      log(`Total machines synced: ${totalMachines}`, 'sync');

      return { locationCount, totalMachines, locations, machines };
    })();

    // Race between sync operation and timeout
    const result = await Promise.race([syncPromise, timeoutPromise]);
    if (timeoutHandle) clearTimeout(timeoutHandle);
    const endTime = Date.now();

    const { locationCount, totalMachines, locations, machines } = result as any;

    // Log the successful test sync
    try {
      await storage.createSyncLog({
        timestamp: new Date(),
        success: true,
        error: null,
        endpoint: '/sync/test',
        method: 'POST',
        requestData: null,
        responseData: { locationCount, machineCount: totalMachines },
        duration: endTime - startTime,
        statusCode: 200,
        locationCount,
        machineCount: totalMachines,
        programCount: 0,
        userId,
        syncType: 'manual'
      });
    } catch (logError) {
      log(`Failed to log sync: ${logError instanceof Error ? logError.message : 'Unknown error'}`, 'sync');
    }

    log('Test sync completed successfully', 'sync');
    res.json({
      success: true,
      locationCount,
      machineCount: totalMachines,
      locations,
      machines,
      message: 'Test sync completed successfully'
    });
  } catch (error) {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete test sync';
    log(`Test sync error: ${errorMessage}`, 'sync');

    // Log the failed test sync
    try {
      await storage.createSyncLog({
        timestamp: new Date(),
        success: false,
        error: errorMessage,
        endpoint: '/sync/test',
        method: 'POST',
        requestData: null,
        responseData: null,
        duration: 0,
        statusCode: 500,
        locationCount: 0,
        machineCount: 0,
        programCount: 0,
        userId: req.user?.id,
        syncType: 'manual'
      });
    } catch (logError) {
      log(`Failed to log sync error: ${logError instanceof Error ? logError.message : 'Unknown error'}`, 'sync');
    }

    // Ensure we always send a response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
});

// Full sync endpoint
syncRouter.post('/all', async (req, res) => {
  try {
    log('Starting full sync process...', 'sync');
    // Pass the user ID from the request object
    await apiService.syncAll(req.user?.id, 'manual');

    const locations = await storage.getLocations();
    const machines = await storage.getMachines();

    log('Full sync completed successfully', 'sync');
    res.json({
      success: true,
      locations,
      machines
    });
  } catch (error) {
    log(`Full sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync all data'
    });
  }
});

syncRouter.post('/machines', async (req, res) => {
  try {
    log('Starting sync process...', 'sync');
    const locations = await storage.getLocations();
    let totalMachines = 0;
    const userId = req.user?.id;

    // Sync machines for each location
    for (const location of locations) {
      try {
        // Update fetchWithAuth method to pass userId and syncType
        const machineCount = await apiService.syncMachinesForLocation(location.externalId);
        totalMachines += machineCount;
      } catch (error) {
        log(`Error syncing machines for location ${location.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');
      }
    }

    // Log a summary sync entry
    try {
      await storage.createSyncLog({
        timestamp: new Date(),
        success: true,
        error: null,
        endpoint: '/sync/machines',
        method: 'POST',
        requestData: null,
        responseData: { machineCount: totalMachines },
        duration: 0,
        statusCode: 200,
        locationCount: locations.length,
        machineCount: totalMachines,
        programCount: 0,
        userId,
        syncType: 'manual'
      });
    } catch (logError) {
      log(`Failed to log sync: ${logError instanceof Error ? logError.message : 'Unknown error'}`, 'sync');
    }

    const machines = await storage.getMachines();
    log('Sync completed successfully', 'sync');
    res.json({
      success: true,
      machineCount: totalMachines,
      machines
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync machines';
    log(`Sync error: ${errorMessage}`, 'sync');
    
    // Log the error
    try {
      await storage.createSyncLog({
        timestamp: new Date(),
        success: false,
        error: errorMessage,
        endpoint: '/sync/machines',
        method: 'POST',
        requestData: null,
        responseData: null,
        duration: 0,
        statusCode: 500,
        locationCount: 0,
        machineCount: 0,
        programCount: 0,
        userId: req.user?.id,
        syncType: 'manual'
      });
    } catch (logError) {
      log(`Failed to log sync error: ${logError instanceof Error ? logError.message : 'Unknown error'}`, 'sync');
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

syncRouter.post('/locations', async (req, res) => {
  try {
    log('Starting location sync...', 'sync');
    const startTime = Date.now();
    const locationCount = await apiService.syncLocations();
    const endTime = Date.now();
    const locations = await storage.getLocations();
    const userId = req.user?.id;

    // Log a summary sync entry
    try {
      await storage.createSyncLog({
        timestamp: new Date(),
        success: true,
        error: null,
        endpoint: '/sync/locations',
        method: 'POST',
        requestData: null,
        responseData: { locationCount },
        duration: endTime - startTime,
        statusCode: 200,
        locationCount,
        machineCount: 0,
        programCount: 0,
        userId,
        syncType: 'manual'
      });
    } catch (logError) {
      log(`Failed to log sync: ${logError instanceof Error ? logError.message : 'Unknown error'}`, 'sync');
    }

    log('Location sync completed successfully', 'sync');
    res.json({
      success: true,
      locationCount,
      locations
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync locations';
    log(`Location sync error: ${errorMessage}`, 'sync');
    
    // Log the error
    try {
      await storage.createSyncLog({
        timestamp: new Date(),
        success: false,
        error: errorMessage,
        endpoint: '/sync/locations',
        method: 'POST',
        requestData: null,
        responseData: null,
        duration: 0,
        statusCode: 500,
        locationCount: 0,
        machineCount: 0,
        programCount: 0,
        userId: req.user?.id,
        syncType: 'manual'
      });
    } catch (logError) {
      log(`Failed to log sync error: ${logError instanceof Error ? logError.message : 'Unknown error'}`, 'sync');
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});


// sync.ts

syncRouter.post('/machine-errors', async (req, res) => {
  const startTime = Date.now();
  const userId = req.user?.id;

  try {
    log('Starting machine error sync...', 'sync');

    const locations = await storage.getMachineErrors();
    let totalErrors = 0;

   for (const loc of locations) {
  const machines = await storage.getMachineErrorsByLocation(loc.id);
  for (const machine of machines) {
    const externalLocation = await storage.getLocationByExternalId(loc.id); // get externalId
    const externalMachine = await storage.getMachineByExternalId(machine.id); // get externalId

    if (!externalLocation?.externalId || !externalMachine?.externalId) {
      log(`Skipping machine ${machine.id} or location ${loc.id} - missing externalId`, 'api-sync');
      continue;
    }

    const result = await apiService.syncMachineErrors(
      externalLocation.externalId, // e.g., "loc_xxx"
      externalMachine.externalId,  // e.g., "mac_xxx"
      '2025-01-01T00:00:00.000Z',
      new Date().toISOString()
    );

    totalErrors += result?.length || 0;
  }
}


    const endTime = Date.now();

    // Log sync success
    await storage.createSyncLog({
      timestamp: new Date(),
      success: true,
      error: null,
      endpoint: '/sync/machine-errors',
      method: 'POST',
      requestData: null,
      responseData: { errorCount: totalErrors },
      duration: endTime - startTime,
      statusCode: 200,
      locationCount: locations.length,
      machineCount: 0,
      programCount: 0,
      userId,
      syncType: 'manual'
    });

    log(`Machine error sync completed. Total errors: ${totalErrors}`, 'sync');
    res.status(200).json({
      success: true,
      errorCount: totalErrors
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    log(`Machine error sync failed: ${message}`, 'sync');

    // Log sync failure
    await storage.createSyncLog({
      timestamp: new Date(),
      success: false,
      error: message,
      endpoint: '/sync/machine-errors',
      method: 'POST',
      requestData: null,
      responseData: null,
      duration: 0,
      statusCode: 500,
      locationCount: 0,
      machineCount: 0,
      programCount: 0,
      userId,
      syncType: 'manual'
    });

    res.status(500).json({
      success: false,
      error: message
    });
  }
});

export default syncRouter;