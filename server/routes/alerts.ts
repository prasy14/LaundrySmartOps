import { Router } from "express";
import { storage } from "../storage";
import { analyticsService } from "../services/analytics";
import { isOperatorOrAbove } from "../middleware/auth";

const alertsRouter = Router();

// Routes are already protected by the middleware applied in server/routes.ts

// Get all alerts with filtering options
alertsRouter.get('/', async (req, res) => {
  try {
    const { 
      locationId, 
      serviceType, 
      status,
      fromDate,
      toDate
    } = req.query;

    let alerts = await storage.getAlerts();
    
    // Filter by location if provided
    if (locationId && locationId !== 'all') {
      const locationIdNum = parseInt(locationId as string);
      const machines = await storage.getMachinesByLocation(locationIdNum);
      const machineIds = machines.map(m => m.id);
      alerts = alerts.filter(alert => machineIds.includes(alert.machineId));
    }
    
    // Filter by service type if provided
    if (serviceType && serviceType !== 'all') {
      alerts = alerts.filter(alert => alert.serviceType === serviceType);
    }
    
    // Filter by status if provided
    if (status) {
      if (status === 'active') {
        // Only show active and in_progress alerts
        alerts = alerts.filter(alert => ['active', 'in_progress'].includes(alert.status));
      } else if (status === 'historical') {
        // Show all alerts, but we could filter to only resolved/cleared if needed
        // alerts = alerts.filter(alert => ['resolved', 'cleared'].includes(alert.status));
      }
    }
    
    // Filter by date range if provided
    if (fromDate && toDate) {
      const from = new Date(fromDate as string);
      const to = new Date(toDate as string);
      
      alerts = alerts.filter(alert => {
        const alertDate = new Date(alert.createdAt);
        return alertDate >= from && alertDate <= to;
      });
    }
    
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch alerts'
    });
  }
});

// Get specific alert by ID
alertsRouter.get('/:id', async (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const alerts = await storage.getAlerts(alertId);
    
    if (alerts.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ alert: alerts[0] });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch alert'
    });
  }
});

// Get recurring errors - alerts grouped by machine with count
alertsRouter.get('/recurring/:minCount', async (req, res) => {
  try {
    const minCount = parseInt(req.params.minCount) || 3;
    const alerts = await storage.getAlerts();
    
    // Group alerts by machine ID
    const machineAlertCounts: {[key: number]: number} = {};
    alerts.forEach(alert => {
      if (!machineAlertCounts[alert.machineId]) {
        machineAlertCounts[alert.machineId] = 1;
      } else {
        machineAlertCounts[alert.machineId]++;
      }
    });
    
    // Filter to get only those with at least minCount occurrences
    const recurringMachines = Object.entries(machineAlertCounts)
      .filter(([_, count]) => count >= minCount)
      .map(([machineId, count]) => ({
        machineId: parseInt(machineId),
        alertCount: count
      }));
    
    res.json({ recurringMachines });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch recurring errors'
    });
  }
});

// Get unresolved alerts for a specific location
alertsRouter.get('/location/:locationId/unresolved', async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId);
    const unresolvedAlerts = await analyticsService.getUnresolvedAlertsByLocation(locationId);
    
    res.json({ alerts: unresolvedAlerts });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch unresolved alerts'
    });
  }
});

// Clear alert (mark as resolved)
alertsRouter.post('/:id/clear', async (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    
    if (!req.session.userId) {
      return res.status(403).json({ error: 'Authentication required' });
    }
    
    const userId = req.session.userId;
    
    const updatedAlert = await storage.clearAlert(alertId, userId);
    
    res.json({ alert: updatedAlert });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to clear alert'
    });
  }
});

export default alertsRouter;