import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Helper function to get coordinates for a city
function getCityCoordinates(cityName: string): string {
  const cityCoordinates: { [key: string]: [number, number] } = {
    mannheim: [49.489, 8.467],
    frankfurt: [50.11, 8.682],
    berlin: [52.52, 13.405],
    hamburg: [53.551, 9.993],
    münchen: [48.137, 11.576],
    köln: [50.937, 6.96],
    bremen: [53.0793, 8.8017],
    düsseldorf: [51.2277, 6.7735],
    stuttgart: [48.7758, 9.1829],
    dortmund: [51.5136, 7.4653],
    essen: [51.4556, 7.0116],
    leipzig: [51.3397, 12.3731],
    dresden: [51.0504, 13.7373],
    hannover: [52.3759, 9.7320],
    nürnberg: [49.4521, 11.0767],
    wuppertal: [51.2562, 7.1482],
  };

  const lowerCity = cityName.toLowerCase().trim();
  
  // Try to find exact match or partial match
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (lowerCity.includes(city) || city.includes(lowerCity)) {
      return `${cityName} (${coords[0]},${coords[1]})`;
    }
  }

  // Default coordinates (Mannheim) if city not found
  return `${cityName} (49.489,8.467)`;
}

// Helper function to automatically complete expired bookings
async function completeExpiredBookings() {
  try {
    // Check if bookings table exists before trying to query it
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Table doesn't exist yet, skip this run
      return;
    }

    const now = new Date();
    const result = await pool.query(
      `SELECT id, vehicle_id, pickup_location, dropoff_location 
       FROM bookings 
       WHERE status = 'confirmed' 
       AND dropoff_date < $1`,
      [now]
    );

    for (const booking of result.rows) {
      // Update booking status to completed
      await pool.query(
        `UPDATE bookings 
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [booking.id]
      );

      // Update vehicle location
      if (booking.vehicle_id && booking.dropoff_location) {
        const vehicleResult = await pool.query(
          'SELECT locations FROM vehicles WHERE id = $1',
          [booking.vehicle_id]
        );

        if (vehicleResult.rows.length > 0) {
          const currentLocations = vehicleResult.rows[0].locations || [];
          
          // Extract city names from current locations
          const pickupCityName = booking.pickup_location.trim().toLowerCase();
          const filteredLocations = currentLocations.filter((loc: string) => {
            const match = loc.match(/^([^(]+)/);
            const cityName = match ? match[1].trim().toLowerCase() : loc.trim().toLowerCase();
            return cityName !== pickupCityName;
          });

          // Add dropoff location if it doesn't exist
          const dropoffCityName = booking.dropoff_location.trim().toLowerCase();
          const dropoffExists = filteredLocations.some((loc: string) => {
            const match = loc.match(/^([^(]+)/);
            const cityName = match ? match[1].trim().toLowerCase() : loc.trim().toLowerCase();
            return cityName === dropoffCityName;
          });

          let newLocations = [...filteredLocations];
          if (!dropoffExists) {
            const dropoffLocationWithCoords = getCityCoordinates(booking.dropoff_location);
            newLocations.push(dropoffLocationWithCoords);
          }

          // Update vehicle locations and set availability to true
          await pool.query(
            `UPDATE vehicles 
             SET locations = $1, availability = true
             WHERE id = $2`,
            [newLocations, booking.vehicle_id]
          );

          console.log(`[Bookings] Auto-completed booking ${booking.id}, updated vehicle location to ${booking.dropoff_location}`);
        }
      }
    }
  } catch (error) {
    // Silently ignore errors during migration phase
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('does not exist')) {
      // Table doesn't exist yet, this is expected during migrations
      return;
    }
    console.error('Error completing expired bookings:', error);
  }
}

// Start checking expired bookings after a short delay to allow migrations to complete
// Run on module load and set interval to check every hour
setTimeout(() => {
  completeExpiredBookings();
  setInterval(completeExpiredBookings, 60 * 60 * 1000); // Check every hour
}, 5000); // Wait 5 seconds for migrations to complete

// Create booking
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      vehicle_id,
      pickup_location,
      dropoff_location,
      pickup_date,
      dropoff_date,
      total_price,
      status = 'confirmed',
    } = req.body;

    const user_id = req.userId;

    if (!vehicle_id || !pickup_location || !dropoff_location || !pickup_date || !dropoff_date || !total_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bookingId = uuidv4();

    // Start transaction to ensure both booking and vehicle update succeed
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create booking
      const result = await client.query(
      `INSERT INTO bookings (id, vehicle_id, user_id, pickup_location, dropoff_location, 
       pickup_date, dropoff_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        bookingId,
        vehicle_id,
        user_id,
        pickup_location,
        dropoff_location,
        pickup_date,
        dropoff_date,
        total_price,
        status,
      ]
    );

      // Set vehicle availability to false when booking is confirmed
      if (status === 'confirmed') {
        await client.query(
          `UPDATE vehicles SET availability = false WHERE id = $1`,
          [vehicle_id]
        );
        console.log(`[Bookings] Set vehicle ${vehicle_id} availability to false for booking ${bookingId}`);
      }

      await client.query('COMMIT');
      client.release();

    res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user bookings
router.get('/user/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Check and complete expired bookings before fetching
    await completeExpiredBookings();

    const { userId } = req.params;
    const currentUserId = req.userId;

    // Only allow users to see their own bookings
    if (userId !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      `SELECT 
         b.id as booking_id,
         b.vehicle_id,
         b.user_id,
         b.pickup_location,
         b.dropoff_location,
         b.pickup_date,
         b.dropoff_date,
         b.total_price,
         b.status,
         b.created_at,
         b.updated_at,
         v.id as vehicle_id_db,
         v.vehicleid,
         v.brand,
         v.model,
         v.year,
         v.vehicletype,
         v.colors,
         v.locations,
         v.priceperday,
         v.availability,
         v.electricvehicle,
         v.carimg,
         v.seats,
         v.luggage,
         v.horstpower,
         v.ps,
         v.consumption,
         v.fuel,
         v.geartype,
         v.featured,
         v.rating,
         v.discount
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.user_id = $1
       ORDER BY b.pickup_date DESC`,
      [userId]
    );

    // Transform result to match frontend expectations
    const bookings = result.rows.map((row) => {
      return {
        id: row.booking_id,
        vehicle_id: row.vehicle_id,
        user_id: row.user_id,
        pickup_location: row.pickup_location,
        dropoff_location: row.dropoff_location,
        pickup_date: row.pickup_date,
        dropoff_date: row.dropoff_date,
        total_price: parseFloat(row.total_price),
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        vehicles: {
          id: row.vehicle_id_db,
          vehicleid: row.vehicleid,
          brand: row.brand,
          model: row.model,
          year: row.year,
          vehicletype: row.vehicletype,
          colors: row.colors,
          locations: row.locations,
          priceperday: parseFloat(row.priceperday),
          availability: row.availability,
          electricvehicle: row.electricvehicle,
          carimg: row.carimg,
          seats: row.seats,
          luggage: row.luggage,
          horstpower: row.horstpower,
          ps: row.ps,
          consumption: row.consumption,
          fuel: row.fuel,
          geartype: row.geartype,
          featured: row.featured,
          rating: row.rating ? parseFloat(row.rating) : null,
          discount: row.discount ? parseFloat(row.discount) : null,
        },
      };
    });

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get booking by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await pool.query(
      `SELECT b.*, v.*
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get booking details before updating
    const bookingResult = await pool.query(
      `SELECT * FROM bookings WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Update booking status
    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, id, userId]
    );

    // If booking is completed, update vehicle location
    if (status === 'completed' && booking.vehicle_id && booking.dropoff_location) {
      try {
        // Get current vehicle data
        const vehicleResult = await pool.query(
          'SELECT locations FROM vehicles WHERE id = $1',
          [booking.vehicle_id]
        );

        if (vehicleResult.rows.length > 0) {
          const currentLocations = vehicleResult.rows[0].locations || [];
          
          // Extract city names from current locations (remove coordinates)
          const currentCityNames = currentLocations.map((loc: string) => {
            const match = loc.match(/^([^(]+)/);
            return match ? match[1].trim().toLowerCase() : loc.trim().toLowerCase();
          });

          // Remove pickup location if it exists
          const pickupCityName = booking.pickup_location.trim().toLowerCase();
          const filteredLocations = currentLocations.filter((loc: string) => {
            const match = loc.match(/^([^(]+)/);
            const cityName = match ? match[1].trim().toLowerCase() : loc.trim().toLowerCase();
            return cityName !== pickupCityName;
          });

          // Add dropoff location if it doesn't exist
          const dropoffCityName = booking.dropoff_location.trim().toLowerCase();
          const dropoffExists = filteredLocations.some((loc: string) => {
            const match = loc.match(/^([^(]+)/);
            const cityName = match ? match[1].trim().toLowerCase() : loc.trim().toLowerCase();
            return cityName === dropoffCityName;
          });

          let newLocations = [...filteredLocations];
          if (!dropoffExists) {
            const dropoffLocationWithCoords = getCityCoordinates(booking.dropoff_location);
            newLocations.push(dropoffLocationWithCoords);
          }

          // Update vehicle locations and set availability to true
          await pool.query(
            `UPDATE vehicles 
             SET locations = $1, availability = true
             WHERE id = $2`,
            [newLocations, booking.vehicle_id]
          );

          console.log(`[Bookings] Updated vehicle ${booking.vehicle_id} location from ${booking.pickup_location} to ${booking.dropoff_location}`);
        }
      } catch (vehicleError) {
        console.error('Error updating vehicle location:', vehicleError);
        // Don't fail the booking update if vehicle update fails
      }
    }

    // If booking is cancelled, make vehicle available again
    if (status === 'cancelled' && booking.vehicle_id) {
      try {
        await pool.query(
          `UPDATE vehicles SET availability = true WHERE id = $1`,
          [booking.vehicle_id]
        );
      } catch (vehicleError) {
        console.error('Error updating vehicle availability:', vehicleError);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

