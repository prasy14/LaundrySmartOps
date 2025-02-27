import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertMachineSchema, insertAlertSchema } from "@shared/schema";
import type { WSMessage } from "@shared/schema";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Broadcast to all clients
  const broadcast = (message: WSMessage) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
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
      res.json({ user });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Machine routes
  app.get('/api/machines', async (req, res) => {
    const machines = await storage.getMachines();
    res.json({ machines });
  });

  app.post('/api/machines', async (req, res) => {
    const parsed = insertMachineSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error });
    }

    const machine = await storage.createMachine(parsed.data);
    broadcast({ type: 'machine_update', payload: machine });
    res.json({ machine });
  });

  app.patch('/api/machines/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const machine = await storage.updateMachineStatus(parseInt(id), status);
    broadcast({ type: 'machine_update', payload: machine });
    res.json({ machine });
  });

  // Alert routes
  app.get('/api/alerts', async (req, res) => {
    const { machineId } = req.query;
    const alerts = await storage.getAlerts(
      machineId ? parseInt(machineId as string) : undefined
    );
    res.json({ alerts });
  });

  app.post('/api/alerts', async (req, res) => {
    const parsed = insertAlertSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error });
    }

    const alert = await storage.createAlert(parsed.data);
    broadcast({ type: 'new_alert', payload: alert });
    res.json({ alert });
  });

  app.post('/api/alerts/:id/clear', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    const alert = await storage.clearAlert(parseInt(id), req.session.userId);
    broadcast({ type: 'alert_cleared', payload: alert });
    res.json({ alert });
  });

  return httpServer;
}