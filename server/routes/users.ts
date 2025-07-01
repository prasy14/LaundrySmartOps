import { Router } from "express";
import { storage } from "../storage";
import { insertCoinVaultSchema } from "@shared/schema";
import { z } from "zod";


const router = Router();

// GET /api/users - Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const users = await storage.getAllUsers(); // Make sure this exists
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
