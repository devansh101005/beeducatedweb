// server/routes/resourceRoutes.js
import express from "express";
import s3 from "../config/s3.js";
import upload from "../middleware/uploadMiddleware.js";
import prisma from "../config/prismaClient.js"; // Make sure prisma client is setup

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  const { title, category, classLevel } = req.body;
  const file = req.file;

  const key = `${classLevel}/${Date.now()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
   // ACL: 'public-read',
  };

  try {
    const uploadResult = await s3.upload(params).promise();

    // Save metadata in DB
    const material = await prisma.studyMaterial.create({
      data: {
        title,
        category: category || "General", // Default to "General" if no category provided
        classLevel,
        url: uploadResult.Location,
      },
    });

    res.status(200).json({ success: true, material });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Get all study materials
router.get("/", async (req, res) => {
    try {
      const materials = await prisma.studyMaterial.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json(materials);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });
  

export default router;
