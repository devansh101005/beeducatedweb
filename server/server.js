import adminRoutes from "./routes/adminRoutes.js";

import tutorRoutes from "./routes/tutorRoutes.js";

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
//import tutorRoutes from "./routes/tutorRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

console.log("Mounting /api/tutors");
app.use("/api/tutors", tutorRoutes);


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

console.log("Mounting /api (protected)");
app.use("/api", protectedRoutes);

app.use("/api/admin", adminRoutes);


//app.use("/api/tutors", tutorRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
