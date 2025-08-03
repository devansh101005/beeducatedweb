// // // import applicationRoutes from './routes/applications.js';

// // // import adminRoutes from "./routes/adminRoutes.js";

// // // import tutorRoutes from "./routes/tutorRoutes.js";

// // // import express from 'express';
// // // import cors from 'cors';
// // // import dotenv from 'dotenv';
// // // import authRoutes from './routes/authRoutes.js';
// // // import protectedRoutes from './routes/protectedRoutes.js';
// // // import studentRoutes from './routes/StudentRoutes.js';
// // // //import tutorRoutes from "./routes/tutorRoutes.js";
// // // import materialRoutes from './routes/materialRoutes.js';
// // // import resourceRoutes from './routes/resourceRoutes.js';
// // // import offlineAuthRoutes from "./routes/offlineAuthRoutes.js";
// // // import studentAuthRoutes from "./routes/studentAuthRoutes.js";

// // // dotenv.config();

// // // const app = express();

// // // // Middleware

// // // app.use(cors({ 
// // //   origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
// // //   credentials: true,
// // //  }));
// // // app.use(express.json());
// // // app.use("/api/offline-auth", offlineAuthRoutes);

// // // app.use("/uploads", express.static("uploads"));

// // // console.log("Mounting /api/tutors");
// // // app.use("/api/tutors", tutorRoutes);
// // // app.use('/api/materials', materialRoutes);
// // // app.use("/api/resources", resourceRoutes);


// // // // Log all requests
// // // app.use((req, res, next) => {
// // //   console.log(`${req.method} ${req.url}`);
// // //   next();
// // // });

// // // app.get('/', (req, res) => {
// // //   res.status(200).json({ status: 'OK', message: 'Server is running' });
// // // });

// // // // Routes
// // // console.log("Mounting /api/auth");
// // // app.use("/api/auth", authRoutes);

// // // console.log("Mounting /api/student");
// // // app.use("/api/student", studentRoutes);

// // // console.log("Mounting /api/student-auth");
// // // app.use("/api/student-auth", studentAuthRoutes);

// // // console.log("Mounting /api (protected)");
// // // app.use("/api", protectedRoutes);

// // // app.use("/api/admin", adminRoutes);

// // // console.log("Mounting /api/apply");
// // // app.use('/api/apply', applicationRoutes);



// // // //app.use("/api/tutors", tutorRoutes);

// // // // Start server
// // // const PORT = process.env.PORT || 5000;
// // // app.listen(PORT, () => {
// // //   console.log(`✅ Server running on port ${PORT}`);
// // // });





// // import express from 'express';
// // import cors from 'cors';
// // import dotenv from 'dotenv';
// // import { PrismaClient } from '@prisma/client';
// // import authRoutes from './routes/authRoutes.js';
// // import protectedRoutes from './routes/protectedRoutes.js';
// // import studentRoutes from './routes/StudentRoutes.js';
// // import tutorRoutes from './routes/tutorRoutes.js';
// // import materialRoutes from './routes/materialRoutes.js';
// // import resourceRoutes from './routes/resourceRoutes.js';
// // import offlineAuthRoutes from './routes/offlineAuthRoutes.js';
// // import studentAuthRoutes from './routes/studentAuthRoutes.js';
// // import applicationRoutes from './routes/applications.js';
// // import adminRoutes from './routes/adminRoutes.js';

// // dotenv.config();

// // const app = express();
// // const prisma = new PrismaClient();

// // // Connect to database with error handling
// // async function connectDB() {
// //   try {
// //     await prisma.$connect();
// //     console.log('✅ Database connected');
// //   } catch (error) {
// //     console.error('❌ Database connection failed:', error);
// //     process.exit(1);
// //   }
// // }
// // connectDB();

// // // Middleware
// // app.use(cors({
// //   origin: [process.env.FRONTEND_URL || 'http://localhost:5173'],
// //   credentials: true,
// // }));
// // app.use(express.json());
// // app.use('/uploads', express.static('uploads'));

// // // Log all requests
// // app.use((req, res, next) => {
// //   console.log(`${req.method} ${req.url}`);
// //   next();
// // });

