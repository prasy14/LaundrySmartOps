import { Router } from 'express';
import { storage } from '../storage';
import { insertAuditTotalVendingSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Get all audit total vending records
router.get('/', async (req, res) => {
  try {
    const vendings = await storage.getAuditTotalVendings();
    res.json({ vendings });
  } catch (error) {
    console.error('Error fetching audit total vendings:', error);
    res.status(500).json({ error: 'Failed to fetch audit total vendings' });
  }
});

// Get audit total vending records by location
router.get('/location/:locationId', async (req, res) => {
  try {
    const locationId = req.params.locationId;
    const vendings = await storage.getAuditTotalVendingsByLocation(locationId);
    res.json({ vendings });
  } catch (error) {
    console.error('Error fetching audit total vendings by location:', error);
    res.status(500).json({ error: 'Failed to fetch audit total vendings by location' });
  }
});

// Get audit total vending records by machine
router.get('/machine/:machineId', async (req, res) => {
  try {
    const machineId = req.params.machineId;
    const vendings = await storage.getAuditTotalVendingsByMachine(machineId);
    res.json({ vendings });
  } catch (error) {
    console.error('Error fetching audit total vendings by machine:', error);
    res.status(500).json({ error: 'Failed to fetch audit total vendings by machine' });
  }
});

// Get specific audit total vending record
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid audit total vending ID' });
    }
    
    const vending = await storage.getAuditTotalVending(id);
    if (!vending) {
      return res.status(404).json({ error: 'Audit total vending record not found' });
    }
    
    res.json({ vending });
  } catch (error) {
    console.error('Error fetching audit total vending:', error);
    res.status(500).json({ error: 'Failed to fetch audit total vending record' });
  }
});

// Create new audit total vending record
router.post('/', async (req, res) => {
  try {
    const validatedData = insertAuditTotalVendingSchema.parse(req.body);
    const vending = await storage.createAuditTotalVending(validatedData);
    res.status(201).json({ vending });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating audit total vending:', error);
    res.status(500).json({ error: 'Failed to create audit total vending record' });
  }
});

// Update audit total vending record
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid audit total vending ID' });
    }
    
    const existingVending = await storage.getAuditTotalVending(id);
    if (!existingVending) {
      return res.status(404).json({ error: 'Audit total vending record not found' });
    }
    
    const validatedData = insertAuditTotalVendingSchema.partial().parse(req.body);
    const updatedVending = await storage.updateAuditTotalVending(id, validatedData);
    res.json({ vending: updatedVending });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error updating audit total vending:', error);
    res.status(500).json({ error: 'Failed to update audit total vending record' });
  }
});

// Delete audit total vending record
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid audit total vending ID' });
    }
    
    const existingVending = await storage.getAuditTotalVending(id);
    if (!existingVending) {
      return res.status(404).json({ error: 'Audit total vending record not found' });
    }
    
    const deleted = await storage.deleteAuditTotalVending(id);
    if (deleted) {
      res.json({ message: 'Audit total vending record deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete audit total vending record' });
    }
  } catch (error) {
    console.error('Error deleting audit total vending:', error);
    res.status(500).json({ error: 'Failed to delete audit total vending record' });
  }
});

// Process total vending report (special endpoint for your JSON data)
router.post('/total-vending-report', async (req, res) => {
  try {
    console.log('Received total vending report request');
    
    if (!req.body || !req.body.reportId || req.body.reportId !== 'AUDIT_TOTAL_VENDING') {
      return res.status(400).json({ 
        error: 'Invalid report format. Expected reportId: AUDIT_TOTAL_VENDING' 
      });
    }
    
    const vendings = await storage.createAuditTotalVendingsFromReport(req.body);
    
    res.status(201).json({
      message: `Successfully processed ${vendings.length} total vending records`,
      processedCount: vendings.length,
      vendings: vendings
    });
    
  } catch (error) {
    console.error('Error processing total vending report:', error);
    res.status(500).json({ 
      error: 'Failed to process total vending report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;