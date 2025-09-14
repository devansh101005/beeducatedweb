// // // import express from 'express';
// // // import multer from 'multer';
// // // import s3 from '../utils/s3.js';
// // // import { v4 as uuidv4 } from 'uuid';

// // // const router = express.Router();

// // // const storage = multer.memoryStorage();
// // // const upload = multer({ storage });

// // // router.post('/upload', upload.single('file'), async (req, res) => {
// // // try {
// // // const file = req.file;
// // // const { category, classLevel, title } = req.body;

// // // const key = `${classLevel}/${uuidv4()}-${file.originalname}`;

// // // const params = {
// // //   Bucket: process.env.AWS_BUCKET_NAME,
// // //   Key: key,
// // //   Body: file.buffer,
// // //   ContentType: file.mimetype,
// // //  // ACL: 'public-read', // or private
// // // };

// // // const data = await s3.upload(params).promise();

// // // // Save metadata in DB (example, optional)
// // // // await prisma.material.create({ data: { title, url: data.Location, category, classLevel } });

// // // res.json({ success: true, url: data.Location });
// // // } catch (err) {
// // //     console.error(err);
// // //     res.status(500).json({ error: 'Upload failed' });
// // //     }
// // //     });
    
// // //     export default router;


// // import express from 'express';
// // import multer from 'multer';
// // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// // import { v4 as uuidv4 } from 'uuid';

// // const router = express.Router();

// // const storage = multer.memoryStorage();
// // const upload = multer({ storage });

// // // Initialize S3 client
// // const s3Client = new S3Client({
// //   region: process.env.AWS_REGION,
// //   credentials: {
// //     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
// //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// //   }
// // });

// // router.post('/upload', upload.single('file'), async (req, res) => {
// //   try {
// //     const file = req.file;
// //     const { category, classLevel, title } = req.body;

// //     if (!file) {
// //       return res.status(400).json({ error: 'No file uploaded' });
// //     }
// //     if (!process.env.AWS_BUCKET_NAME) {
// //       return res.status(500).json({ error: 'AWS_BUCKET_NAME not configured' });
// //     }

// //     const key = `${classLevel}/${uuidv4()}-${file.originalname}`;

// //     const command = new PutObjectCommand({
// //       Bucket: process.env.AWS_BUCKET_NAME,
// //       Key: key,
// //       Body: file.buffer,
// //       ContentType: file.mimetype
// //       // Metadata: { title, category, classLevel } // Optional
// //     });

// //     const data = await s3Client.send(command);

// //     // Construct the file URL (assuming public-read or accessible bucket)
// //     const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

// //     // Save metadata in DB (uncomment if using Prisma)
// //     // const prisma = new PrismaClient();
// //     // await prisma.material.create({ data: { title, url, category, classLevel } });

// //     res.json({ success: true, url });
// //   } catch (err) {
// //     console.error('Upload error:', err);
// //     res.status(500).json({ error: 'Upload failed' });
// //   }
// // });

// // export default router;












// import express from 'express';
// import multer from 'multer';
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { v4 as uuidv4 } from 'uuid';
// import prisma from '../config/prismaClient.js';

// const router = express.Router();

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // Initialize S3 client
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//   }
// });

// router.post('/upload', upload.single('file'), async (req, res) => {
//   try {
//     const file = req.file;
//     const { category, classLevel, title } = req.body;

//     if (!file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }
//     if (!process.env.AWS_BUCKET_NAME) {
//       return res.status(500).json({ error: 'AWS_BUCKET_NAME not configured' });
//     }

//     const key = `${classLevel}/${uuidv4()}-${file.originalname}`;

//     const command = new PutObjectCommand({
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: key,
//       Body: file.buffer,
//       ContentType: file.mimetype
//     });

//     await s3Client.send(command);

//     // Public URL (adjust if your bucket is private)
//     const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

//     // Persist in DB so /api/resources can list it
//     try {
//       await prisma.studyMaterial.create({
//         data: {
//           title,
//           url,
//           category: category || 'General',
//           classLevel
//         }
//       });
//     } catch (dbErr) {
//       console.error('DB save error:', dbErr);
//       // We still return success for the upload itself
//     }

//     res.json({ success: true, url });
//   } catch (err) {
//     console.error('Upload error:', err);
//     res.status(500).json({ error: 'Upload failed' });
//   }
// });

// export default router;


// import express from 'express';
// import multer from 'multer';
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { v4 as uuidv4 } from 'uuid';
// import prisma from '../config/prismaClient.js';

// const router = express.Router();

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // Initialize S3 client
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//   }
// });

// // List materials for AdminDashboard
// router.get('/', async (req, res) => {
//   try {
//     const materials = await prisma.studyMaterial.findMany({
//       orderBy: { createdAt: 'desc' }
//     });
//     res.json(materials);
//   } catch (err) {
//     console.error('List materials error:', err);
//     res.status(500).json({ error: 'Failed to fetch materials' });
//   }
// });

// router.post('/upload', upload.single('file'), async (req, res) => {
//   try {
//     const file = req.file;
//     const { category, classLevel, title } = req.body;

//     if (!file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }
//     if (!process.env.AWS_BUCKET_NAME) {
//       return res.status(500).json({ error: 'AWS_BUCKET_NAME not configured' });
//     }

//     const key = `${classLevel}/${uuidv4()}-${file.originalname}`;

//     const command = new PutObjectCommand({
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: key,
//       Body: file.buffer,
//       ContentType: file.mimetype
//     });

//     await s3Client.send(command);

//     const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

//     // Persist metadata
//     try {
//       await prisma.studyMaterial.create({
//         data: { title, url, category: category || 'General', classLevel }
//       });
//     } catch (dbErr) {
//       console.error('DB save error:', dbErr);
//     }

//     res.json({ success: true, url });
//   } catch (err) {
//     console.error('Upload error:', err);
//     res.status(500).json({ error: 'Upload failed' });
//   }
// });

// export default router;


// import express from 'express';
// import multer from 'multer';
// import { PutObjectCommand } from '@aws-sdk/client-s3';
// import { v4 as uuidv4 } from 'uuid';
// import prisma from '../config/prismaClient.js';
// import s3Client from '../config/s3.js'; // use single S3 client

// const router = express.Router();

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// router.get('/', async (req, res) => {
//   try {
//     const materials = await prisma.studyMaterial.findMany({ orderBy: { createdAt: 'desc' } });
//     res.json(materials);
//   } catch (err) {
//     console.error('List materials error:', err);
//     res.status(500).json({ error: 'Failed to fetch materials' });
//   }
// });

// router.post('/upload', upload.single('file'), async (req, res) => {
//   try {
//     const file = req.file;
//     const { category, classLevel, title } = req.body;

//     if (!file) return res.status(400).json({ error: 'No file uploaded' });
//     if (!process.env.AWS_BUCKET_NAME) return res.status(500).json({ error: 'AWS_BUCKET_NAME not configured' });

//     const key = `${classLevel}/${uuidv4()}-${file.originalname}`;
//     await s3Client.send(new PutObjectCommand({
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: key,
//       Body: file.buffer,
//       ContentType: file.mimetype
//     }));

//     const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

//     try {
//       await prisma.studyMaterial.create({
//         data: { title, url, category: category || 'General', classLevel }
//       });
//     } catch (dbErr) {
//       console.error('DB save error:', dbErr);
//     }

//     res.json({ success: true, url });
//   } catch (err) {
//     console.error('Upload error:', err);
//     res.status(500).json({ error: 'Upload failed' });
//   }
// });

// export default router;

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

router.post('/upload', upload.single('file'), async (req, res) => {
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