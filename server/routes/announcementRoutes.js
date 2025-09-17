import express from "express";

const router = express.Router();

let latestAnnouncement = {
  id: 1,
  message: "Registration process of test series has started for class 10th and 12th 🎉",
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

