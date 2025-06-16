import { Router } from "express";
import { storage } from "../storage";
import { insertCoinVaultSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// GET /api/coin-vaults - Get all coin vaults
router.get("/", async (req, res) => {
  try {
    const vaults = await storage.getCoinVaults();
    res.json(vaults);
  } catch (error) {
    console.error("Error fetching coin vaults:", error);
    res.status(500).json({ error: "Failed to fetch coin vaults" });
  }
});

// GET /api/coin-vaults/location/:id - Get coin vaults by location
router.get("/location/:id", async (req, res) => {
  try {
    const locationId = req.params.id;
    const vaults = await storage.getCoinVaultsByLocation(locationId);
    res.json(vaults);
  } catch (error) {
    console.error("Error fetching coin vaults by location:", error);
    res.status(500).json({ error: "Failed to fetch coin vaults by location" });
  }
});

// GET /api/coin-vaults/machine/:id - Get coin vaults by machine
router.get("/machine/:id", async (req, res) => {
  try {
    const machineId = req.params.id;
    const vaults = await storage.getCoinVaultsByMachine(machineId);
    res.json(vaults);
  } catch (error) {
    console.error("Error fetching coin vaults by machine:", error);
    res.status(500).json({ error: "Failed to fetch coin vaults by machine" });
  }
});

// POST /api/coin-vaults - Create or update a coin vault
router.post("/", async (req, res) => {
  try {
    const validatedData = insertCoinVaultSchema.parse(req.body);
    const vault = await storage.createOrUpdateCoinVault(validatedData);
    res.status(201).json(vault);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid data format", 
        details: error.errors 
      });
    }
    console.error("Error creating/updating coin vault:", error);
    res.status(500).json({ error: "Failed to create/update coin vault" });
  }
});

// POST /api/coin-vaults/report - Process coin vault report data
router.post("/report", async (req, res) => {
  try {
    const reportData = req.body;
    
    // Validate that it's a COIN_VAULT report
    if (reportData.reportId !== "COIN_VAULT") {
      return res.status(400).json({ 
        error: "Invalid report type", 
        expected: "COIN_VAULT" 
      });
    }
    
    const createdVaults = await storage.createCoinVaultsFromReport(reportData);
    
    res.status(201).json({
      message: `Successfully processed coin vault report`,
      vaultsProcessed: createdVaults.length,
      vaults: createdVaults
    });
  } catch (error) {
    console.error("Error processing coin vault report:", error);
    res.status(500).json({ 
      error: "Failed to process coin vault report",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE /api/coin-vaults/:id - Delete a coin vault
router.delete("/:id", async (req, res) => {
  try {
    const vaultId = parseInt(req.params.id);
    if (isNaN(vaultId)) {
      return res.status(400).json({ error: "Invalid vault ID" });
    }
    
    const success = await storage.deleteCoinVault(vaultId);
    if (success) {
      res.json({ message: "Coin vault deleted successfully" });
    } else {
      res.status(404).json({ error: "Coin vault not found" });
    }
  } catch (error) {
    console.error("Error deleting coin vault:", error);
    res.status(500).json({ error: "Failed to delete coin vault" });
  }
});

export default router;