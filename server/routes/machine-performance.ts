import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { isManagerOrAdmin } from '../middleware/auth';

const router = Router();

// Schema for query parameters
const dateRangeSchema = z.object({
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

const machineIdsSchema = z.object({
  machineIds: z.string().optional().default('').transform(ids => {
    if (!ids) return [];
    return ids.split(',').filter(id => id.trim()).map(id => parseInt(id.trim(), 10));
  }),
});

// Get metrics for a specific machine
router.get('/machines/:machineId/metrics', isManagerOrAdmin, async (req, res) => {
  try {
    const machineId = parseInt(req.params.machineId, 10);
    
    if (isNaN(machineId)) {
      return res.status(400).json({ error: 'Invalid machine ID' });
    }
    
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const metrics = await storage.getMachinePerformanceMetrics(machineId, startDate, endDate);
    return res.json(metrics);
  } catch (error) {
    console.error('Error fetching machine metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch machine metrics' });
  }
});

// Get metrics for a specific location
router.get('/locations/:locationId/metrics', isManagerOrAdmin, async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId, 10);
    
    if (isNaN(locationId)) {
      return res.status(400).json({ error: 'Invalid location ID' });
    }
    
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const metrics = await storage.getMachinePerformanceMetricsForLocation(locationId, startDate, endDate);
    return res.json(metrics);
  } catch (error) {
    console.error('Error fetching location metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch location metrics' });
  }
});

// Get metrics for a specific machine type
router.get('/machine-types/:machineTypeId/metrics', isManagerOrAdmin, async (req, res) => {
  try {
    const machineTypeId = parseInt(req.params.machineTypeId, 10);
    
    if (isNaN(machineTypeId)) {
      return res.status(400).json({ error: 'Invalid machine type ID' });
    }
    
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const metrics = await storage.getMachinePerformanceMetricsByType(machineTypeId, startDate, endDate);
    return res.json(metrics);
  } catch (error) {
    console.error('Error fetching machine type metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch machine type metrics' });
  }
});

// Get comparable metrics for multiple machines
router.get('/machine-comparison', isManagerOrAdmin, async (req, res) => {
  try {
    const { machineIds } = machineIdsSchema.parse(req.query);
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required for comparison' });
    }
    
    if (!machineIds.length) {
      return res.status(400).json({ error: 'At least one machine ID is required' });
    }
    
    const comparisonData = await storage.getComparableMachineMetrics(machineIds, startDate, endDate);
    return res.json(comparisonData);
  } catch (error) {
    console.error('Error fetching machine comparison data:', error);
    return res.status(500).json({ error: 'Failed to fetch machine comparison data' });
  }
});

// Add metrics for a machine
router.post('/machines/:machineId/metrics', isManagerOrAdmin, async (req, res) => {
  try {
    const machineId = parseInt(req.params.machineId, 10);
    
    if (isNaN(machineId)) {
      return res.status(400).json({ error: 'Invalid machine ID' });
    }
    
    const metrics = {
      ...req.body,
      machineId,
      date: new Date(req.body.date || new Date())
    };
    
    const result = await storage.addMachinePerformanceMetrics(metrics);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error adding machine metrics:', error);
    return res.status(500).json({ error: 'Failed to add machine metrics' });
  }
});

// Update metrics for a machine
router.patch('/metrics/:metricId', isManagerOrAdmin, async (req, res) => {
  try {
    const metricId = parseInt(req.params.metricId, 10);
    
    if (isNaN(metricId)) {
      return res.status(400).json({ error: 'Invalid metric ID' });
    }
    
    const result = await storage.updateMachinePerformanceMetrics(metricId, req.body);
    return res.json(result);
  } catch (error) {
    console.error('Error updating machine metrics:', error);
    return res.status(500).json({ error: 'Failed to update machine metrics' });
  }
});

export default router;