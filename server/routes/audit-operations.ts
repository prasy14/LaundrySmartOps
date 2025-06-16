import { Router } from "express";
import { storage } from "../storage";
import { isManagerOrAdmin } from "../middleware/auth";
import { insertAuditOperationSchema } from "@shared/schema";
import { ZodError } from "zod";

const router = Router();

// Get all audit operations
router.get("/", isManagerOrAdmin, async (req, res) => {
  try {
    const operations = await storage.getAuditOperations();
    res.json(operations);
  } catch (error) {
    console.error("Error fetching audit operations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get audit operations by location
router.get("/location/:locationId", isManagerOrAdmin, async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    const operations = await storage.getAuditOperationsByLocation(locationId);
    res.json(operations);
  } catch (error) {
    console.error("Error fetching audit operations by location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get audit operations by machine
router.get("/machine/:machineId", isManagerOrAdmin, async (req, res) => {
  try {
    const machineId = parseInt(req.params.machineId);
    if (isNaN(machineId)) {
      return res.status(400).json({ error: "Invalid machine ID" });
    }

    const operations = await storage.getAuditOperationsByMachine(machineId);
    res.json(operations);
  } catch (error) {
    console.error("Error fetching audit operations by machine:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get specific audit operation
router.get("/:id", isManagerOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid audit operation ID" });
    }

    const operation = await storage.getAuditOperation(id);
    if (!operation) {
      return res.status(404).json({ error: "Audit operation not found" });
    }

    res.json(operation);
  } catch (error) {
    console.error("Error fetching audit operation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new audit operation
router.post("/", isManagerOrAdmin, async (req, res) => {
  try {
    const validatedData = insertAuditOperationSchema.parse({
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    const operation = await storage.createAuditOperation(validatedData);
    res.status(201).json(operation);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: error.errors 
      });
    }
    console.error("Error creating audit operation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update audit operation
router.put("/:id", isManagerOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid audit operation ID" });
    }

    const validatedData = insertAuditOperationSchema.partial().parse({
      ...req.body,
      updatedBy: req.user?.id,
    });

    const operation = await storage.updateAuditOperation(id, validatedData);
    res.json(operation);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: error.errors 
      });
    }
    console.error("Error updating audit operation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete audit operation
router.delete("/:id", isManagerOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid audit operation ID" });
    }

    const success = await storage.deleteAuditOperation(id);
    if (!success) {
      return res.status(404).json({ error: "Audit operation not found" });
    }

    res.json({ message: "Audit operation deleted successfully" });
  } catch (error) {
    console.error("Error deleting audit operation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Process audit operations report
router.post("/report", isManagerOrAdmin, async (req, res) => {
  try {
    const operations = await storage.createAuditOperationsFromReport(req.body);
    res.status(201).json({
      message: `Successfully processed ${operations.length} audit operations`,
      operations
    });
  } catch (error) {
    console.error("Error processing audit operations report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;