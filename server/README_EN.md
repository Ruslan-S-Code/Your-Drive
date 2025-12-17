# Your Drive Backend API

Backend API for the Your Drive car rental application, built with Node.js, Express, and PostgreSQL.

> 🇷🇺 [Russian Version](./README.md) | 🇩🇪 [German Version](./README_DE.md)

## Requirements

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `FRONTEND_URL` - Frontend application URL
   - `PORT` - Server port (default: 3001)
   - `SMTP_*` - Email settings for password recovery (optional)

4. Create PostgreSQL database:
```sql
CREATE DATABASE yourdrive;
```

5. Run migrations:
```bash
npm run db:migrate
```

6. (Optional) Fill database with test data:
```bash
npm run db:seed
```

## Start

### Development mode
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

The server will be available at `http://localhost:3001` (or the port specified in `.env`).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Registration
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/reset-password-request` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/update-password` - Update password

### Vehicles
- `GET /api/vehicles` - Vehicle list (with filters)
- `GET /api/vehicles/:id` - Vehicle details

### Locations
- `GET /api/locations` - Location list
- `GET /api/locations/:id` - Location details

### Reviews
- `GET /api/reviews/vehicle/:vehicleId` - Reviews for a vehicle

### Bookings
- `POST /api/bookings` - Create booking (requires authentication)
- `GET /api/bookings/user/:userId` - User bookings
- `GET /api/bookings/:id` - Booking details
- `PATCH /api/bookings/:id` - Update booking status

### Profiles
- `GET /api/profiles/:userId` - Get profile
- `PUT /api/profiles/:userId` - Update profile

### Files
- `POST /api/storage/upload/avatar` - Upload avatar (requires authentication)
- `GET /uploads/avatars/:filename` - Get avatar

## Database Structure

- `users` - Users (authentication)
- `profiles` - User profiles
- `vehicles` - Vehicles
- `locations` - Locations
- `reviews` - Reviews
- `bookings` - Bookings
- `password_reset_tokens` - Password reset tokens

## Test Data

After running `npm run db:seed`:
- Email: `test@example.com`
- Password: `password123`

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- CORS configured for frontend collaboration
- Input validation
- Route protection through authentication middleware

## 👨‍💻 Author

Designed and developed by **RSLN**  
Portfolio: https://www.madebyrsln.com


