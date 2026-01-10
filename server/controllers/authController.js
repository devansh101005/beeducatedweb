import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

// REGISTER
// SECURITY: Only STUDENT and TUTOR roles are allowed for public registration
// ADMIN accounts must be created through a separate secure process (e.g., database seeding, CLI tool)
const ALLOWED_REGISTRATION_ROLES = ["STUDENT", "TUTOR"];

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // SECURITY: Validate and sanitize role - reject ADMIN registration attempts
  const requestedRole = role?.toUpperCase() || "STUDENT";
  if (!ALLOWED_REGISTRATION_ROLES.includes(requestedRole)) {
    return res.status(403).json({
      error: "Invalid role. Only STUDENT and TUTOR registrations are allowed."
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: requestedRole
      }
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

