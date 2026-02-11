// Exam Routes - /api/v2/exams
// Handles exam management, attempts, and results

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireTeacherOrAdmin, requireAdmin } from '../../middleware/auth.js';
import { examService, ExamStatus } from '../../services/examService.js';
import { examAttemptService } from '../../services/examAttemptService.js';
import { studentService } from '../../services/studentService.js';
import { batchService } from '../../services/batchService.js';
import { courseService } from '../../services/courseService.js';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendBadRequest,
  sendForbidden,
  sendPaginated,
} from '../../shared/utils/response.js';

// Helper to get string param
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

const router = Router();

// ============================================
// STUDENT ENDPOINTS
// ============================================

/**
 * GET /api/v2/exams/available
 * Get available exams for current student
 */
router.get('/available', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    // Get student's batches and courses
    const batches = await batchService.getStudentBatches(student.id);
    const batchIds = batches.map((b) => b.batch.id);
    const batchTypes = [...new Set(batches.map((b) => b.batch.batch_type).filter(Boolean))] as string[];

    const courses = await courseService.getStudentCourses(student.id);
    const courseIds = courses.map((c) => c.enrollment.course_id);
    const classGrades = [...new Set(courses.map((c) => c.course?.class_grade).filter(Boolean))] as string[];

    const exams = await examService.getAvailableForStudent(student.id, batchIds, courseIds, batchTypes, classGrades);

    sendSuccess(res, exams);
  } catch (error) {
    console.error('Error fetching available exams:', error);
    sendError(res, 'Failed to fetch available exams');
  }
});

/**
 * GET /api/v2/exams/:id
 * Get exam details
 */
router.get('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    const exam = await examService.getWithDetails(examId);
    if (!exam) {
      return sendNotFound(res, 'Exam');
    }

    // Non-admin can only see scheduled/live/completed exams
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';
    if (!isAdminOrTeacher && !['scheduled', 'live', 'completed'].includes(exam.status)) {
      return sendNotFound(res, 'Exam');
    }

    sendSuccess(res, exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    sendError(res, 'Failed to fetch exam');
  }
});

/**
 * POST /api/v2/exams/:id/start
 * Start exam attempt
 */
router.post('/:id/start', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);
    const { accessCode } = req.body;

    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const attempt = await examAttemptService.startAttempt({
      exam_id: examId,
      student_id: student.id,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      access_code: accessCode,
    });

    sendSuccess(res, attempt, 'Exam started');
  } catch (error) {
    console.error('Error starting exam:', error);
    sendError(res, (error as Error).message || 'Failed to start exam');
  }
});

/**
 * POST /api/v2/exams/attempts/:attemptId/save
 * Save response for a question
 */
router.post('/attempts/:attemptId/save', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const attemptId = getParam(req.params.attemptId);
    const { questionId, selectedOptionIds, numericalAnswer, textAnswer, isMarkedForReview, timeSpentSeconds } = req.body;

    if (!questionId) {
      return sendBadRequest(res, 'questionId is required');
    }

    // Verify attempt belongs to user
    const attempt = await examAttemptService.getById(attemptId);
    if (!attempt) {
      return sendNotFound(res, 'Attempt');
    }

    const student = await studentService.getByUserId(req.user!.id);
    if (!student || attempt.student_id !== student.id) {
      return sendForbidden(res, 'Not authorized');
    }

    const response = await examAttemptService.saveResponse(attemptId, {
      question_id: questionId,
      selected_option_ids: selectedOptionIds,
      numerical_answer: numericalAnswer,
      text_answer: textAnswer,
      is_marked_for_review: isMarkedForReview,
      time_spent_seconds: timeSpentSeconds,
    });

    sendSuccess(res, response);
  } catch (error) {
    console.error('Error saving response:', error);
    sendError(res, (error as Error).message || 'Failed to save response');
  }
});

/**
 * POST /api/v2/exams/attempts/:attemptId/submit
 * Submit exam attempt
 */
