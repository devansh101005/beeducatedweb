import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import prisma from "../config/db.js";

const router = express.Router();

router.put("/update-profile", verifyToken, async (req, res) => {
  const { name, email } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
    });
    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
