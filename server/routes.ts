import type { Express } from "express";
import { createServer, type Server } from "http";
import { ApiSyncService } from "./services/api-sync";
import { storage } from "./storage";
import { log } from "./vite";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    const httpServer = createServer(app);

    // Middleware to parse JSON bodies
    app.use(express.json());

    // Initialize API sync service with the API key
    const apiKey = process.env.SQ_INSIGHTS_API_KEY || '';
    log(`Initializing API sync service with key: ${apiKey ? '[PROVIDED]' : '[MISSING]'}`, 'server');
    const apiSyncService = new ApiSyncService(apiKey);

    // Get locations
    app.get('/api/locations', async (req, res) => {
      try {
        const locations = await storage.getLocations();
        res.json({ locations });
      } catch (error) {
        log(`Error fetching locations: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch locations' });
      }
    });

    // Manual sync endpoint
    app.post('/api/sync/locations', async (req, res) => {
      try {
        log('Starting manual location sync', 'api');
        const count = await apiSyncService.syncLocations();
        res.json({ message: `Successfully synced ${count} locations` });
      } catch (error) {
        log(`Location sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
        res.status(500).json({ message: 'Failed to sync locations' });
      }
    });

    log('All routes registered successfully', 'server');
    return httpServer;
  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'server');
    throw error;
  }
}