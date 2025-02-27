import { Router } from 'express';
import { ApiSyncService } from '../services/api-sync';
import { storage } from '../storage';
import { log } from '../vite';

if (!process.env.SQ_INSIGHTS_API_KEY) {
  throw new Error('SQ_INSIGHTS_API_KEY environment variable is required');
}

const syncRouter = Router();
const apiService = new ApiSyncService(process.env.SQ_INSIGHTS_API_KEY);

syncRouter.post('/machines', async (req, res) => {
  try {
    log('Starting sync process...', 'sync');
    await apiService.syncAll();
    const machines = await storage.getMachines();
    res.json({ machines });
  } catch (error) {
    log(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sync');
    res.status(500).json({ error: 'Failed to sync machines' });
  }
});

export default syncRouter;