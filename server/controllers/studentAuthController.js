import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Student registration with ID and birthday
export const registerStudent = async (req, res) => {
  try {
    const { studentId, name, email, phone, dateOfBirth, gradeLevel } = req.body;

    // Validate required fields
    if (!studentId || !name || !dateOfBirth || !gradeLevel) {
      return res.status(400).json({ 
        error: "Student ID, name, date of birth, and grade level are required" 
      });
    }

    // Check if student already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId }
    });

    if (existingStudent) {
      return res.status(400).json({ 
        error: "Student with this ID already exists" 
      });
    }

    // Create new student
    const student = await prisma.student.create({
      data: {
        studentId,
        name,
        email: email || null,
        phone: phone || null,
        dateOfBirth: new Date(dateOfBirth),
        gradeLevel
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: student.id, 
        studentId: student.studentId,
        role: "STUDENT" 
      },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );

    res.status(201).json({
      message: "Student registered successfully",
      token,
      user: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        role: "STUDENT"
      }
    });

  } catch (error) {
    console.error("Student registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Student login with ID and birthday
export const loginStudent = async (req, res) => {
  try {
    const { studentId, dateOfBirth } = req.body;

    if (!studentId || !dateOfBirth) {
      return res.status(400).json({ 
        error: "Student ID and date of birth are required" 
      });
    }

    // Find student by ID
    const student = await prisma.student.findUnique({
      where: { studentId }
    });

    if (!student) {
      return res.status(404).json({ 
        error: "Student not found" 
      });
    }

    // Convert input date to match stored date format
    const inputDate = new Date(dateOfBirth);
    const storedDate = new Date(student.dateOfBirth);

    // Compare dates (ignore time)
    const isDateMatch = 
      inputDate.getFullYear() === storedDate.getFullYear() &&
      inputDate.getMonth() === storedDate.getMonth() &&
      inputDate.getDate() === storedDate.getDate();

    if (!isDateMatch) {
      return res.status(401).json({ 
        error: "Invalid date of birth" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: student.id, 
        studentId: student.studentId,
        role: "STUDENT" 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        gradeLevel: student.gradeLevel,
        role: "STUDENT"
      }
    });

  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get student profile
export const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const student = await prisma.student.findUnique({
      where: { studentId },
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        phone: true,
        gradeLevel: true,
        createdAt: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ student });

  } catch (error) {
    console.error("Get student profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
}; 