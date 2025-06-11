import express from "express";
import upload from "../middleware/upload.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = express.Router();

router.post("/student", upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "marksheet", maxCount: 2 },
  { name: "idcard", maxCount: 2 }
]), async (req, res) => {
  try {
    const { name, email, phone, address, grade_level } = req.body;
    const resumePath = req.files.resume?.[0]?.path || null;
    const idcards = req.files.idcard?.map(f => f.path) || [];
    const marksheets = req.files.marksheet?.map(f => f.path) || [];

    const saved = await prisma.studentApplication.create({
      data: {
        name,
        email,
        phone,
        address,
        gradeLevel: grade_level,
        resume: resumePath,
        marksheets,
        idcards
      }
    });
    res.status(200).json({ message: "Student application saved", saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/tutor", upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "idcard", maxCount: 2 }
]), async (req, res) => {
  try {
    const { name, email, phone, qualification, subject_expertise, experience_years } = req.body;
    const resumePath = req.files.resume?.[0]?.path || null;
    const idcards = req.files.idcard?.map(f => f.path) || [];

    const saved = await prisma.tutorApplication.create({
      data: {
        name,
        email,
        phone,
        qualification,
        subjectExpertise: subject_expertise,
        experienceYears: parseInt(experience_years),
        resume: resumePath,
        idcards
      }
    });
    res.status(200).json({ message: "Tutor application saved", saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/applications', async (req, res) => {
  try {
    const students = await prisma.studentApplication.findMany();
    const tutors = await prisma.tutorApplication.findMany();
    res.json({ students, tutors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;