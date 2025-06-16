import { Router } from "express";
import { storage } from "../storage";
import { externalMachineErrorSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Get all machine errors
router.get("/", async (req, res) => {
  try {
    const errors = await storage.getMachineErrors();
    res.json({ errors });
  } catch (error) {
    console.error("Error fetching machine errors:", error);
    res.status(500).json({ error: "Failed to fetch machine errors" });
  }
});

// Get machine errors by machine ID
router.get("/machine/:machineId", async (req, res) => {
  try {
    const machineId = parseInt(req.params.machineId);
    if (isNaN(machineId)) {
      return res.status(400).json({ error: "Invalid machine ID" });
    }

    const errors = await storage.getMachineErrorsByMachine(machineId);
    res.json({ errors });
  } catch (error) {
    console.error("Error fetching machine errors by machine:", error);
    res.status(500).json({ error: "Failed to fetch machine errors" });
  }
});

// Get machine errors by location ID
router.get("/location/:locationId", async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    const errors = await storage.getMachineErrorsByLocation(locationId);
    res.json({ errors });
  } catch (error) {
    console.error("Error fetching machine errors by location:", error);
    res.status(500).json({ error: "Failed to fetch machine errors" });
  }
});

// Create machine errors from JSON array
router.post("/bulk", async (req, res) => {
  try {
    const { errors, machineId, locationId } = req.body;

    if (!Array.isArray(errors)) {
      return res.status(400).json({ error: "Errors must be an array" });
    }

    if (!machineId || !locationId) {
      return res.status(400).json({ error: "Machine ID and Location ID are required" });
    }

    // Validate the error structure
    const validationSchema = z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      type: z.string(),
      code: z.number(),
      timestamp: z.string()
    }));

    const validatedErrors = validationSchema.parse(errors);
    
    const createdErrors = await storage.createMachineErrorsFromJson(
      validatedErrors, 
      parseInt(machineId), 
      parseInt(locationId)
    );

    res.status(201).json({ 
      message: `Created ${createdErrors.length} machine errors`,
      errors: createdErrors 
    });
  } catch (error) {
    console.error("Error creating machine errors from JSON:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid error data format",
        details: error.errors 
      });
    }
    res.status(500).json({ error: "Failed to create machine errors" });
  }
});

// Create a single machine error
router.post("/", async (req, res) => {
  try {
    const errorData = req.body;
    
    // Transform external format to internal format if needed
    let transformedError;
    try {
      transformedError = externalMachineErrorSchema.parse(errorData);
    } catch (parseError) {
      // If external format fails, try direct internal format
      transformedError = errorData;
    }

    const createdError = await storage.createMachineError(transformedError);
    res.status(201).json({ error: createdError });
  } catch (error) {
    console.error("Error creating machine error:", error);
    res.status(500).json({ error: "Failed to create machine error" });
  }
});

// Delete a machine error
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteMachineError(id);
    
    if (success) {
      res.json({ message: "Machine error deleted successfully" });
    } else {
      res.status(404).json({ error: "Machine error not found" });
    }
  } catch (error) {
    console.error("Error deleting machine error:", error);
    res.status(500).json({ error: "Failed to delete machine error" });
  }
});

export default router;