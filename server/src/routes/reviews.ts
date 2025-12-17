import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get reviews for a vehicle
router.get('/vehicle/:vehicleId', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const result = await pool.query(
      'SELECT * FROM reviews WHERE vehicleid = $1 ORDER BY date DESC, created_at DESC',
      [vehicleId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new review (requires authentication)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, text, stars, bookingId } = req.body;
    const userId = req.userId;

    if (!vehicleId || !text || !stars) {
      return res.status(400).json({ error: 'Missing required fields: vehicleId, text, stars' });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Stars must be between 1 and 5' });
    }

    // Get user profile for name
    const profileResult = await pool.query(
      'SELECT full_name, last_name FROM profiles WHERE id = $1',
      [userId]
    );

    let reviewerName = 'Anonymous';
    if (profileResult.rows.length > 0) {
      const profile = profileResult.rows[0];
      if (profile.full_name) {
        reviewerName = profile.last_name 
          ? `${profile.full_name} ${profile.last_name}` 
          : profile.full_name;
      }
    }

    // If bookingId is provided, verify that:
    // 1. The booking exists and belongs to the user
    // 2. The booking is completed
    // 3. The booking is for the correct vehicle
    if (bookingId) {
      const bookingResult = await pool.query(
        `SELECT * FROM bookings 
         WHERE id = $1 AND user_id = $2 AND vehicle_id = $3 AND status = 'completed'`,
        [bookingId, userId, vehicleId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Cannot create review: booking not found, not completed, or does not match vehicle' 
        });
      }

      // Check if review already exists for this booking
      const existingReview = await pool.query(
        'SELECT id FROM reviews WHERE booking_id = $1',
        [bookingId]
      );

      if (existingReview.rows.length > 0) {
        return res.status(400).json({ error: 'Review already exists for this booking' });
      }
    }

    // Get vehicle vehicleid from vehicle id
    const vehicleResult = await pool.query(
      'SELECT vehicleid FROM vehicles WHERE id = $1',
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicleid = vehicleResult.rows[0].vehicleid;
    const reviewId = uuidv4();
    const currentDate = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO reviews (id, vehicleid, name, text, stars, date, booking_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [reviewId, vehicleid, reviewerName, text, stars, currentDate, bookingId || null, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user can review a booking
router.get('/booking/:bookingId/check', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    console.log('=== CHECKING REVIEW ELIGIBILITY ===');
    console.log('Requested bookingId:', bookingId);
    console.log('Requested bookingId type:', typeof bookingId);
    console.log('Current userId:', userId);
    console.log('---');

    // Normalize bookingId - ensure it's a string, remove whitespace, but keep original case for comparison
    const normalizedBookingId = String(bookingId).trim();
    const normalizedBookingIdLower = normalizedBookingId.toLowerCase();

    // Alternative approach: Get all user bookings and find the matching one
    // This helps debug UUID format issues
    const allUserBookings = await pool.query(
      `SELECT b.*, v.vehicleid 
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.user_id = $1`,
      [userId]
    );

    console.log('All bookings for user:', allUserBookings.rows.map(r => ({
      id: r.id,
      idString: String(r.id),
      idLower: String(r.id).toLowerCase(),
      status: r.status
    })));
    console.log('Looking for bookingId (original):', normalizedBookingId);
    console.log('Looking for bookingId (lowercase):', normalizedBookingIdLower);

    // Try to find booking by comparing IDs as strings - try multiple formats
    let foundBooking = allUserBookings.rows.find(
      (b) => String(b.id) === normalizedBookingId
    );

    // If not found, try case-insensitive comparison
    if (!foundBooking) {
      foundBooking = allUserBookings.rows.find(
        (b) => String(b.id).toLowerCase() === normalizedBookingIdLower
      );
    }

    // If still not found, try without dashes
    if (!foundBooking) {
      foundBooking = allUserBookings.rows.find(
        (b) => String(b.id).replace(/-/g, '').toLowerCase() === normalizedBookingIdLower.replace(/-/g, '')
      );
    }

    // If still not found, try URL decoding (in case UUID was encoded)
    if (!foundBooking) {
      try {
        const decodedBookingId = decodeURIComponent(normalizedBookingId);
        foundBooking = allUserBookings.rows.find(
          (b) => String(b.id) === decodedBookingId || String(b.id).toLowerCase() === decodedBookingId.toLowerCase()
        );
      } catch (e) {
        // Ignore decode errors
      }
    }

    const bookingExists = foundBooking 
      ? { rows: [foundBooking] } 
      : { rows: [] };

    if (bookingExists.rows.length === 0) {
      // Get all bookings for this user to see what IDs are available
      const allBookingsQuery = await pool.query(
        `SELECT b.id, b.user_id, b.status, v.brand, v.model
         FROM bookings b
         JOIN vehicles v ON b.vehicle_id = v.id
         WHERE b.user_id = $1 AND b.status = 'completed'
         ORDER BY b.created_at DESC
         LIMIT 10`,
        [userId]
      );
      console.log('Booking not found. Debug - All completed bookings for user:', allBookingsQuery.rows.map(r => ({
        id: r.id,
        idString: String(r.id),
        brand: r.brand,
        model: r.model,
        status: r.status
      })));
      console.log('Requested bookingId (raw):', bookingId);
      console.log('Requested bookingId (normalized):', normalizedBookingId);
      console.log('Requested bookingId (normalized lower):', normalizedBookingIdLower);
      console.log('Requested bookingId (length):', normalizedBookingId.length);
      console.log('Current userId:', userId);
      
      // Try to find booking by exact string match (case-sensitive)
      const exactMatch = allBookingsQuery.rows.find(r => String(r.id) === normalizedBookingId);
      if (exactMatch) {
        console.log('✅ Found exact match (case-sensitive)! But search failed earlier.');
      }
      
      // Try case-insensitive match
      const caseInsensitiveMatch = allBookingsQuery.rows.find(r => String(r.id).toLowerCase() === normalizedBookingIdLower);
      if (caseInsensitiveMatch) {
        console.log('✅ Found case-insensitive match! But search failed earlier.');
      }
      
      // Show first few characters of each ID for comparison
      console.log('First 10 chars of requested ID:', normalizedBookingId.substring(0, 10));
      if (allBookingsQuery.rows.length > 0) {
        console.log('First 10 chars of available IDs:', allBookingsQuery.rows.slice(0, 3).map(r => String(r.id).substring(0, 10)));
      }
      
      return res.json({ canReview: false, reason: 'Buchung nicht gefunden' });
    }

    // Get the booking from bookingExists (which was set from foundBooking)
    const booking = bookingExists.rows[0];
    console.log('Booking found:', {
      id: booking.id,
      user_id: booking.user_id,
      current_user_id: userId,
      status: booking.status,
      vehicle_id: booking.vehicle_id
    });

    // Check if booking belongs to user
    if (booking.user_id !== userId) {
      console.log('Booking does not belong to user:', {
        booking_user_id: booking.user_id,
        current_user_id: userId
      });
      return res.json({ canReview: false, reason: 'Buchung gehört nicht zu Ihrem Konto' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      console.log('Booking is not completed:', booking.status);
      return res.json({ canReview: false, reason: `Buchung ist noch nicht abgeschlossen (Status: ${booking.status})` });
    }

    // Check if review already exists
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE booking_id = $1',
      [bookingId]
    );

    if (existingReview.rows.length > 0) {
      console.log('Review already exists for this booking');
      return res.json({ canReview: false, reason: 'Bewertung bereits abgegeben', reviewId: existingReview.rows[0].id });
    }

    console.log('User can review this booking');
    return res.json({ 
      canReview: true, 
      booking: booking,
      vehicleId: booking.vehicle_id,
      vehicleid: booking.vehicleid
    });
  } catch (error) {
    console.error('Check review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

