import type { Express } from "express";
import { createServer, type Server } from "http";
import { ApiSyncService } from "./services/api-sync";
import { storage } from "./storage";
import { log } from "./vite";
import express from "express";
import session from "express-session";
import memoryStore from "memorystore";

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

    // Setup session middleware
    const MemoryStore = memoryStore(session);
    app.use(session({
      secret: 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000 // Prune expired entries every 24h
      }),
      cookie: { 
        secure: false, // Set to false for development
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    log('Session middleware initialized', 'server');

    // Initialize API sync service with the API key
    const apiSyncService = new ApiSyncService(process.env.SQ_INSIGHTS_API_KEY || '');

    // Auth routes
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        log(`Login attempt for user: ${username}`, 'auth');

        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Set session
        req.session.userId = user.id;
        log(`Login successful for user: ${username}`, 'auth');

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      } catch (error) {
        log(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'auth');
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.post('/api/auth/logout', (req, res) => {
      req.session.destroy((err) => {
        if (err) {
          log(`Logout error: ${err.message}`, 'auth');
          return res.status(500).json({ message: 'Failed to logout' });
        }
        res.json({ message: 'Logged out successfully' });
      });
    });

    app.get('/api/auth/me', async (req, res) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await storage.getUser(req.session.userId);
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      } catch (error) {
        log(`Auth check error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'auth');
        res.status(500).json({ message: 'Internal server error' });
      }
    });

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

    log('All routes registered successfully', 'server');
    return httpServer;
  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'server');
    throw error;
  }
}