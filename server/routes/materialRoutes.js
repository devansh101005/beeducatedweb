// import express from 'express';
// import multer from 'multer';
// import s3 from '../utils/s3.js';
// import { v4 as uuidv4 } from 'uuid';

// const router = express.Router();

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// router.post('/upload', upload.single('file'), async (req, res) => {
// try {
// const file = req.file;
// const { category, classLevel, title } = req.body;

// const key = `${classLevel}/${uuidv4()}-${file.originalname}`;

// const params = {
//   Bucket: process.env.AWS_BUCKET_NAME,
//   Key: key,
//   Body: file.buffer,
//   ContentType: file.mimetype,
//  // ACL: 'public-read', // or private
// };

// const data = await s3.upload(params).promise();

// // Save metadata in DB (example, optional)
// // await prisma.material.create({ data: { title, url: data.Location, category, classLevel } });

// res.json({ success: true, url: data.Location });
// } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Upload failed' });
//     }
//     });
    
//     export default router;


import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { category, classLevel, title } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!process.env.AWS_BUCKET_NAME) {
      return res.status(500).json({ error: 'AWS_BUCKET_NAME not configured' });
    }

    const key = `${classLevel}/${uuidv4()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
      // Metadata: { title, category, classLevel } // Optional
    });

    const data = await s3Client.send(command);

    // Construct the file URL (assuming public-read or accessible bucket)
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Save metadata in DB (uncomment if using Prisma)
    // const prisma = new PrismaClient();
    // await prisma.material.create({ data: { title, url, category, classLevel } });

    res.json({ success: true, url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;