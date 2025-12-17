import pool from './database.js';

async function checkBookingId() {
  try {
    console.log('🔍 Checking Ferrari F40 booking IDs...');

    // Find test user
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['test@example.com']
    );

    if (userResult.rows.length === 0) {
      console.error('❌ Test user not found.');
      process.exit(1);
    }

    const userId = userResult.rows[0].id;
    console.log('✅ Found test user:', userId);

    // Find all Ferrari F40 bookings for this user
    const bookingsResult = await pool.query(
      `SELECT b.id, b.user_id, b.status, b.created_at, v.brand, v.model
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.user_id = $1 AND v.brand = 'Ferrari' AND v.model = 'F40'
       ORDER BY b.created_at DESC`,
      [userId]
    );

    console.log(`\n📋 Found ${bookingsResult.rows.length} Ferrari F40 booking(s):\n`);
    
    bookingsResult.rows.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   ID (as string): "${String(booking.id)}"`);
      console.log(`   User ID: ${booking.user_id}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Created: ${booking.created_at}`);
      console.log('');
    });

    if (bookingsResult.rows.length > 0) {
      const completedBooking = bookingsResult.rows.find(b => b.status === 'completed');
      if (completedBooking) {
        console.log('✅ Found completed booking!');
        console.log(`   Use this ID for testing: ${completedBooking.id}`);
      } else {
        console.log('⚠️  No completed bookings found.');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBookingId();

