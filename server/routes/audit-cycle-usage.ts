import { Router } from "express";
import { storage } from "../storage";
import { insertAuditCycleUsageSchema } from "@shared/schema";
import { isManagerOrAdmin } from "../middleware/auth";

const router = Router();

// Get all audit cycle usages
router.get("/", isManagerOrAdmin, async (req, res) => {
  try {
    const usages = await storage.getAuditCycleUsages();
    res.json(usages);
  } catch (error) {
    console.error("Error fetching audit cycle usages:", error);
    res.status(500).json({ error: "Failed to fetch audit cycle usages" });
  }
});

// Get audit cycle usages by location
router.get("/location/:locationId", isManagerOrAdmin, async (req, res) => {
  try {
    const locationId = req.params.locationId;
    const usages = await storage.getAuditCycleUsagesByLocation(locationId);
    res.json(usages);
  } catch (error) {
    console.error("Error fetching audit cycle usages by location:", error);
    res.status(500).json({ error: "Failed to fetch audit cycle usages" });
  }
});

// Get audit cycle usages by machine
router.get("/machine/:machineId", isManagerOrAdmin, async (req, res) => {
  try {
    const machineId = req.params.machineId;
    const usages = await storage.getAuditCycleUsagesByMachine(machineId);
    res.json(usages);
  } catch (error) {
    console.error("Error fetching audit cycle usages by machine:", error);
    res.status(500).json({ error: "Failed to fetch audit cycle usages" });
  }
});

// Get specific audit cycle usage
router.get("/:id", isManagerOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid usage ID" });
    }
    
    const usage = await storage.getAuditCycleUsage(id);
    if (!usage) {
      return res.status(404).json({ error: "Audit cycle usage not found" });
    }
    
    res.json(usage);
  } catch (error) {
    console.error("Error fetching audit cycle usage:", error);
    res.status(500).json({ error: "Failed to fetch audit cycle usage" });
  }
});

// Create new audit cycle usage
router.post("/", isManagerOrAdmin, async (req, res) => {
  try {
    const validatedData = insertAuditCycleUsageSchema.parse(req.body);
    const usage = await storage.createAuditCycleUsage(validatedData);
    res.status(201).json(usage);
  } catch (error) {
    console.error("Error creating audit cycle usage:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ 
        error: "Invalid data", 
        details: error.errors 
      });
    }
    res.status(500).json({ error: "Failed to create audit cycle usage" });
  }
});

// Update audit cycle usage
router.put("/:id", isManagerOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid usage ID" });
    }
    
    const validatedData = insertAuditCycleUsageSchema.partial().parse(req.body);
    const usage = await storage.updateAuditCycleUsage(id, validatedData);
    res.json(usage);
  } catch (error) {
    console.error("Error updating audit cycle usage:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ 
        error: "Invalid data", 
        details: error.errors 
      });
    }
    res.status(500).json({ error: "Failed to update audit cycle usage" });
  }
});

// Delete audit cycle usage
router.delete("/:id", isManagerOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid usage ID" });
    }
    
    const success = await storage.deleteAuditCycleUsage(id);
    if (!success) {
      return res.status(404).json({ error: "Audit cycle usage not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting audit cycle usage:", error);
    res.status(500).json({ error: "Failed to delete audit cycle usage" });
  }
});

// Process cycle usage report (bulk import)
router.post("/cycle-usage-report", isManagerOrAdmin, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        error: "Invalid request body. Expected JSON object with cycle usage data." 
      });
    }

    // Validate report structure
    if (!req.body.data?.locations || !Array.isArray(req.body.data.locations)) {
      return res.status(400).json({ 
        error: "Invalid report structure. Expected 'data.locations' array." 
      });
    }

    console.log(`Processing cycle usage report with ${req.body.data.locations.length} locations`);
    
    const usages = await storage.createAuditCycleUsagesFromReport(req.body);
    
    res.status(201).json({
      message: `Successfully processed cycle usage report`,
      count: usages.length,
      usages: usages
    });
  } catch (error) {
    console.error("Error processing cycle usage report:", error);
    res.status(500).json({ 
      error: "Failed to process cycle usage report",
      details: error.message 
    });
  }
});

export default router;