// // // Health check route
// // app.get('/', (req, res) => {
// //   res.status(200).json({ status: 'OK', message: 'Server is running' });
// // });

// // // Routes
// // console.log('Mounting /api/auth');
// // app.use('/api/auth', authRoutes);

// // console.log('Mounting /api/student');
// // app.use('/api/student', studentRoutes);

// // console.log('Mounting /api/student-auth');
// // app.use('/api/student-auth', studentAuthRoutes);

// // console.log('Mounting /api/offline-auth');
// // app.use('/api/offline-auth', offlineAuthRoutes);

// // console.log('Mounting /api/tutors');
// // app.use('/api/tutors', tutorRoutes);

// // console.log('Mounting /api/materials');
// // app.use('/api/materials', materialRoutes);

// // console.log('Mounting /api/resources');
// // app.use('/api/resources', resourceRoutes);

// // console.log('Mounting /api (protected)');
// // app.use('/api', protectedRoutes);

// // console.log('Mounting /api/admin');
// // app.use('/api/admin', adminRoutes);

// // console.log('Mounting /api/apply');
// // app.use('/api/apply', applicationRoutes);

// // // Start server
// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`✅ Server running on port ${PORT}`);
// // });

// // // Handle uncaught errors
// // process.on('unhandledRejection', (error) => {
// //   console.error('❌ Unhandled Rejection:', error);
// //   process.exit(1);
// // });








// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { PrismaClient } from '@prisma/client';
// import authRoutes from './routes/authRoutes.js';
// import protectedRoutes from './routes/protectedRoutes.js';
// import studentRoutes from './routes/StudentRoutes.js';
// import tutorRoutes from './routes/tutorRoutes.js';
// import materialRoutes from './routes/materialRoutes.js';
// import resourceRoutes from './routes/resourceRoutes.js';
// import offlineAuthRoutes from './routes/offlineAuthRoutes.js';
// import studentAuthRoutes from './routes/studentAuthRoutes.js';
// import applicationRoutes from './routes/applications.js';
// import adminRoutes from './routes/adminRoutes.js';

// dotenv.config();

// const app = express();
// const prisma = new PrismaClient();

// // Connect to database with error handling
// async function connectDB() {
//   try {
//     await prisma.$connect();
//     console.log('✅ Database connected');
//   } catch (error) {
//     console.error('❌ Database connection failed:', error);
//     process.exit(1);
//   }
// }
// connectDB();

// // Middleware
// app.use(cors({
//   origin: [process.env.FRONTEND_URL || 'http://localhost:5173'||'http://localhost:5174'],
//   credentials: true,
// }));
// app.use(express.json());
// app.use('/uploads', express.static('uploads'));

// // Log all requests
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// // Health check route
// app.get('/', (req, res) => {
//   res.status(200).json({ status: 'OK', message: 'Server is running' });
// });

// // Routes
// console.log('Mounting /api/auth');
// app.use('/api/auth', authRoutes);

// console.log('Mounting /api/student');
// app.use('/api/student', studentRoutes);

// console.log('Mounting /api/student-auth');
// app.use('/api/student-auth', studentAuthRoutes);

// console.log('Mounting /api/offline-auth');
// app.use('/api/offline-auth', offlineAuthRoutes);

// console.log('Mounting /api/tutors');
// app.use('/api/tutors', tutorRoutes);

// console.log('Mounting /api/materials');
// app.use('/api/materials', materialRoutes);

// console.log('Mounting /api/resources');
// app.use('/api/resources', resourceRoutes);

// console.log('Mounting /api (protected)');
// app.use('/api', protectedRoutes);

// console.log('Mounting /api/admin');
// app.use('/api/admin', adminRoutes);

// console.log('Mounting /api/apply');
// app.use('/api/apply', applicationRoutes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('❌ Server error:', err);
//   res.status(500).json({ error: 'Internal server error' });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });

// // Handle uncaught errors
// process.on('unhandledRejection', (error) => {
//   console.error('❌ Unhandled Rejection:', error);
//   process.exit(1);
// });

















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

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
   'http://localhost:5000'
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
  origin: ["https://www.beeducated.co.in", "https://beeducated.vercel.app","https://beeducated.co.in"],
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});