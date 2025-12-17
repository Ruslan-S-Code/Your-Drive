import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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

// Check if database tables exist
async function checkTablesExist(): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
}

// Run database migrations
async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Try to read schema.sql from multiple possible locations
    const possiblePaths = [
      path.join(__dirname, 'db', 'schema.sql'), // Compiled dist/db/schema.sql
      path.join(__dirname, '../src/db/schema.sql'), // Source src/db/schema.sql (dev)
      path.join(process.cwd(), 'src/db/schema.sql'), // From project root
      path.join(process.cwd(), 'server/src/db/schema.sql'), // From workspace root
    ];
    
    let schemaPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        schemaPath = possiblePath;
        break;
      }
    }
    
    if (!schemaPath) {
      console.error('❌ schema.sql file not found in any of the expected locations:');
      possiblePaths.forEach(p => console.error(`   - ${p}`));
      return false;
    }
    
    console.log(`📄 Using schema file: ${schemaPath}`);
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    
    console.log('✅ Database migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

    // Check if tables exist, if not run migrations
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      console.log('📋 Database tables not found, running migrations...');
      const migrationSuccess = await runMigrations();
      if (!migrationSuccess) {
        console.error('❌ Failed to run migrations. Server will start but may have issues.');
      }
    } else {
      console.log('✅ Database tables already exist');
    }

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

