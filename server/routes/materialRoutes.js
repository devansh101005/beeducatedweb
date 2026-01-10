import express from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prismaClient.js';
import s3Client from '../config/s3.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Normalize student grade to match material classLevel saved via UI selects
function normalizeClassLevel(input) {
  if (!input) return input;
  const t = String(input).trim();
  const simple = ['Nursery', 'LKG', 'UKG'];
  if (simple.includes(t)) return t;
  const m = t.match(/^class[\s-]?(\d{1,2})$/i);
  if (m) return `Class-${m[1]}`;
  return t.replace(/^class\s+/i, 'Class-').replace(/\s+/g, '-');
}

// Role-aware listing:
// - STUDENT: only materials for their gradeLevel
// - ADMIN/TUTOR: all materials
router.get('/', verifyToken, async (req, res) => {
  try {
    const role = req.user.role;

    if (role === 'STUDENT') {
      // req.user.id is the Student.id from student-auth token
      const student = await prisma.student.findUnique({
        where: { id: req.user.id },
        select: { gradeLevel: true }
      });

      if (!student?.gradeLevel) {
        return res.json([]); // no gradeLevel -> no materials
      }

      const classLevel = normalizeClassLevel(student.gradeLevel);
      const materials = await prisma.studyMaterial.findMany({
        where: { classLevel },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(materials);
    }

    // Admin / Tutor → full list
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(materials);
  } catch (err) {
    console.error('List materials error:', err);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// SECURITY: Upload requires authentication + ADMIN or TUTOR role
// Students should not be able to upload study materials
const canUploadMaterials = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const allowedRoles = ['ADMIN', 'TUTOR'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Only administrators and tutors can upload materials' });
  }
  next();
};

router.post('/upload', verifyToken, canUploadMaterials, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { category, classLevel, title } = req.body;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!process.env.AWS_BUCKET_NAME) return res.status(500).json({ error: 'AWS_BUCKET_NAME not configured' });

    const key = `${classLevel}/${uuidv4()}-${file.originalname}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    try {
      await prisma.studyMaterial.create({
        data: { title, url, category: category || 'General', classLevel }
      });
    } catch (dbErr) {
      console.error('DB save error:', dbErr);
    }

    res.json({ success: true, url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;