import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

// REGISTER
     
export const registerUser = async (req, res) => {
  console.log("🔥 Register function called!");
  console.log("Request body:", req.body);
  
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    console.log("✅ Checking for existing user...");
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      console.log("❌ User already exists");
      return res.status(409).json({ error: "User already exists" });
    }

    console.log("✅ Creating new user...");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role?.toUpperCase() || "STUDENT"
      }
    });

    console.log("✅ User created successfully");
    res.status(201).json({ 
      message: "User registered successfully", 
      user: { id: user.id, email: user.email } 
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  console.log("🔥 Login function called!");
  console.log("Request body:", req.body);
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
    res.status(500).json({ error: "Server error" });
  }
};

