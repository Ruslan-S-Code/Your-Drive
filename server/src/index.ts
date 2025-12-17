import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db/database.js';

// Routes
import authRoutes from './routes/auth.js';
import vehiclesRoutes from './routes/vehicles.js';
import locationsRoutes from './routes/locations.js';
import reviewsRoutes from './routes/reviews.js';
import bookingsRoutes from './routes/bookings.js';
import profilesRoutes from './routes/profiles.js';
import storageRoutes from './routes/storage.js';
import favoritesRoutes from './routes/favorites.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (avatars)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/favorites', favoritesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    console.error('Please check your DATABASE_URL in server/.env file');
    process.exit(1);
  }
}

startServer();

