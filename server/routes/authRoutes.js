import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// ✅ Only one /me route, using verifyToken middleware
router.get("/me", verifyToken, (req, res) => {
  res.json({
    id: req.user.id,
    role: req.user.role,
    email: req.user.email
  });
});

export default router;
