import { Router } from 'express';
import { ApiSyncService } from '../services/api-sync';
import { storage } from '../storage';
import { log } from '../vite';
import { isManagerOrAdmin } from '../middleware/auth';
import bcrypt from 'bcryptjs';

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

// Test sync endpoint to verify data storage
syncRouter.post('/test', async (req, res) => {
  // Set a timeout for the entire operation
  const SYNC_TIMEOUT = 60000; // 60 seconds
  let timeoutHandle: NodeJS.Timeout;

  try {
    log('Starting test sync process...', 'sync');

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
    clearTimeout(timeoutHandle);

    const { locationCount, totalMachines, locations, machines } = result as any;

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
    clearTimeout(timeoutHandle);
    log(`Test sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');

    // Ensure we always send a response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete test sync'
      });
    }
  }
});

// Full sync endpoint
syncRouter.post('/all', async (req, res) => {
  try {
    log('Starting full sync process...', 'sync');
    await apiService.syncAll();

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

    // Sync machines for each location
    for (const location of locations) {
      try {
        const machineCount = await apiService.syncMachinesForLocation(location.externalId);
        totalMachines += machineCount;
      } catch (error) {
        log(`Error syncing machines for location ${location.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');
      }
    }

    const machines = await storage.getMachines();
    log('Sync completed successfully', 'sync');
    res.json({
      success: true,
      machineCount: totalMachines,
      machines
    });
  } catch (error) {
    log(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync machines'
    });
  }
});

syncRouter.post('/locations', async (req, res) => {
  try {
    log('Starting location sync...', 'sync');
    const locationCount = await apiService.syncLocations();
    const locations = await storage.getLocations();

    log('Location sync completed successfully', 'sync');
    res.json({
      success: true,
      locationCount,
      locations
    });
  } catch (error) {
    log(`Location sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync locations'
    });
  }
});

export default syncRouter;