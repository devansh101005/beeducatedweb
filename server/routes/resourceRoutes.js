// // server/routes/resourceRoutes.js
// import express from "express";
// import s3 from "../config/s3.js";
// import upload from "../middleware/uploadMiddleware.js";
// import prisma from "../config/prismaClient.js"; // Make sure prisma client is setup

// const router = express.Router();

// router.post("/upload", upload.single("file"), async (req, res) => {
//   const { title, category, classLevel } = req.body;
//   const file = req.file;

//   const key = `${classLevel}/${Date.now()}-${file.originalname}`;
//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: key,
//     Body: file.buffer,
//     ContentType: file.mimetype,
//    // ACL: 'public-read',
//   };

//   try {
//     const uploadResult = await s3.upload(params).promise();

//     // Save metadata in DB
//     const material = await prisma.studyMaterial.create({
//       data: {
//         title,
//         category: category || "General", // Default to "General" if no category provided
//         classLevel,
//         url: uploadResult.Location,
//       },
//     });

//     res.status(200).json({ success: true, material });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Upload failed" });
//   }
// });

// // Get all study materials
// router.get("/", async (req, res) => {
//     try {
//       const materials = await prisma.studyMaterial.findMany({
//         orderBy: { createdAt: "desc" },
//       });
//       res.json(materials);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Failed to fetch materials" });
//     }
//   });
  

// export default router;

// server/routes/resourceRoutes.js
import express from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3.js";
import upload from "../middleware/uploadMiddleware.js";
import prisma from "../config/prismaClient.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// SECURITY: Middleware to require ADMIN or TUTOR role for uploads
const canUpload = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const allowedRoles = ["ADMIN", "TUTOR"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Only administrators and tutors can upload resources" });
  }
  next();
};

// Upload route - requires authentication + ADMIN/TUTOR role
router.post("/upload", verifyToken, canUpload, upload.single("file"), async (req, res) => {
  try {
    const { title, category, classLevel } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!process.env.AWS_BUCKET_NAME) {
      return res.status(500).json({ error: "AWS_BUCKET_NAME not configured" });
    }

    const key = `${classLevel}/${Date.now()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Save metadata in DB
    const material = await prisma.studyMaterial.create({
      data: {
        title,
        category: category || "General", // Default to "General" if no category provided

        classLevel,
        url,
      },
    });

    res.status(200).json({ success: true, material });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Get study materials with optional filters
router.get("/", async (req, res) => {
  try {
    const { classLevel, category } = req.query;
    const where = {};
    if (classLevel && classLevel !== 'All') where.classLevel = classLevel;
    if (category && category !== 'All') where.category = category;

    const materials = await prisma.studyMaterial.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

export default router;
