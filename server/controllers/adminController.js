import prisma from "../config/db.js";

export const getAllApplications = async (req, res) => {
  try {
    const students = await prisma.studentApplication.findMany();
    const tutors = await prisma.tutorApplication.findMany();
    res.json({
      students,
      tutors
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

// Add new student
export const addStudent = async (req, res) => {
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

    res.status(201).json({
      message: "Student added successfully",
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        gradeLevel: student.gradeLevel
      }
    });

  } catch (error) {
    console.error("Add student error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        phone: true,
        gradeLevel: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ students });

  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.delete({
      where: { id }
    });

    res.json({ message: "Student deleted successfully" });

  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ error: "Server error" });
  }
};