import { Router } from 'express';
import { ApiSyncService } from '../services/api-sync';
import { storage } from '../storage';
import { log } from '../vite';
import { isManagerOrAdmin } from '../middleware/auth';

if (!process.env.SQ_INSIGHTS_API_KEY) {
  throw new Error('SQ_INSIGHTS_API_KEY environment variable is required');
}

const syncRouter = Router();
const apiService = new ApiSyncService(process.env.SQ_INSIGHTS_API_KEY);

// Apply the isManagerOrAdmin middleware to protect all sync routes
syncRouter.use(isManagerOrAdmin);

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