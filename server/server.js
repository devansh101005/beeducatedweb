
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';
import studentRoutes from './routes/StudentRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import offlineAuthRoutes from './routes/offlineAuthRoutes.js';
import studentAuthRoutes from './routes/studentAuthRoutes.js';
import applicationRoutes from './routes/applications.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();



app.get('/check-db', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1`; // simple query
    res.status(200).json({ message: '✅ Database connected successfully!' });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});





// Connect to database with error handling
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}
connectDB();




// const { Pool } = require('pg');
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false } // Required for hosted PostgreSQL
// });

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
   'http://localhost:5000',
   "https://beeducated.co.in",
  "https://www.beeducated.co.in", 
  "https://beeducated.vercel.app"
].filter(Boolean); 

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  origin: ["https://beeducated.co.in","https://www.beeducated.co.in", "https://beeducated.vercel.app"],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Routes
console.log('Mounting /api/auth');
app.use('/api/auth', authRoutes);

console.log('Mounting /api/student');
app.use('/api/student', studentRoutes);

console.log('Mounting /api/student-auth');
app.use('/api/student-auth', studentAuthRoutes);

console.log('Mounting /api/offline-auth');
app.use('/api/offline-auth', offlineAuthRoutes);

console.log('Mounting /api/tutors');
app.use('/api/tutors', tutorRoutes);

console.log('Mounting /api/materials');
app.use('/api/materials', materialRoutes);

console.log('Mounting /api/resources');
app.use('/api/resources', resourceRoutes);

console.log('Mounting /api (protected)');
app.use('/api', protectedRoutes);

console.log('Mounting /api/admin');
app.use('/api/admin', adminRoutes);

console.log('Mounting /api/apply');
app.use('/api/apply', applicationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000||3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});