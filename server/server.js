
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
<<<<<<< HEAD
import offlineAuthRoutes from "./routes/offlineAuthRoutes.js";
import studentAuthRoutes from "./routes/studentAuthRoutes.js";
=======
import offlineAuthRoutes from './routes/offlineAuthRoutes.js';
import studentAuthRoutes from './routes/studentAuthRoutes.js';
import applicationRoutes from './routes/applications.js';
import adminRoutes from './routes/adminRoutes.js';
import examRoutes from './routes/examRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
>>>>>>> 0024a302c45d6fb370ba0cdc628e2af56645f53c

//dotenv.config();
// server/server.js
dotenv.config({ path: './server/.env' });

const app = express();
const prisma = new PrismaClient();


<<<<<<< HEAD
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
=======

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


// const allowedOrigins = [
//   process.env.FRONTEND_URL,
//   'http://localhost:5173',
//   'http://localhost:5174',
//   'http://localhost:3000',
//    'http://localhost:5000',
//    'http://127.0.0.1.5173',
//    'http://127.0.0.1:3000',
//    "https://beeducated.co.in",
//   "https://www.beeducated.co.in", 
//   "https://beeducated.vercel.app"
// ].filter(Boolean); 

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, origin);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   origin: ["https://beeducated.co.in","https://www.beeducated.co.in", "https://beeducated.vercel.app"],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));



app.use(cors({
  origin: (origin, callback) => {
    const allow = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'https://beeducated.co.in',
      'https://www.beeducated.co.in',
      'https://beeducated.vercel.app'
    ].filter(Boolean);

    if (!origin || allow.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
>>>>>>> 0024a302c45d6fb370ba0cdc628e2af56645f53c
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));








app.use(express.json());
<<<<<<< HEAD
app.use("/api/offline-auth", offlineAuthRoutes);

app.use("/uploads", express.static("uploads"));

console.log("Mounting /api/tutors");
app.use("/api/tutors", tutorRoutes);
app.use('/api/materials', materialRoutes);
app.use("/api/resources", resourceRoutes);

=======
app.use('/uploads', express.static('uploads'));
>>>>>>> 0024a302c45d6fb370ba0cdc628e2af56645f53c

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

<<<<<<< HEAD
console.log("Mounting /api/student-auth");
app.use("/api/student-auth", studentAuthRoutes);

console.log("Mounting /api (protected)");
app.use("/api", protectedRoutes);
=======
console.log('Mounting /api/student-auth');
app.use('/api/student-auth', studentAuthRoutes);
>>>>>>> 0024a302c45d6fb370ba0cdc628e2af56645f53c

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
app.use('/api/exams', examRoutes);
app.use('/api/announcements', announcementRoutes);
//console.log(announcementRoutes);

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