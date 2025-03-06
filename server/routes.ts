import type { Express } from "express";
import { createServer, type Server } from "http";
import { ApiSyncService } from "./services/api-sync";
import { storage } from "./storage";
import { log } from "./vite";
import express from "express";
import authRoutes from "./routes/auth";
import syncRoutes from "./routes/sync";
import reportsRoutes from "./routes/reports"; // Add reports routes
import { isManagerOrAdmin, isOperatorOrAbove } from "./middleware/auth";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    const httpServer = createServer(app);

    // API Router to ensure all routes are properly prefixed
    const apiRouter = express.Router();

    // Auth routes
    apiRouter.use('/auth', authRoutes);

    // Protected routes
    apiRouter.use('/sync', isManagerOrAdmin, syncRoutes);
    apiRouter.use('/reports', isManagerOrAdmin, reportsRoutes); // Add reports routes

    apiRouter.get('/locations', isOperatorOrAbove, async (req, res) => {
      try {
        const locations = await storage.getLocations();
        res.json({ locations });
      } catch (error) {
        log(`Error fetching locations: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch locations' });
      }
    });

    apiRouter.get('/machines', isOperatorOrAbove, async (req, res) => {
      try {
        const machines = await storage.getMachines();
        res.json({ machines });
      } catch (error) {
        log(`Error fetching machines: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch machines' });
      }
    });

    // Mount the API router with /api prefix
    app.use('/api', apiRouter);

    log('All routes registered successfully', 'server');
    return httpServer;
  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'server');
    throw error;
  }
}