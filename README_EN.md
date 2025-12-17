# Your Drive - Car Rental Application

Modern web application for car rental with a full-featured backend on Node.js and frontend on React.

> 🇷🇺 [Russian Version](./README.md) | 🇩🇪 [German Version](./README_DE.md)

## 🚀 Quick Start

### Requirements

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation and Setup

1. **Install dependencies:**

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

2. **Set up the database:**

```bash
cd server

# Create .env file based on .env.example
cp .env.example .env

# Edit .env and specify your settings:
# DATABASE_URL=postgresql://username:password@localhost:5432/yourdrive
# JWT_SECRET=your-super-secret-jwt-key-change-this
# PORT=3001
# FRONTEND_URL=http://localhost:5173

# Create PostgreSQL database
createdb yourdrive

# Run migrations to create tables
npm run db:migrate

# Fill with test data (optional)
npm run db:seed

cd ..
```

3. **Configure frontend:**

```bash
# Create .env file in project root
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

4. **Start the project:**

```bash
# Start backend and frontend simultaneously (from root folder)
npm run dev:all
```

Or separately:

```bash
# Backend (in server folder)
cd server
npm run dev

# Frontend (in root folder)
npm run dev
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

## 📁 Project Structure

```
Your_Drive/
├── server/              # Backend API (Node.js + Express + PostgreSQL)
│   ├── src/
│   │   ├── db/         # Database and migrations
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Middleware (authentication, etc.)
│   │   └── utils/      # Utilities
│   └── package.json
├── src/                # Frontend (React + TypeScript + Vite)
│   ├── components/    # React components
│   ├── pages/         # Application pages
│   ├── contexts/      # React contexts
│   ├── lib/           # API client and utilities
│   └── main.tsx       # Entry point
├── public/            # Static files
└── package.json
```

## 🛠 Technologies

### Backend
- Node.js + Express - custom backend server
- PostgreSQL - local or remote database
- TypeScript - typed JavaScript
- JWT authentication - custom implementation
- bcryptjs for password hashing
- multer for file uploads
- nodemailer for email

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Context API
- i18next for internationalization

## 📋 Main Features

- 🔐 User authentication and registration
- 🚗 Vehicle search and filtering
- 📅 Car bookings
- 👤 User profile management
- ⭐ Review system
- 🔔 Notifications about new events, articles, and podcasts
- 🌍 Multilingual support (German/English)
- 🌓 Dark/Light theme
- 📱 Responsive design

## 🔑 Test Data

After running `npm run db:seed`:
- Email: `test@example.com`
- Password: `password123`

## 📚 API Documentation

Full API documentation is available in [server/README.md](./server/README.md)

### Main endpoints:

- `POST /api/auth/register` - Registration
- `POST /api/auth/login` - Login
- `GET /api/vehicles` - Vehicle list
- `GET /api/vehicles/:id` - Vehicle details
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user/:userId` - User bookings
- `GET /api/reviews/vehicle/:vehicleId` - Reviews for a vehicle

## 🚀 Production Build

```bash
# Backend
cd server
npm run build
npm start

# Frontend
npm run build
npm run preview
```

## 📝 Environment Variables

### Backend (.env in server/ folder)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL
- `SMTP_*` - Email settings for password recovery

### Frontend (.env in root)
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api)

## 🐛 Troubleshooting

### Backend won't start
- Check that PostgreSQL is running
- Make sure DATABASE_URL is correct
- Check that port 3001 is free

### Frontend can't connect to backend
- Make sure backend is running on port 3001
- Check VITE_API_URL in .env file
- Check CORS settings in backend

### Database errors
- Make sure migrations are run: `npm run db:migrate`
- Check database access rights

## 📄 License

ISC

## 👨‍💻 Author

Designed and developed by **RSLN**  
Portfolio: https://www.madebyrsln.com

