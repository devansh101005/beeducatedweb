// //const express = require('express');
// import express from "express";
// const router = express.Router();

// const { getLatestAnnouncement } = require('../controllers/announcementController');

// router.get('/latest', getLatestAnnouncement);

// export default router;

import express from "express";

const router = express.Router();

// Example: In-memory dummy announcement.
// Later, you can replace with DB logic (Prisma or whatever you use).
let latestAnnouncement = {
  id: 1,
  message: "Welcome to Be Educated! New batches start next week 🎉",
  createdAt: new Date()
};

// GET latest announcement
router.get("/latest", (req, res) => {
  res.json({
    success: true,
    announcement: latestAnnouncement
  });
});

// (Optional) POST to update/create a new announcement
router.post("/", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: "Message is required" });
  }

  latestAnnouncement = {
    id: latestAnnouncement.id + 1,
    message,
    createdAt: new Date()
  };

  res.status(201).json({ success: true, announcement: latestAnnouncement });
});

export default router;

