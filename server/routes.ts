import type { Express } from "express";
import { createServer, type Server } from "http";
import { ApiSyncService } from "./services/api-sync";
import { storage } from "./storage";
import { log } from "./vite";
import express from "express";
import authRoutes from "./routes/auth";
import syncRoutes from "./routes/sync";
import reportsRoutes from "./routes/reports";
import alertsRoutes from "./routes/alerts";
import reportEmailRoutes from "./routes/reports-email";
import machinePerformanceRoutes from "./routes/machine-performance";
import { serviceAlertsRouter } from "./routes/service-alerts";
import machineErrorsRoutes from "./routes/machine-errors";
import coinVaultRoutes from "./routes/coin-vault";
import auditOperationsRoutes from "./routes/audit-operations";
import auditCycleUsageRoutes from "./routes/audit-cycle-usage";
import auditTotalVendingRoutes from "./routes/audit-total-vending";
import { isManagerOrAdmin, isOperatorOrAbove } from "./middleware/auth";
import { db } from "./db";
import { machineErrors } from "@shared/schema";
import usersRoutes from "./routes/users";


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

    // Auth routes - No middleware needed as these handle authentication
    apiRouter.use('/auth', authRoutes);

    // Protected routes - Apply middleware here
    apiRouter.use('/sync', isManagerOrAdmin, syncRoutes);
    apiRouter.use('/reports', isManagerOrAdmin, reportsRoutes);
    apiRouter.use('/reports/email', isManagerOrAdmin, reportEmailRoutes);
    apiRouter.use('/alerts', isOperatorOrAbove, alertsRoutes);
    apiRouter.use('/', isOperatorOrAbove, serviceAlertsRouter);
    apiRouter.use('/machine-performance', isOperatorOrAbove, machinePerformanceRoutes);
    apiRouter.use('/machine-errors', isOperatorOrAbove, machineErrorsRoutes);
    apiRouter.use('/coin-vaults', isManagerOrAdmin, coinVaultRoutes);
    apiRouter.use('/audit-operations', isManagerOrAdmin, auditOperationsRoutes);
    apiRouter.use('/audit-cycle-usage', isManagerOrAdmin, auditCycleUsageRoutes);
    apiRouter.use('/audit-total-vending', isManagerOrAdmin, auditTotalVendingRoutes);
    apiRouter.use("/users", isManagerOrAdmin,  usersRoutes); 


    // Data access routes
    apiRouter.get('/locations', isOperatorOrAbove, async (req, res) => {
      try {
        const locations = await storage.getLocations();
        res.json({ locations });
      } catch (error) {
        log(`Error fetching locations: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch locations' });
      }
    });

    // Campus routes
    apiRouter.get('/campuses', isOperatorOrAbove, async (req, res) => {
      try {
        const campuses = await storage.getCampuses();
        res.json({ campuses });
      } catch (error) {
        log(`Error fetching campuses: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch campuses' });
      }
    });

    apiRouter.post('/campuses/generate', isManagerOrAdmin, async (req, res) => {
      try {
        await storage.generateCampusDataFromLocations();
        const campuses = await storage.getCampuses();
        res.json({ 
          message: 'Campus data generated successfully',
          campuses 
        });
      } catch (error) {
        log(`Error generating campus data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to generate campus data' });
      }
    });
 apiRouter.get('/users', isOperatorOrAbove, async (req, res) => {
      try {
        const users = await storage.getAllUsers();
        res.json({ users });
      } catch (error) {
        log(`Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch users' });
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
    
    apiRouter.get('/machine-programs', isOperatorOrAbove, async (req, res) => {
      try {
        const programs = await storage.getMachinePrograms();
        res.json({ programs });
      } catch (error) {
        log(`Error fetching machine programs: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch machine programs' });
      }
    });
    
//machine-cycles
    apiRouter.get('/machine-cycles', isOperatorOrAbove, async (req, res) => {
      try {
        const machineCycles = await storage.getMachineCycles();
        res.json({ machineCycles });
      } catch (error) {
        log(`Error fetching machine cycles: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch machine cycles' });
      }
    });

    //cycle-modifiers
    apiRouter.get('/cycle-modifiers', isOperatorOrAbove, async (req, res) => {
      try {
        const cycleModifiers = await storage.getCycleModifiers(); 
        res.json({ cycleModifiers }); 
      } catch (error) {
        log(`Error fetching cycle modifiers: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api'); 
        res.status(500).json({ message: 'Failed to fetch cycle modifiers' }); 
      }
    });
    
    //cycle-steps
    apiRouter.get('/cycle-steps', isOperatorOrAbove, async (req, res) => {
      try {
        const cycleSteps = await storage.getCycleSteps(); 
        res.json({ cycleSteps }); 
      } catch (error) {
        log(`Error fetching cycle modifiers: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api'); 
        res.status(500).json({ message: 'Failed to fetch cycle modifiers' }); 
      }
    });

    // machine-errors
    apiRouter.get('/machine-errors', isOperatorOrAbove, async (req, res) => {
      try {
        const errors = await storage.getMachineErrorsWithDetails();
        res.json({ errors }); 
      } catch (error) {
        log(`Error fetching machine errors: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api'); 
        res.status(500).json({ message: 'Failed to fetch machine errors' }); 
      }
    });

    // Fix machine error endpoint
    apiRouter.post('/machines/:id/fix-error', isOperatorOrAbove, async (req, res) => {
      try {
        const machineId = parseInt(req.params.id);
        if (isNaN(machineId)) {
          return res.status(400).json({ message: 'Invalid machine ID' });
        }

        // Get the machine to check if it exists and has errors
        const machine = await storage.getMachine(machineId);
        if (!machine) {
          return res.status(404).json({ message: 'Machine not found' });
        }

        // Update machine status to clear error state
        const updatedMachine = await storage.updateMachineStatus(machineId, {
          status: 'IDLE',
          errorMessage: null,
          lastError: null
        });

        // Log the fix action
        log(`Machine ${machineId} error fixed by user ${req.session.userId}`, 'maintenance');

        res.json({ 
          message: 'Machine error fixed successfully', 
          machine: updatedMachine 
        });
      } catch (error) {
        log(`Error fixing machine error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fix machine error' });
      }
    });


    // Current user endpoint for authentication check
    apiRouter.get('/auth/me', async (req, res) => {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      try {
        const user = await storage.getUser(req.session.userId);
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }
        res.json({ user });
      } catch (error) {
        log(`Error fetching user: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api');
        res.status(500).json({ message: 'Failed to fetch user details' });
      }
    });



    // Mount the API router with /api prefix BEFORE any static file handling
    app.use('/api', apiRouter);

    log('All routes registered successfully', 'server');
    return httpServer;
  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'server');
    throw error;
  }
}
