import express from "express";
import { getAllApplications, addStudent, getAllStudents, deleteStudent } from "../controllers/adminController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import prisma from "../config/db.js";

const router = express.Router();

router.get("/users", verifyToken, async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/applications", verifyToken, getAllApplications);

// Student management routes
router.post("/students", verifyToken, addStudent);
router.get("/students", verifyToken, getAllStudents);
router.delete("/students/:id", verifyToken, deleteStudent);

export default router;