router.post('/attempts/:attemptId/submit', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const attemptId = getParam(req.params.attemptId);

    // Verify attempt belongs to user
    const attempt = await examAttemptService.getById(attemptId);
    if (!attempt) {
      return sendNotFound(res, 'Attempt');
    }

    const student = await studentService.getByUserId(req.user!.id);
    if (!student || attempt.student_id !== student.id) {
      return sendForbidden(res, 'Not authorized');
    }

    const submittedAttempt = await examAttemptService.submitAttempt(attemptId);

    sendSuccess(res, submittedAttempt, 'Exam submitted successfully');
  } catch (error) {
    console.error('Error submitting exam:', error);
    sendError(res, (error as Error).message || 'Failed to submit exam');
  }
});

/**
 * POST /api/v2/exams/attempts/:attemptId/tab-switch
 * Record tab switch event
 */
router.post('/attempts/:attemptId/tab-switch', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const attemptId = getParam(req.params.attemptId);

    // Verify attempt belongs to user
    const attempt = await examAttemptService.getById(attemptId);
    if (!attempt) {
      return sendNotFound(res, 'Attempt');
    }

    const student = await studentService.getByUserId(req.user!.id);
    if (!student || attempt.student_id !== student.id) {
      return sendForbidden(res, 'Not authorized');
    }

    const result = await examAttemptService.recordTabSwitch(attemptId);

    sendSuccess(res, result);
  } catch (error) {
    console.error('Error recording tab switch:', error);
    sendError(res, 'Failed to record tab switch');
  }
});

/**
 * GET /api/v2/exams/:id/result
 * Get exam result for current student
 */
router.get('/:id/result', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const result = await examAttemptService.getStudentResult(examId, student.id);
    if (!result) {
      return sendNotFound(res, 'Result');
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Error fetching result:', error);
    sendError(res, 'Failed to fetch result');
  }
});

/**
 * GET /api/v2/exams/attempts/:attemptId/review
 * Get detailed result for review
 */
router.get('/attempts/:attemptId/review', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const attemptId = getParam(req.params.attemptId);

    const attempt = await examAttemptService.getById(attemptId);
    if (!attempt) {
      return sendNotFound(res, 'Attempt');
    }

    // Check authorization
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';
    if (!isAdminOrTeacher) {
      const student = await studentService.getByUserId(req.user!.id);
      if (!student || attempt.student_id !== student.id) {
        return sendForbidden(res, 'Not authorized');
      }
    }

    // Check if review is allowed
    const exam = await examService.getById(attempt.exam_id);
    if (!exam) {
      return sendNotFound(res, 'Exam');
    }

    if (!isAdminOrTeacher && !exam.allow_review) {
      return sendForbidden(res, 'Review not allowed for this exam');
    }

    const detailedResult = await examAttemptService.getDetailedResult(attemptId);
    if (!detailedResult) {
      return sendBadRequest(res, 'Result not available yet');
    }

    sendSuccess(res, detailedResult);
  } catch (error) {
    console.error('Error fetching review:', error);
    sendError(res, 'Failed to fetch review');
  }
});

/**
 * GET /api/v2/exams/:id/leaderboard
 * Get exam leaderboard
 */
router.get('/:id/leaderboard', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboard = await examAttemptService.getLeaderboard(examId, limit);

    sendSuccess(res, leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    sendError(res, 'Failed to fetch leaderboard');
  }
});

/**
 * GET /api/v2/exams/:id/my-attempts
 * Get current student's attempts for an exam
 */
router.get('/:id/my-attempts', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const attempts = await examAttemptService.getStudentAttempts(examId, student.id);

    sendSuccess(res, attempts);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    sendError(res, 'Failed to fetch attempts');
  }
});

/**
 * GET /api/v2/exams/student/:studentId/results
 * Get all exam results for a student (used by parent dashboard)
 */
