import express from 'express';
import {
  createExam,
  addQuestion,
  getAllExams,
  getExamQuestions,
  getAvailableExams,
  startExam,
  submitExam,
  getResult,
  getLeaderboard
} from '../controllers/examController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Admin / Tutor routes
router.post('/', authenticate, authorize(['ADMIN', 'TUTOR']), createExam);
router.post('/:examId/questions', authenticate, authorize(['ADMIN', 'TUTOR']), addQuestion);
router.get('/', authenticate, authorize(['ADMIN', 'TUTOR','STUDENT']), getAllExams);
router.get('/:examId/questions', authenticate, authorize(['ADMIN', 'TUTOR']), getExamQuestions);

// Student routes
router.get('/available', authenticate, authorize(['STUDENT']), getAvailableExams);
router.get('/:examId/start', authenticate, authorize(['STUDENT']), startExam);
router.post('/:examId/submit', authenticate, authorize(['STUDENT']), submitExam);
router.get('/:examId/result', authenticate, authorize(['STUDENT']), getResult);
router.get('/:examId/leaderboard', authenticate, getLeaderboard);

export default router;
