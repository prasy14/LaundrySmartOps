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
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Sync operation timed out')), 60000)
  );

  try {
    log('Starting test sync process...', 'sync');

    // Race between sync operation and timeout
    const result = await Promise.race([
      (async () => {
        // First sync locations
        const locationCount = await apiService.syncLocations();
        const locations = await storage.getLocations();

        // Verify location data
        log(`Synced ${locationCount} locations:`, 'sync');
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

        // Report sync status
        log('Test sync completed successfully', 'sync');
        return { locationCount, totalMachines, locations, machines };
      })(),
      timeoutPromise
    ]);

    const { locationCount, totalMachines, locations, machines } = result;

    res.json({
      success: true,
      locationCount,
      machineCount: totalMachines,
      locations,
      machines,
      message: 'Test sync completed successfully'
    });
  } catch (error) {
    log(`Test sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete test sync'
    });
  }
});

syncRouter.post('/all', async (req, res) => {
  try {
    log('Starting full sync process...', 'sync');

    // First sync locations
    const locationCount = await apiService.syncLocations();
    const locations = await storage.getLocations();

    // Then sync machines for each location
    let totalMachines = 0;
    for (const location of locations) {
      try {
        const machineCount = await apiService.syncMachinesForLocation(location.externalId);
        totalMachines += machineCount;
      } catch (error) {
        log(`Error syncing machines for location ${location.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');
      }
    }

    const machines = await storage.getMachines();

    log('Full sync completed successfully', 'sync');
    res.json({
      success: true,
      locationCount,
      machineCount: totalMachines,
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