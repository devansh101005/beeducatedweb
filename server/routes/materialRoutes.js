import express from 'express';
import multer from 'multer';
import s3 from '../utils/s3.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
try {
const file = req.file;
const { category, classLevel, title } = req.body;

const key = `${classLevel}/${uuidv4()}-${file.originalname}`;

const params = {
  Bucket: process.env.AWS_BUCKET_NAME,
  Key: key,
  Body: file.buffer,
  ContentType: file.mimetype,
 // ACL: 'public-read', // or private
};

const data = await s3.upload(params).promise();

// Save metadata in DB (example, optional)
// await prisma.material.create({ data: { title, url: data.Location, category, classLevel } });

res.json({ success: true, url: data.Location });
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
    }
    });
    
    export default router;
