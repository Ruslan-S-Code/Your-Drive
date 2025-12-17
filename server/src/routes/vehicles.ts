import express, { Request, Response } from 'express';
import pool from '../db/database.js';

const router = express.Router();

// Get all vehicles with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    const {
      brand,
      vehicletype,
      minPrice,
      maxPrice,
      location,
      availability,
      electricvehicle,
      geartype,
      seats,
      luggage,
    } = req.query;

    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (brand) {
      paramCount++;
      query += ` AND brand ILIKE $${paramCount}`;
      params.push(`%${brand}%`);
    }

    if (vehicletype) {
      paramCount++;
      query += ` AND vehicletype ILIKE $${paramCount}`;
      params.push(`%${vehicletype}%`);
    }

    if (minPrice) {
      paramCount++;
      query += ` AND priceperday >= $${paramCount}`;
      params.push(parseFloat(minPrice as string));
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND priceperday <= $${paramCount}`;
      params.push(parseFloat(maxPrice as string));
    }

    if (location) {
      paramCount++;
      // Фильтрация по городу: ищем в массиве locations, где название города совпадает (без координат)
      const locationStr = typeof location === 'string' ? location : String(location);
      query += ` AND EXISTS (
        SELECT 1 FROM unnest(locations) AS loc
        WHERE LOWER(TRIM(SPLIT_PART(loc, '(', 1))) = LOWER($${paramCount})
      )`;
      params.push(locationStr.trim());
    }

    if (availability !== undefined) {
      paramCount++;
      query += ` AND availability = $${paramCount}`;
      params.push(availability === 'true');
    }

    if (electricvehicle !== undefined) {
      paramCount++;
      query += ` AND electricvehicle = $${paramCount}`;
      params.push(electricvehicle === 'true');
    }

    if (geartype) {
      paramCount++;
      query += ` AND geartype = $${paramCount}`;
      params.push(geartype);
    }

    if (seats) {
      paramCount++;
      query += ` AND seats >= $${paramCount}`;
      params.push(parseInt(seats as string));
    }

    if (luggage) {
      paramCount++;
      query += ` AND luggage >= $${paramCount}`;
      params.push(parseInt(luggage as string));
    }

    query += ' ORDER BY priceperday ASC';

    const result = await pool.query(query, params);
    console.log(`[Vehicles] Returning ${result.rows.length} vehicles`);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get vehicles error:', error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
      return res.status(503).json({ 
        error: 'Database connection failed. Please ensure PostgreSQL is running and database is configured.',
        details: 'Database not available'
      });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get vehicle by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const vehicleResult = await pool.query(
      'SELECT * FROM vehicles WHERE id = $1',
      [id]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = vehicleResult.rows[0];

    // Get reviews for this vehicle
    const reviewsResult = await pool.query(
      'SELECT * FROM reviews WHERE vehicleid = $1 ORDER BY date DESC',
      [vehicle.vehicleid]
    );

    // Extract location coordinates (similar to frontend logic)
    const locationCoordinates = extractLocationCoordinates(vehicle.locations || []);

    res.json({
      ...vehicle,
      reviews: reviewsResult.rows,
      locationCoordinates,
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to extract location coordinates
function extractLocationCoordinates(
  locations: string[]
): { name: string; lat: number; lng: number }[] {
  const coordinates: { name: string; lat: number; lng: number }[] = [];

  locations.forEach((location) => {
    try {
      const match = location.match(/([^\(]+)\s*\(([0-9.]+),([0-9.]+)\)/);
      if (match) {
        coordinates.push({
          name: match[1].trim(),
          lat: parseFloat(match[2]),
          lng: parseFloat(match[3]),
        });
      } else {
        const cityCoordinates: { [key: string]: [number, number] } = {
          mannheim: [49.489, 8.467],
          frankfurt: [50.11, 8.682],
          berlin: [52.52, 13.405],
          hamburg: [53.551, 9.993],
          münchen: [48.137, 11.576],
          köln: [50.937, 6.96],
          bremen: [53.0793, 8.8017],
        };

        const lowerLocation = location.toLowerCase();
        let found = false;

        for (const [city, coords] of Object.entries(cityCoordinates)) {
          if (lowerLocation.includes(city)) {
            coordinates.push({
              name: location,
              lat: coords[0],
              lng: coords[1],
            });
            found = true;
            break;
          }
        }

        if (!found) {
          coordinates.push({
            name: location,
            lat: 49.489,
            lng: 8.467,
          });
        }
      }
    } catch (error) {
      console.warn('Error extracting coordinates:', error);
    }
  });

  return coordinates;
}

export default router;

