# Your Drive API - Endpoints Documentation

## Base URL
- Production: `https://your-drive.onrender.com`
- Development: `http://localhost:3001`

## Root Endpoint
- `GET /` - API information and available endpoints

## Health Check
- `GET /api/health` - Server health status

## Authentication (`/api/auth`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/reset-password-request` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/update-password` - Update password (requires auth)

## Vehicles (`/api/vehicles`)
- `GET /api/vehicles` - Get all vehicles (with optional filters)
- `GET /api/vehicles/:id` - Get vehicle by ID

## Locations (`/api/locations`)
- `GET /api/locations` - Get all locations
- `GET /api/locations/:id` - Get location by ID

## Reviews (`/api/reviews`)
- `GET /api/reviews/vehicle/:vehicleId` - Get reviews for a vehicle
- `POST /api/reviews` - Create a review (requires auth)
- `GET /api/reviews/booking/:bookingId/check` - Check if user can review booking (requires auth)

## Bookings (`/api/bookings`)
- `POST /api/bookings` - Create a booking (requires auth)
- `GET /api/bookings/user/:userId` - Get user's bookings (requires auth)
- `GET /api/bookings/:id` - Get booking by ID (requires auth)
- `PATCH /api/bookings/:id` - Update booking status (requires auth)

## Profiles (`/api/profiles`)
- `GET /api/profiles/:userId` - Get user profile (requires auth)
- `PUT /api/profiles/:userId` - Update user profile (requires auth)

## Storage (`/api/storage`)
- `POST /api/storage/upload/avatar` - Upload user avatar (requires auth, multipart/form-data)

## Favorites (`/api/favorites`)
- `GET /api/favorites` - Get user's favorite vehicles (requires auth)
- `POST /api/favorites/:vehicleId` - Add vehicle to favorites (requires auth)
- `DELETE /api/favorites/:vehicleId` - Remove vehicle from favorites (requires auth)
- `GET /api/favorites/check/:vehicleId` - Check if vehicle is favorited (requires auth)

## Static Files
- `GET /uploads/avatars/:filename` - Get uploaded avatar images

