import express from "express";
import { getAllApplications, addStudent, getAllStudents, deleteStudent } from "../controllers/adminController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import prisma from "../config/db.js";

const router = express.Router();

// SECURITY: Middleware to enforce ADMIN role on all admin routes
// This ensures authentication (verifyToken) runs first, then authorization (requireAdmin)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// All routes below require: 1) valid token, 2) ADMIN role
router.get("/users", verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/applications", verifyToken, requireAdmin, getAllApplications);

// Student management routes - all require ADMIN role
router.post("/students", verifyToken, requireAdmin, addStudent);
router.get("/students", verifyToken, requireAdmin, getAllStudents);
router.delete("/students/:id", verifyToken, requireAdmin, deleteStudent);

export default router;