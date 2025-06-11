import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure folders exist
const studentDir = "./uploads/students";
const tutorDir = "./uploads/tutors";
fs.mkdirSync(studentDir, { recursive: true });
fs.mkdirSync(tutorDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = req.baseUrl.includes("tutor") ? tutorDir : studentDir;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

export default upload;