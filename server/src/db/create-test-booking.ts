import pool from './database.js';
import { v4 as uuidv4 } from 'uuid';

async function createTestBooking() {
  try {
    console.log('🚗 Creating test booking for Ferrari F40...');

    // Find test user
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['test@example.com']
    );

    if (userResult.rows.length === 0) {
      console.error('❌ Test user not found. Please run db:seed first.');
      process.exit(1);
    }

    const userId = userResult.rows[0].id;
    console.log('✅ Found test user:', userId);

    // Find Ferrari F40 vehicle
    const vehicleResult = await pool.query(
      'SELECT id FROM vehicles WHERE vehicleid = $1',
      ['V061']
    );

    if (vehicleResult.rows.length === 0) {
      console.error('❌ Ferrari F40 not found. Please run db:seed first.');
      process.exit(1);
    }

    const vehicleId = vehicleResult.rows[0].id;
    console.log('✅ Found Ferrari F40:', vehicleId);

    // Create dates (pickup in the past, dropoff also in the past but after pickup)
    const now = new Date();
    const pickupDate = new Date(now);
    pickupDate.setDate(pickupDate.getDate() - 10); // 10 days ago
    pickupDate.setHours(10, 0, 0, 0); // 10:00 AM

    const dropoffDate = new Date(now);
    dropoffDate.setDate(dropoffDate.getDate() - 3); // 3 days ago
    dropoffDate.setHours(18, 0, 0, 0); // 6:00 PM

    // Calculate total price (3 days * 750 per day)
    const days = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    const pricePerDay = 750;
    const totalPrice = days * pricePerDay;

    // Create completed booking
    const bookingId = uuidv4();
    const result = await pool.query(
      `INSERT INTO bookings (
        id, vehicle_id, user_id, pickup_location, dropoff_location,
        pickup_date, dropoff_date, total_price, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        bookingId,
        vehicleId,
        userId,
        'München',
        'München',
        pickupDate.toISOString(),
        dropoffDate.toISOString(),
        totalPrice,
        'completed',
        new Date(pickupDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // created 7 days before pickup
        dropoffDate.toISOString(), // updated when completed
      ]
    );

    console.log('✅ Test booking created successfully!');
    console.log('📋 Booking details:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Vehicle: Ferrari F40');
    console.log('   User: test@example.com');
    console.log('   Pickup:', pickupDate.toLocaleString());
    console.log('   Dropoff:', dropoffDate.toLocaleString());
    console.log('   Total Price: €' + totalPrice);
    console.log('   Status: completed');
    console.log('');
    console.log('🎉 You can now test the review feature!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test booking:', error);
    process.exit(1);
  }
}

createTestBooking();

