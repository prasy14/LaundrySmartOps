import { Router } from "express";
import { storage } from "../storage";
import { analyticsService } from "../services/analytics";
import { isOperatorOrAbove } from "../middleware/auth";
import { differenceInMinutes, endOfDay, isAfter, isBefore, subDays, subYears } from "date-fns";
import { log } from "console";

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
    if (locationId && locationId !== 'all')
    {
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
    if (status) 
    {
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
  } 
  catch (error) 
  {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch alerts'
    });
  }
});

// alertsRouter.get('/persistent-errors', async (req, res) => {
//   try {
//     const machineErrors = await storage.getPersistentMachineErrors(); // this returns all machine error records
//      console.log("Persist Errors : ", machineErrors);
//     // Group by machineId + errorCode or errorType
//     const groupedErrors: Record<string, { machineId: number, errorType: string, errordescription:string, timestamps: Date[] }> = {};

//     for (const error of machineErrors) {
//       const key = `${error.machineId}-${error.type}`;
//       if (!groupedErrors[key]) {
//         groupedErrors[key] = {
//           machineId: error.machineId,
//           errorType: error.error_type,
//           errordescription:error.error_name,
//           timestamps: [],
//         };
//       }
//       groupedErrors[key].timestamps.push(new Date(error.timestamp));
//     }

//     // Filter for errors that lasted more than 1 hour
//     const persistentErrors = Object.values(groupedErrors)
//       .map(group => {
//         const sortedTimestamps = group.timestamps.sort((a, b) => a.getTime() - b.getTime());
//         const durationInMinutes = differenceInMinutes(
//           sortedTimestamps[sortedTimestamps.length - 1],
//           sortedTimestamps[0]
//         );
//         return {
//           machineId: group.machineId,
//           errorType: group.errorType,
//           durationInMinutes,
//         };
//       })
//       .filter(entry => entry.durationInMinutes > 60); // More than 1 hour

//     res.json({ persistentErrors });
//   } catch (error) {
//     res.status(500).json({
//       error: error instanceof Error ? error.message : 'Failed to fetch persistent errors'
//     });
//   }
// });

alertsRouter.get("/historical-alerts", async (req, res) => {
  try {
    console.log("[/historical-alerts] Fetching all machine errors...");

    const allAlerts = await storage.getMachineErrors();
    console.log("[/historical-alerts] Total alerts fetched from DB:", allAlerts.length);

    const now = new Date();
    const twoDaysAgo = subDays(now, 2);
    console.log("[/historical-alerts] Current time:", now.toISOString());
    console.log("[/historical-alerts] Filtering alerts created before:", twoDaysAgo.toISOString());

    const filteredAlerts = allAlerts.filter(alert => {
      const createdAt = new Date(alert.createdAt);
      const isHistorical = isBefore(createdAt, twoDaysAgo);

      if (isHistorical) {
        console.log(`[ALERT] Included | Created At: ${createdAt.toISOString()} | Machine ID: ${alert.machineId} | Error: ${alert.errorName}`);
      } else {
        console.log(`[ALERT] Skipped  | Created At: ${createdAt.toISOString()} | Machine ID: ${alert.machineId} | Error: ${alert.errorName}`);
      }

      return isHistorical;
    });

    console.log("[/historical-alerts] Total historical alerts:", filteredAlerts.length);

    res.json({ historicalAlerts: filteredAlerts });
  } catch (error) {
    console.error("[/historical-alerts] Error fetching historical alerts:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch historical alerts",
    });
  }
});

alertsRouter.get('/persistent-errors', async (req, res) => {
  try {
    const machineErrors = await storage.getPersistentMachineErrors();
    res.json({ alerts: machineErrors });

  } catch (error) {
    console.error("Error in /persistent-errors:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch persistent errors",
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
  try 
  {
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
  } 
  catch (error)
  {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch recurring errors'
    });
  }
});

// Get unresolved alerts for a specific location
alertsRouter.get('/location/:locationId/unresolved', async (req, res) => {
  try 
  {
    const locationId = parseInt(req.params.locationId);
    const unresolvedAlerts = await analyticsService.getUnresolvedAlertsByLocation(locationId);
    res.json
    ({ 
      alerts: unresolvedAlerts 
    });
  } 
  catch (error) 
  {
    res.status(500).json
    ({
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