import pool from './database.js';

async function fixTestBooking() {
  try {
    console.log('🔧 Fixing test booking user_id...');

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

    // Find Ferrari F40 booking
    const bookingResult = await pool.query(
      `SELECT b.*, v.brand, v.model
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE v.brand = 'Ferrari' AND v.model = 'F40' AND b.status = 'completed'
       ORDER BY b.created_at DESC
       LIMIT 1`
    );

    if (bookingResult.rows.length === 0) {
      console.error('❌ No completed Ferrari F40 booking found.');
      process.exit(1);
    }

    const booking = bookingResult.rows[0];
    console.log('📋 Found booking:');
    console.log('   ID:', booking.id);
    console.log('   Current user_id:', booking.user_id);
    console.log('   Target user_id:', userId);
    console.log('   Status:', booking.status);

    if (booking.user_id === userId) {
      console.log('✅ Booking already belongs to correct user!');
      process.exit(0);
    }

    // Update booking user_id
    await pool.query(
      `UPDATE bookings 
       SET user_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [userId, booking.id]
    );

    console.log('✅ Booking user_id updated successfully!');
    console.log('🎉 You can now test the review feature!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing test booking:', error);
    process.exit(1);
  }
}

fixTestBooking();

