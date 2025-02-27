import type { Express } from "express";
import { createServer, type Server } from "http";
import { ApiSyncService } from "./services/api-sync";
import { log } from "./vite";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Initialize API sync service with the API key
  const apiSyncService = new ApiSyncService(process.env.SQ_INSIGHTS_API_KEY || '');

  // Sync endpoint to trigger location sync
  app.post('/api/sync/locations', async (req, res) => {
    try {
      const count = await apiSyncService.syncLocations();
      res.json({ message: `Successfully synced ${count} locations` });
    } catch (error) {
      log(`Location sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      res.status(500).json({ message: 'Failed to sync locations' });
    }
  });

  return httpServer;
}