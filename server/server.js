import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

// Add this debug middleware to see all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

import protectedRoutes from "./routes/protectedRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Debug: log when routes are being mounted
console.log("Mounting auth routes at /api/auth");
app.use("/api/auth", authRoutes);

console.log("Mounting protected routes at /api");
app.use("/api", protectedRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});