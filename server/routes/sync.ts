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

// Apply the isManagerOrAdmin middleware to all routes in this router
syncRouter.use(isManagerOrAdmin);

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

export default syncRouter;