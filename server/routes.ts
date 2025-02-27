import type { Express } from "express";
import { createServer, type Server } from "http";
import { ApiSyncService } from "./services/api-sync";
import { storage } from "./storage";
import { log } from "./vite";
import express from "express";
import authRoutes from "./routes/auth";
import syncRoutes from "./routes/sync";
import { isManagerOrAdmin, isOperatorOrAbove } from "./middleware/auth";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    const httpServer = createServer(app);

    // Middleware to parse JSON bodies
    app.use(express.json());

    // Auth routes
    app.use('/api/auth', authRoutes);

    // Sync routes
    app.use('/api/sync', isManagerOrAdmin, syncRoutes);

    // Protected routes
    app.get('/api/locations', isOperatorOrAbove, async (req, res) => {
      try {
        const locations = await storage.getLocations();
        res.json({ locations });
      } catch (error) {
        log(`Error fetching locations: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch locations' });
      }
    });

    app.get('/api/machines', isOperatorOrAbove, async (req, res) => {
      try {
        const machines = await storage.getMachines();
        res.json({ machines });
      } catch (error) {
        log(`Error fetching machines: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch machines' });
      }
    });

    log('All routes registered successfully', 'server');
    return httpServer;
  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'server');
    throw error;
  }
}