import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// SECURITY: Middleware to require ADMIN role for creating announcements
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "Admin access required" });
  }
  next();
};

let latestAnnouncement = {
  id: 1,
  message: "Registration process of test series has started for class 10th and 12th",
  createdAt: new Date()
};

// GET latest announcement - public endpoint (announcements are meant to be seen)
router.get("/latest", (req, res) => {
  res.json({
    success: true,
    announcement: latestAnnouncement
  });
});

// POST to create a new announcement - ADMIN only
router.post("/", verifyToken, requireAdmin, (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: "Message is required" });
  }

  latestAnnouncement = {
    id: latestAnnouncement.id + 1,
    message,
    createdAt: new Date()
  };

  res.status(201).json({ success: true, announcement: latestAnnouncement });
});

export default router;

