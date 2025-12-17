import express, { Response } from "express";
import pool from "../db/database.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

// Get user's favorites
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const result = await pool.query(
      `SELECT v.*, f.created_at as favorited_at
       FROM favorites f
       JOIN vehicles v ON f.vehicle_id = v.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Add to favorites
router.post("/:vehicleId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { vehicleId } = req.params;

    // Check if vehicle exists
    const vehicleCheck = await pool.query(
      "SELECT id FROM vehicles WHERE id = $1",
      [vehicleId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // Check if already favorited
    const existing = await pool.query(
      "SELECT id FROM favorites WHERE user_id = $1 AND vehicle_id = $2",
      [userId, vehicleId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Already in favorites" });
    }

    // Add to favorites
    await pool.query(
      "INSERT INTO favorites (user_id, vehicle_id) VALUES ($1, $2)",
      [userId, vehicleId]
    );

    res.json({ message: "Added to favorites" });
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(400).json({ error: "Already in favorites" });
    }
    console.error("Error adding to favorites:", error);
    res.status(500).json({ error: "Failed to add to favorites" });
  }
});

// Remove from favorites
router.delete("/:vehicleId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { vehicleId } = req.params;

    const result = await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND vehicle_id = $2",
      [userId, vehicleId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ error: "Failed to remove from favorites" });
  }
});

// Check if vehicle is favorited
router.get("/check/:vehicleId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { vehicleId } = req.params;

    const result = await pool.query(
      "SELECT id FROM favorites WHERE user_id = $1 AND vehicle_id = $2",
      [userId, vehicleId]
    );

    res.json({ isFavorited: result.rows.length > 0 });
  } catch (error) {
    console.error("Error checking favorite:", error);
    res.status(500).json({ error: "Failed to check favorite" });
  }
});

export default router;
