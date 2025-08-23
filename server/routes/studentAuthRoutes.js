import express from "express";
import { 
  registerStudent, 
  loginStudent, 
  getStudentProfile 
} from "../controllers/studentAuthController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student registration
router.post("/register", registerStudent);

// Student login
router.post("/login", loginStudent);

// Get student profile (protected route)
router.get("/profile", authenticateToken, getStudentProfile);

export default router; 