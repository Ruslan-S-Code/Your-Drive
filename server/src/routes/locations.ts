import express, { Request, Response } from 'express';
import pool from '../db/database.js';

const router = express.Router();

// Get all locations
router.get('/', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    const result = await pool.query(
      'SELECT * FROM locations ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get locations error:', error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
      return res.status(503).json({ 
        error: 'Database connection failed. Please ensure PostgreSQL is running and database is configured.',
        details: 'Database not available'
      });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get location by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM locations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

