import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Get all service alerts with enhanced machine error integration
router.get('/service-alerts', async (req, res) => {
  try {
    console.log('[api] Getting enhanced service alerts');
    
    // Get regular alerts
    const alerts = await storage.getAlerts();
    
    // Get persistent machine errors (errors lasting over 1 hour)
    const persistentErrors = await storage.getPersistentMachineErrors(1);
    
    // Enhanced alert data with machine error details
    const enhancedAlerts = alerts.map(alert => {
      const relatedError = persistentErrors.find(error => 
        error.machineId === alert.machineId && 
        alert.message.includes(error.errorName)
      );
      
      return {
        ...alert,
        relatedError: relatedError || null,
        errorDuration: relatedError ? 
          Math.round((Date.now() - new Date(relatedError.timestamp).getTime()) / (1000 * 60 * 60)) : null,
        errorDetails: relatedError ? {
          errorCode: relatedError.errorCode,
          errorType: relatedError.errorType,
          machineName: relatedError.machineName,
          locationName: relatedError.locationName,
          manufacturer: relatedError.manufacturer,
          modelNumber: relatedError.modelNumber,
          serialNumber: relatedError.serialNumber
        } : null
      };
    });

    res.json({ alerts: enhancedAlerts });
  } catch (error) {
    console.error('[api] Error getting enhanced service alerts:', error);
    res.status(500).json({ error: 'Failed to get service alerts' });
  }
});

// Get persistent machine errors
router.get('/persistent-errors', async (req, res) => {
  try {
    const durationHours = parseInt(req.query.duration as string) || 1;
    console.log(`[api] Getting machine errors persisting for ${durationHours} hours`);
    
    const persistentErrors = await storage.getPersistentMachineErrors(durationHours);
    
    res.json({ 
      persistentErrors,
      count: persistentErrors.length,
      durationHours 
    });
  } catch (error) {
    console.error('[api] Error getting persistent errors:', error);
    res.status(500).json({ error: 'Failed to get persistent errors' });
  }
});

// Create service alerts from persistent errors
router.post('/generate-alerts', async (req, res) => {
  try {
    console.log('[api] Generating service alerts from persistent errors');
    
    const alertsCreated = await storage.createServiceAlertsFromPersistentErrors();
    
    res.json({ 
      success: true,
      alertsCreated,
      message: `Generated ${alertsCreated} new service alerts from persistent machine errors`
    });
  } catch (error) {
    console.error('[api] Error generating alerts from persistent errors:', error);
    res.status(500).json({ error: 'Failed to generate service alerts' });
  }
});

// Get alert statistics with error correlation
router.get('/alert-statistics', async (req, res) => {
  try {
    console.log('[api] Getting alert statistics with error correlation');
    
    const alerts = await storage.getAlerts();
    const persistentErrors = await storage.getPersistentMachineErrors(1);
    
    const statistics = {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
      inProgressAlerts: alerts.filter(a => a.status === 'in_progress').length,
      persistentErrors: persistentErrors.length,
      alertsByPriority: {
        high: alerts.filter(a => a.priority === 'high').length,
        medium: alerts.filter(a => a.priority === 'medium').length,
        low: alerts.filter(a => a.priority === 'low').length
      },
      alertsByServiceType: {
        mechanical: alerts.filter(a => a.serviceType === 'mechanical').length,
        electrical: alerts.filter(a => a.serviceType === 'electrical').length,
        software: alerts.filter(a => a.serviceType === 'software').length,
        general: alerts.filter(a => a.serviceType === 'general').length
      },
      errorsByType: persistentErrors.reduce((acc, error) => {
        acc[error.errorType] = (acc[error.errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    res.json(statistics);
  } catch (error) {
    console.error('[api] Error getting alert statistics:', error);
    res.status(500).json({ error: 'Failed to get alert statistics' });
  }
});

// Get alerts by machine with error history
router.get('/alerts/machine/:machineId', async (req, res) => {
  try {
    const machineId = parseInt(req.params.machineId);
    console.log(`[api] Getting alerts for machine ${machineId} with error history`);
    
    const alerts = await storage.getAlerts(machineId);
    const persistentErrors = await storage.getPersistentMachineErrors(24); // Last 24 hours
    const machineErrors = persistentErrors.filter(error => error.machineId === machineId);
    
    res.json({ 
      alerts,
      persistentErrors: machineErrors,
      errorHistory: machineErrors.map(error => ({
        ...error,
        duration: Math.round((Date.now() - new Date(error.timestamp).getTime()) / (1000 * 60 * 60))
      }))
    });
  } catch (error) {
    console.error('[api] Error getting machine alerts:', error);
    res.status(500).json({ error: 'Failed to get machine alerts' });
  }
});

export { router as serviceAlertsRouter };