router.get('/student/:studentId/results', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.studentId);

    // Allow parents, admins, teachers, or the student themselves
    const role = req.user?.role;
    if (role === 'student') {
      const student = await studentService.getByUserId(req.user!.id);
      if (!student || student.id !== studentId) {
        return sendForbidden(res, 'Not authorized to view these results');
      }
    } else if (role !== 'admin' && role !== 'teacher' && role !== 'parent' && role !== 'batch_manager') {
      return sendForbidden(res, 'Not authorized');
    }

    const { getSupabase } = await import('../../config/supabase.js');
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('exam_results')
      .select(`
        id,
        exam_id,
        best_marks,
        best_percentage,
        total_attempts,
        average_marks,
        average_percentage,
        is_passed,
        exam:exams(id, title, total_marks, exam_type)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student results:', error);
      return sendError(res, 'Failed to fetch results');
    }

    const results = (data || []).map((r: any) => ({
      id: r.id,
      exam_id: r.exam_id,
      exam_title: r.exam?.title || 'Exam',
      exam_type: r.exam?.exam_type,
      best_marks: r.best_marks,
      best_percentage: r.best_percentage,
      total_marks: r.exam?.total_marks || 100,
      is_passed: r.is_passed,
      attempts_count: r.total_attempts,
    }));

    sendSuccess(res, results);
  } catch (error) {
    console.error('Error fetching student exam results:', error);
    sendError(res, 'Failed to fetch exam results');
  }
});

// ============================================
// ADMIN/TEACHER ENDPOINTS
// ============================================

/**
 * GET /api/v2/exams
 * List all exams (admin/teacher)
 */
router.get('/', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ExamStatus | undefined;
    const courseId = req.query.courseId as string | undefined;
    const batchId = req.query.batchId as string | undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const examType = req.query.examType as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await examService.list({
      page,
      limit,
      status,
      courseId,
      batchId,
      subjectId,
      examType,
      search,
      includeExpired: true,
    });

    sendPaginated(res, result.exams, result.total, page, limit);
  } catch (error) {
    console.error('Error listing exams:', error);
    sendError(res, 'Failed to list exams');
  }
});

/**
 * POST /api/v2/exams
 * Create new exam
 */
router.post('/', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      instructions,
      examType,
      subjectId,
      courseId,
      batchId,
      durationMinutes,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      showResultImmediately,
      showAnswersAfterSubmit,
      allowReview,
      enableTabSwitchDetection,
      maxTabSwitches,
      enableFullscreen,
      isFree,
      accessCode,
      targetBatchType,
      targetClass,
    } = req.body;

    if (!title) {
      return sendBadRequest(res, 'title is required');
    }

    if (!durationMinutes) {
      return sendBadRequest(res, 'durationMinutes is required');
    }

    const exam = await examService.create({
      title,
      description,
      instructions,
      exam_type: examType,
      subject_id: subjectId,
      course_id: courseId,
      batch_id: batchId,
      duration_minutes: durationMinutes,
      start_time: startTime,
      end_time: endTime,
      total_marks: totalMarks,
      passing_marks: passingMarks,
      max_attempts: maxAttempts || 1,
      shuffle_questions: shuffleQuestions || false,
      shuffle_options: shuffleOptions || false,
      show_result_immediately: showResultImmediately !== false,
      show_answers_after_submit: showAnswersAfterSubmit !== false,
      allow_review: allowReview !== false,
      enable_tab_switch_detection: enableTabSwitchDetection || false,
      max_tab_switches: maxTabSwitches || 3,
      enable_fullscreen: enableFullscreen || false,
      is_free: isFree || false,
      access_code: accessCode,
      target_batch_type: targetBatchType || null,
      target_class: targetClass || null,
      created_by: req.user?.id,
    });

    sendCreated(res, exam, 'Exam created successfully');
  } catch (error) {
    console.error('Error creating exam:', error);
    sendError(res, 'Failed to create exam');
  }
});

/**
 * PUT /api/v2/exams/:id
 * Update exam
 */
router.put('/:id', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);
    const updates = req.body;

    const existingExam = await examService.getById(examId);
    if (!existingExam) {
      return sendNotFound(res, 'Exam');
    }

    // Map camelCase to snake_case
    const mappedUpdates: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      examType: 'exam_type',
      subjectId: 'subject_id',
      courseId: 'course_id',
      batchId: 'batch_id',
      durationMinutes: 'duration_minutes',
      startTime: 'start_time',
      endTime: 'end_time',
      totalMarks: 'total_marks',
      passingMarks: 'passing_marks',
      maxAttempts: 'max_attempts',
      shuffleQuestions: 'shuffle_questions',
      shuffleOptions: 'shuffle_options',
      showResultImmediately: 'show_result_immediately',
      showAnswersAfterSubmit: 'show_answers_after_submit',
      allowReview: 'allow_review',
      enableTabSwitchDetection: 'enable_tab_switch_detection',
      maxTabSwitches: 'max_tab_switches',
      enableFullscreen: 'enable_fullscreen',
      isFree: 'is_free',
      accessCode: 'access_code',
      targetBatchType: 'target_batch_type',
      targetClass: 'target_class',
    };

    for (const [key, value] of Object.entries(updates)) {
      const mappedKey = fieldMap[key] || key;
      mappedUpdates[mappedKey] = value;
    }

    mappedUpdates.updated_by = req.user?.id;

    const exam = await examService.update(examId, mappedUpdates);

    sendSuccess(res, exam, 'Exam updated successfully');
  } catch (error) {
    console.error('Error updating exam:', error);
    sendError(res, 'Failed to update exam');
  }
});

/**
 * DELETE /api/v2/exams/:id
 * Delete exam
 */
router.delete('/:id', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    const exam = await examService.getById(examId);
    if (!exam) {
      return sendNotFound(res, 'Exam');
    }

    await examService.delete(examId);

    sendSuccess(res, null, 'Exam deleted successfully');
  } catch (error) {
    console.error('Error deleting exam:', error);
    sendError(res, 'Failed to delete exam');
  }
});

// ============================================
// EXAM SECTIONS
// ============================================

/**
 * GET /api/v2/exams/:id/sections
 * Get exam sections
 */
router.get('/:id/sections', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    const sections = await examService.getSections(examId);

    sendSuccess(res, sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    sendError(res, 'Failed to fetch sections');
  }
});

/**
 * POST /api/v2/exams/:id/sections
 * Create exam section
 */
router.post('/:id/sections', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);
    const { title, description, instructions, durationMinutes, questionsToAttempt, sequenceOrder } = req.body;

    if (!title) {
      return sendBadRequest(res, 'title is required');
    }

    const section = await examService.createSection(examId, {
      title,
      description,
      instructions,
      duration_minutes: durationMinutes,
      questions_to_attempt: questionsToAttempt,
      sequence_order: sequenceOrder,
    });

    sendCreated(res, section, 'Section created');
  } catch (error) {
    console.error('Error creating section:', error);
    sendError(res, 'Failed to create section');
  }
});

/**
 * DELETE /api/v2/exams/:id/sections/:sectionId
 * Delete exam section
 */
router.delete('/:id/sections/:sectionId', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const sectionId = getParam(req.params.sectionId);

    await examService.deleteSection(sectionId);

    sendSuccess(res, null, 'Section deleted');
  } catch (error) {
    console.error('Error deleting section:', error);
    sendError(res, 'Failed to delete section');
  }
});

// ============================================
// EXAM QUESTIONS
// ============================================

/**
 * GET /api/v2/exams/:id/questions
 * Get exam questions (with details for admin/teacher)
 */
router.get('/:id/questions', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    const questions = await examService.getQuestions(examId);

    sendSuccess(res, questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    sendError(res, 'Failed to fetch questions');
  }
});

/**
 * POST /api/v2/exams/:id/questions
 * Add question to exam
 */
router.post('/:id/questions', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);
    const { questionId, sectionId, positiveMarks, negativeMarks, sequenceOrder, isMandatory } = req.body;

    if (!questionId) {
      return sendBadRequest(res, 'questionId is required');
    }

    const examQuestion = await examService.addQuestion(examId, {
      question_id: questionId,
      section_id: sectionId,
      positive_marks: positiveMarks,
      negative_marks: negativeMarks,
      sequence_order: sequenceOrder,
      is_mandatory: isMandatory,
    });

    sendCreated(res, examQuestion, 'Question added');
  } catch (error) {
    console.error('Error adding question:', error);
    sendError(res, 'Failed to add question');
  }
});

/**
 * POST /api/v2/exams/:id/questions/bulk
 * Add multiple questions to exam
 */
router.post('/:id/questions/bulk', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);
    const { questionIds, sectionId } = req.body;

    if (!questionIds || !Array.isArray(questionIds)) {
      return sendBadRequest(res, 'questionIds array is required');
    }

    const examQuestions = await examService.addQuestions(examId, questionIds, sectionId);

    sendCreated(res, examQuestions, `${examQuestions.length} questions added`);
  } catch (error) {
    console.error('Error adding questions:', error);
    sendError(res, 'Failed to add questions');
  }
});

/**
 * DELETE /api/v2/exams/:id/questions/:questionId
 * Remove question from exam
 */
router.delete('/:id/questions/:questionId', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);
    const questionId = getParam(req.params.questionId);

    await examService.removeQuestion(examId, questionId);

    sendSuccess(res, null, 'Question removed');
  } catch (error) {
    console.error('Error removing question:', error);
    sendError(res, 'Failed to remove question');
  }
});

/**
 * PUT /api/v2/exams/:id/questions/reorder
 * Reorder exam questions
 */
router.put('/:id/questions/reorder', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds)) {
      return sendBadRequest(res, 'questionIds array is required');
    }

    await examService.reorderQuestions(examId, questionIds);

    sendSuccess(res, null, 'Questions reordered');
  } catch (error) {
    console.error('Error reordering questions:', error);
    sendError(res, 'Failed to reorder questions');
  }
});

// ============================================
// EXAM ACTIONS
// ============================================

/**
 * POST /api/v2/exams/:id/publish
 * Publish exam
 */
router.post('/:id/publish', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    const exam = await examService.publish(examId);

    sendSuccess(res, exam, 'Exam published');
  } catch (error) {
    console.error('Error publishing exam:', error);
    sendError(res, 'Failed to publish exam');
  }
});

/**
 * POST /api/v2/exams/:id/cancel
 * Cancel exam
 */
router.post('/:id/cancel', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    const exam = await examService.cancel(examId);

    sendSuccess(res, exam, 'Exam cancelled');
  } catch (error) {
    console.error('Error cancelling exam:', error);
    sendError(res, 'Failed to cancel exam');
  }
});

/**
 * POST /api/v2/exams/:id/complete
 * Mark exam as completed
 */
router.post('/:id/complete', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    const exam = await examService.complete(examId);

    // Calculate ranks
    await examAttemptService.calculateRanks(examId);

    sendSuccess(res, exam, 'Exam completed');
  } catch (error) {
    console.error('Error completing exam:', error);
    sendError(res, 'Failed to complete exam');
  }
});

/**
 * POST /api/v2/exams/:id/duplicate
 * Duplicate exam
 */
router.post('/:id/duplicate', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    const exam = await examService.duplicate(examId);

    sendCreated(res, exam, 'Exam duplicated');
  } catch (error) {
    console.error('Error duplicating exam:', error);
    sendError(res, 'Failed to duplicate exam');
  }
});

// ============================================
// EXAM ATTEMPTS (Admin)
// ============================================

/**
 * GET /api/v2/exams/:id/attempts
 * Get all attempts for an exam (admin/teacher)
 */
router.get('/:id/attempts', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await examAttemptService.getExamAttempts(examId, {
      page,
      limit,
      status: status as 'in_progress' | 'submitted' | 'auto_submitted' | 'graded' | 'abandoned' | undefined,
    });

    sendPaginated(res, result.attempts, result.total, page, limit);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    sendError(res, 'Failed to fetch attempts');
  }
});

/**
 * POST /api/v2/exams/:id/calculate-ranks
 * Calculate ranks for exam
 */
router.post('/:id/calculate-ranks', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = getParam(req.params.id);

    await examAttemptService.calculateRanks(examId);

    sendSuccess(res, null, 'Ranks calculated');
  } catch (error) {
    console.error('Error calculating ranks:', error);
    sendError(res, 'Failed to calculate ranks');
  }
});

export default router;
