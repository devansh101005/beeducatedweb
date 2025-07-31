import applicationRoutes from './routes/applications.js';

import adminRoutes from "./routes/adminRoutes.js";

import tutorRoutes from "./routes/tutorRoutes.js";

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';
import studentRoutes from './routes/StudentRoutes.js';
//import tutorRoutes from "./routes/tutorRoutes.js";
import materialRoutes from './routes/materialRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import offlineAuthRoutes from "./routes/offlineAuthRoutes.js";
import studentAuthRoutes from "./routes/studentAuthRoutes.js";

dotenv.config();

const app = express();

// Middleware

app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
 }));
app.use(express.json());
app.use("/api/offline-auth", offlineAuthRoutes);

app.use("/uploads", express.static("uploads"));

console.log("Mounting /api/tutors");
app.use("/api/tutors", tutorRoutes);
app.use('/api/materials', materialRoutes);
app.use("/api/resources", resourceRoutes);


// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
console.log("Mounting /api/auth");
app.use("/api/auth", authRoutes);

console.log("Mounting /api/student");
app.use("/api/student", studentRoutes);

console.log("Mounting /api/student-auth");
app.use("/api/student-auth", studentAuthRoutes);

console.log("Mounting /api (protected)");
app.use("/api", protectedRoutes);

app.use("/api/admin", adminRoutes);

console.log("Mounting /api/apply");
app.use('/api/apply', applicationRoutes);



//app.use("/api/tutors", tutorRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});



