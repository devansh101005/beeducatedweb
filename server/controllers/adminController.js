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