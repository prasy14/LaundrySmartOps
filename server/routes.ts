import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertMachineSchema, insertAlertSchema } from "@shared/schema";
import type { WSMessage } from "@shared/schema";
import { log } from "./vite";
import { ApiSyncService } from "./services/api-sync";
import { parse as parseCookie } from "cookie";
import type { IncomingMessage } from "http";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // Prune expired entries every 24h
});

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize API sync service
  const apiSyncService = new ApiSyncService(process.env.SQ_INSIGHTS_API_KEY || '');

  // Set up session middleware
  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    name: 'connect.sid',
    cookie: {
      secure: false, // Set to false for development
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // WebSocket setup
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: async (info, done) => {
      try {
        log(`WebSocket connection attempt - Headers: ${JSON.stringify(info.req.headers)}`, 'ws');
        const cookies = parseCookie(info.req.headers.cookie || '');
        const sid = cookies['connect.sid'];

        if (!sid) {
          log('WebSocket connection rejected - No session ID found', 'ws');
          done(false, 401, 'Unauthorized');
          return;
        }

        log(`Session ID found: ${sid}`, 'ws');

        // Get session data
        const sessionData = await new Promise((resolve) => {
          sessionStore.get(sid.substring(2).split('.')[0], (err, session) => {
            if (err || !session) {
              log(`WebSocket session error: ${err?.message || 'Session not found'}`, 'ws');
              resolve(null);
            } else {
              log(`Session data found: ${JSON.stringify(session)}`, 'ws');
              resolve(session);
            }
          });
        });

        if (!sessionData || !sessionData.userId) {
          log('WebSocket connection rejected - Invalid session', 'ws');
          done(false, 401, 'Unauthorized');
          return;
        }

        log(`WebSocket connection authenticated for user ${sessionData.userId}`, 'ws');
        done(true);
      } catch (error) {
        log(`WebSocket authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ws');
        done(false, 500, 'Internal Server Error');
      }
    }
  });

  log('WebSocket server initialized', 'ws');

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      log(`Login attempt for user: ${username}`, 'auth');

      const user = await storage.getUserByUsername(username);
      if (!user) {
        log(`Login failed for user: ${username} - User not found`, 'auth');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // For now, simple password comparison
      if (user.password !== password) {
        log(`Login failed for user: ${username} - Invalid password`, 'auth');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Set session
      req.session.userId = user.id;
      log(`Session ID after login: ${req.sessionID}, User ID: ${user.id}`, 'auth');

      // Log session store state
      sessionStore.all((err, sessions) => {
        if (err) {
          log(`Error getting sessions: ${err.message}`, 'auth');
        } else {
          log(`Current sessions: ${JSON.stringify(sessions)}`, 'auth');
        }
      });

      // Ensure we save the session before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            log(`Session save error: ${err.message}`, 'auth');
            reject(err);
          } else {
            log('Session saved successfully', 'auth');
            resolve();
          }
        });
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      log(`Login successful for user: ${username}`, 'auth');
      res.json({ user: userWithoutPassword });
    } catch (error) {
      log(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'auth');
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const userId = req.session.userId;
    log(`Logout attempt for user ID: ${userId}`, 'auth');

    req.session.destroy((err) => {
      if (err) {
        log(`Logout error: ${err.message}`, 'auth');
        return res.status(500).json({ message: 'Failed to logout' });
      }
      log(`Logout successful for user ID: ${userId}`, 'auth');
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      log(`Auth check - Session ID: ${req.sessionID}, User ID: ${req.session.userId}`, 'auth');

      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        log(`User not found for ID: ${req.session.userId}`, 'auth');
        return res.status(401).json({ message: 'User not found' });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      log(`Auth check successful for user: ${user.username}`, 'auth');
      res.json({ user: userWithoutPassword });
    } catch (error) {
      log(`Auth check error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'auth');
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Machine routes - ensure authentication
  const requireAuth = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    next();
  };

  // API Sync routes
  app.post('/api/sync/machines', requireAuth, async (req, res) => {
    try {
      const success = await apiSyncService.syncAllMachines();
      const machines = await storage.getMachines();

      // Log the sync attempt
      await storage.createSyncLog({
        timestamp: new Date(),
        success,
        error: success ? null : 'Failed to sync with external API',
        machineCount: machines.length
      });

      if (success) {
        res.json({ message: 'Machines synced successfully' });
      } else {
        res.status(500).json({ message: 'Failed to sync machines' });
      }
    } catch (error) {
      // Log the sync error
      await storage.createSyncLog({
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        machineCount: 0
      });

      log(`Machine sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      res.status(500).json({ message: 'Failed to sync machines' });
    }
  });

  app.post('/api/sync/machines/:id/status', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await apiSyncService.syncMachineStatus(parseInt(id));
      if (success) {
        res.json({ message: 'Machine status synced successfully' });
      } else {
        res.status(500).json({ message: 'Failed to sync machine status' });
      }
    } catch (error) {
      log(`Machine status sync error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      res.status(500).json({ message: 'Failed to sync machine status' });
    }
  });

  // Machine routes
  app.get('/api/machines', requireAuth, async (req, res) => {
    const machines = await storage.getMachines();
    res.json({ machines });
  });

  app.post('/api/machines', requireAuth, async (req, res) => {
    const parsed = insertMachineSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error });
    }

    const machine = await storage.createMachine(parsed.data);
    broadcast({ type: 'machine_update', payload: machine });
    res.json({ machine });
  });

  app.patch('/api/machines/:id/status', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const machine = await storage.updateMachineStatus(parseInt(id), status);
    broadcast({ type: 'machine_update', payload: machine });
    res.json({ machine });
  });

  // Alert routes
  app.get('/api/alerts', requireAuth, async (req, res) => {
    const { machineId } = req.query;
    const alerts = await storage.getAlerts(
      machineId ? parseInt(machineId as string) : undefined
    );
    res.json({ alerts });
  });

  app.post('/api/alerts', requireAuth, async (req, res) => {
    const parsed = insertAlertSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error });
    }

    const alert = await storage.createAlert(parsed.data);
    // Also report the alert to the external API
    await apiSyncService.reportAlert(alert.machineId, parsed.data);
    broadcast({ type: 'new_alert', payload: alert });
    res.json({ alert });
  });

  app.post('/api/alerts/:id/clear', requireAuth, async (req, res) => {
    const { id } = req.params;
    const alert = await storage.clearAlert(parseInt(id), req.session.userId!);
    broadcast({ type: 'alert_cleared', payload: alert });
    res.json({ alert });
  });

  // Report routes
  app.get('/api/reports/machine-usage', requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const machines = await storage.getMachines();

      // Generate usage report data
      const reportData = machines.map(machine => ({
        name: machine.name,
        location: machine.location,
        cycles: machine.metrics?.cycles || 0,
        uptime: machine.metrics?.uptime || 0,
        errors: machine.metrics?.errors || 0,
        temperature: machine.metrics?.temperature || 0,
        waterLevel: machine.metrics?.waterLevel || 0,
        detergentLevel: machine.metrics?.detergentLevel || 0,
        lastPing: machine.lastPing
      }));

      res.json({ data: reportData });
    } catch (error) {
      log(`Failed to generate machine usage report: ${error instanceof Error ? error.message : 'Unknown error'}`, 'reports');
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  app.get('/api/reports/maintenance', requireAuth, async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      const machines = await storage.getMachines();

      // Generate maintenance report data
      const reportData = alerts
        .filter(alert => alert.category === 'maintenance')
        .map(alert => {
          const machine = machines.find(m => m.id === alert.machineId);
          return {
            machineId: alert.machineId,
            machineName: machine?.name || `Machine ${alert.machineId}`,
            location: machine?.location || 'Unknown',
            issue: alert.message,
            status: alert.status,
            priority: alert.priority || 'low',
            createdAt: alert.createdAt,
            resolvedAt: alert.clearedAt || null,
            resolvedBy: alert.clearedBy || null
          };
        });

      res.json({ data: reportData });
    } catch (error) {
      log(`Failed to generate maintenance report: ${error instanceof Error ? error.message : 'Unknown error'}`, 'reports');
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  app.get('/api/reports/machine-uptime', requireAuth, async (req, res) => {
    try {
      const machines = await storage.getMachines();

      // Generate uptime report data
      const reportData = machines.map(machine => ({
        name: machine.name,
        location: machine.location,
        status: machine.status,
        uptime: machine.metrics?.uptime || 0,
        lastPing: machine.lastPing,
        totalCycles: machine.metrics?.cycles || 0
      }));

      res.json({ data: reportData });
    } catch (error) {
      log(`Failed to generate uptime report: ${error instanceof Error ? error.message : 'Unknown error'}`, 'reports');
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  // Admin routes
  app.get('/api/admin/sync-info', requireAuth, async (req, res) => {
    try {
      const lastSync = await storage.getLastSyncLog();
      res.json({ lastSync });
    } catch (error) {
      log(`Failed to get sync info: ${error instanceof Error ? error.message : 'Unknown error'}`, 'admin');
      res.status(500).json({ message: 'Failed to get sync info' });
    }
  });


  // Broadcast to all clients
  const broadcast = (message: WSMessage) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  return httpServer;
}