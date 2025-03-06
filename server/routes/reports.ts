import { Router } from 'express';
import { analyticsService } from '../services/analytics';
import { isManagerOrAdmin } from '../middleware/auth';

const reportsRouter = Router();

// Apply middleware to protect all report routes
reportsRouter.use(isManagerOrAdmin);

// Get service alerts by location
reportsRouter.get('/service-alerts/:locationId?', async (req, res) => {
  try {
    const locationId = req.params.locationId ? parseInt(req.params.locationId) : undefined;
    const alerts = locationId ?
      await analyticsService.getAlertsByLocation(locationId) :
      await analyticsService.getAlerts();
    
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch service alerts'
    });
  }
});

// Get service issues by type
reportsRouter.get('/service-issues/:type?', async (req, res) => {
  try {
    const serviceType = req.params.type;
    const alerts = serviceType ?
      await analyticsService.getAlertsByServiceType(serviceType) :
      await analyticsService.getAlerts();
    
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch service issues'
    });
  }
});

// Get performance metrics
reportsRouter.get('/performance-metrics/:locationId?', async (req, res) => {
  try {
    const locationId = req.params.locationId ? parseInt(req.params.locationId) : undefined;
    const metrics = await analyticsService.getMachineUptimeMetrics(locationId);
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch performance metrics'
    });
  }
});

// Get sustainability metrics
reportsRouter.get('/sustainability-metrics/:locationId?', async (req, res) => {
  try {
    const locationId = req.params.locationId ? parseInt(req.params.locationId) : undefined;
    const metrics = await analyticsService.getSustainabilityMetrics(locationId);
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch sustainability metrics'
    });
  }
});

// Get alert response time metrics
reportsRouter.get('/response-time-metrics', async (req, res) => {
  try {
    const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;
    const averageTime = await analyticsService.getAverageResponseTime(locationId);
    
    res.json({ averageResponseTime: averageTime });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch response time metrics'
    });
  }
});

export default reportsRouter;
