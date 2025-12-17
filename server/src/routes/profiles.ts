import express, { Request, Response } from 'express';
import pool from '../db/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // Only allow users to see their own profile
    if (userId !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      `SELECT p.*, u.email
       FROM profiles p
       JOIN users u ON p.id = u.id
       WHERE p.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // Only allow users to update their own profile
    if (userId !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { full_name, last_name, phone_number, avatar_url, email, address, country_code, country, zip_code, city, state } = req.body;

    console.log('Update profile request body:', { full_name, last_name, phone_number, avatar_url, email, address, country_code, country, zip_code, city, state });

    // Update profile
    const profileResult = await pool.query(
      `UPDATE profiles 
       SET full_name = COALESCE($1, full_name),
           last_name = COALESCE($2, last_name),
           phone_number = COALESCE($3, phone_number),
           avatar_url = COALESCE($4, avatar_url),
           address = COALESCE($5, address),
           country_code = COALESCE($6, country_code),
           country = COALESCE($7, country),
           zip_code = COALESCE($8, zip_code),
           city = COALESCE($9, city),
           state = COALESCE($10, state),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [full_name, last_name, phone_number, avatar_url, address, country_code, country, zip_code, city, state, userId]
    );

    // Update email in users table if provided
    if (email) {
      await pool.query(
        'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [email.toLowerCase(), userId]
      );
    }

    // Get updated profile with email
    const result = await pool.query(
      `SELECT p.*, u.email
       FROM profiles p
       JOIN users u ON p.id = u.id
       WHERE p.id = $1`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', errorDetails);
    res.status(500).json({ 
      error: 'Internal server error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
});

export default router;

