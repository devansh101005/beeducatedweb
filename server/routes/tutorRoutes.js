import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import prisma from "../config/db.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const tutors = await prisma.user.findMany({
      where: { role: "TUTOR" },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(tutors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
