// Question Routes - /api/v2/questions
// Handles question bank management

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireTeacherOrAdmin, requireAdmin } from '../../middleware/auth.js';
import { questionService, QuestionType, DifficultyLevel } from '../../services/questionService.js';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendBadRequest,
  sendPaginated,
} from '../../shared/utils/response.js';

// Helper to get string param
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

const router = Router();

// All question routes require teacher or admin access
router.use(requireAuth, attachUser, requireTeacherOrAdmin);

// ============================================
// QUESTION CRUD
// ============================================

/**
 * GET /api/v2/questions
 * List questions with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const subjectId = req.query.subjectId as string | undefined;
    const topicId = req.query.topicId as string | undefined;
    const questionType = req.query.questionType as QuestionType | undefined;
    const difficulty = req.query.difficulty as DifficultyLevel | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const isVerified = req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined;
    const source = req.query.source as string | undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const search = req.query.search as string | undefined;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;

    const result = await questionService.list({
      page,
      limit,
      subjectId,
      topicId,
      questionType,
      difficulty,
      isActive,
      isVerified,
      source,
      year,
      search,
      tags,
    });

    sendPaginated(res, result.questions, result.total, page, limit);
  } catch (error) {
    console.error('Error listing questions:', error);
    sendError(res, 'Failed to list questions');
  }
});

/**
 * GET /api/v2/questions/with-options
 * List questions with their options
 */
router.get('/with-options', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const subjectId = req.query.subjectId as string | undefined;
    const topicId = req.query.topicId as string | undefined;
    const questionType = req.query.questionType as QuestionType | undefined;
    const difficulty = req.query.difficulty as DifficultyLevel | undefined;

    const result = await questionService.listWithOptions({
      page,
      limit,
      subjectId,
      topicId,
      questionType,
      difficulty,
    });

    sendPaginated(res, result.questions, result.total, page, limit);
  } catch (error) {
    console.error('Error listing questions:', error);
    sendError(res, 'Failed to list questions');
  }
});

/**
 * GET /api/v2/questions/stats
 * Get question bank statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await questionService.getStats();

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    sendError(res, 'Failed to get statistics');
  }
});

/**
 * GET /api/v2/questions/random
 * Get random questions (for exam generation)
 */
router.get('/random', async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 10;
    const subjectId = req.query.subjectId as string | undefined;
    const topicId = req.query.topicId as string | undefined;
    const difficulty = req.query.difficulty as DifficultyLevel | undefined;
    const excludeIds = req.query.excludeIds ? (req.query.excludeIds as string).split(',') : undefined;

    const questions = await questionService.getRandom({
      count,
      subjectId,
      topicId,
      difficulty,
      excludeIds,
    });

    sendSuccess(res, questions);
  } catch (error) {
    console.error('Error getting random questions:', error);
    sendError(res, 'Failed to get random questions');
  }
});

/**
 * GET /api/v2/questions/:id
 * Get question by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.id);

    const question = await questionService.getWithOptions(questionId);
    if (!question) {
      return sendNotFound(res, 'Question');
    }

    sendSuccess(res, question);
  } catch (error) {
    console.error('Error fetching question:', error);
    sendError(res, 'Failed to fetch question');
  }
});

/**
 * POST /api/v2/questions
 * Create new question
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      subjectId,
      topicId,
      questionText,
      questionHtml,
      questionImageUrl,
      questionType,
      difficulty,
      numericalAnswer,
      numericalTolerance,
      modelAnswer,
      maxWords,
      positiveMarks,
      negativeMarks,
      partialMarksAllowed,
      explanation,
      explanationImageUrl,
      tags,
      source,
      year,
      options,
    } = req.body;

    if (!questionText) {
      return sendBadRequest(res, 'questionText is required');
    }

    if (!questionType) {
      return sendBadRequest(res, 'questionType is required');
    }

    // Validate options for MCQ
    if (['single_choice', 'multiple_choice', 'true_false'].includes(questionType)) {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return sendBadRequest(res, 'At least 2 options are required for MCQ questions');
      }

      const hasCorrect = options.some((opt: { is_correct?: boolean }) => opt.is_correct);
      if (!hasCorrect) {
        return sendBadRequest(res, 'At least one option must be marked as correct');
      }
    }

    // Validate numerical answer
    if (questionType === 'numerical' && numericalAnswer === undefined) {
      return sendBadRequest(res, 'numericalAnswer is required for numerical questions');
    }

    const question = await questionService.create({
      subject_id: subjectId,
      topic_id: topicId,
      question_text: questionText,
      question_html: questionHtml,
      question_image_url: questionImageUrl,
      question_type: questionType,
      difficulty: difficulty || 'medium',
      numerical_answer: numericalAnswer,
      numerical_tolerance: numericalTolerance || 0,
      model_answer: modelAnswer,
      max_words: maxWords,
      positive_marks: positiveMarks || 4,
      negative_marks: negativeMarks || 1,
      partial_marks_allowed: partialMarksAllowed || false,
      explanation,
      explanation_image_url: explanationImageUrl,
      tags,
      source,
      year,
      created_by: req.user?.id,
      options: options?.map((opt: {
        option_text: string;
        option_html?: string;
        option_image_url?: string;
        is_correct: boolean;
        sequence_order?: number;
      }, idx: number) => ({
        option_text: opt.option_text,
        option_html: opt.option_html,
        option_image_url: opt.option_image_url,
        is_correct: opt.is_correct,
        sequence_order: opt.sequence_order ?? idx,
      })),
    });

    sendCreated(res, question, 'Question created successfully');
  } catch (error) {
    console.error('Error creating question:', error);
    sendError(res, 'Failed to create question');
  }
});

/**
 * PUT /api/v2/questions/:id
 * Update question
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.id);
    const {
      subjectId,
      topicId,
      questionText,
      questionHtml,
      questionImageUrl,
      questionType,
      difficulty,
      numericalAnswer,
      numericalTolerance,
      modelAnswer,
      maxWords,
      positiveMarks,
      negativeMarks,
      partialMarksAllowed,
      explanation,
      explanationImageUrl,
      tags,
      source,
      year,
      isActive,
    } = req.body;

    const existingQuestion = await questionService.getById(questionId);
    if (!existingQuestion) {
      return sendNotFound(res, 'Question');
    }

    const question = await questionService.update(questionId, {
      subject_id: subjectId,
      topic_id: topicId,
      question_text: questionText,
      question_html: questionHtml,
      question_image_url: questionImageUrl,
      question_type: questionType,
      difficulty,
      numerical_answer: numericalAnswer,
      numerical_tolerance: numericalTolerance,
      model_answer: modelAnswer,
      max_words: maxWords,
      positive_marks: positiveMarks,
      negative_marks: negativeMarks,
      partial_marks_allowed: partialMarksAllowed,
      explanation,
      explanation_image_url: explanationImageUrl,
      tags,
      source,
      year,
      is_active: isActive,
      updated_by: req.user?.id,
    });

    sendSuccess(res, question, 'Question updated successfully');
  } catch (error) {
    console.error('Error updating question:', error);
    sendError(res, 'Failed to update question');
  }
});

/**
 * DELETE /api/v2/questions/:id
 * Delete question
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.id);

    const question = await questionService.getById(questionId);
    if (!question) {
      return sendNotFound(res, 'Question');
    }

    await questionService.delete(questionId);

    sendSuccess(res, null, 'Question deleted successfully');
  } catch (error) {
    console.error('Error deleting question:', error);
    sendError(res, 'Failed to delete question');
  }
});

// ============================================
// OPTIONS
// ============================================

/**
 * GET /api/v2/questions/:id/options
 * Get options for a question
 */
router.get('/:id/options', async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.id);

    const options = await questionService.getOptions(questionId);

    sendSuccess(res, options);
  } catch (error) {
    console.error('Error fetching options:', error);
    sendError(res, 'Failed to fetch options');
  }
});

/**
 * POST /api/v2/questions/:id/options
 * Add option to question
 */
router.post('/:id/options', async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.id);
    const { optionText, optionHtml, optionImageUrl, isCorrect, sequenceOrder } = req.body;

    if (!optionText) {
      return sendBadRequest(res, 'optionText is required');
    }

    const option = await questionService.addOption(questionId, {
      option_text: optionText,
      option_html: optionHtml,
      option_image_url: optionImageUrl,
      is_correct: isCorrect || false,
      sequence_order: sequenceOrder,
    });

    sendCreated(res, option, 'Option added');
  } catch (error) {
    console.error('Error adding option:', error);
    sendError(res, 'Failed to add option');
  }
});

/**
 * PUT /api/v2/questions/:id/options/:optionId
 * Update option
 */
router.put('/:id/options/:optionId', async (req: Request, res: Response) => {
  try {
    const optionId = getParam(req.params.optionId);
    const { optionText, optionHtml, optionImageUrl, isCorrect, sequenceOrder } = req.body;

    const option = await questionService.updateOption(optionId, {
      option_text: optionText,
      option_html: optionHtml,
      option_image_url: optionImageUrl,
      is_correct: isCorrect,
      sequence_order: sequenceOrder,
    });

    sendSuccess(res, option, 'Option updated');
  } catch (error) {
    console.error('Error updating option:', error);
    sendError(res, 'Failed to update option');
  }
});

/**
 * DELETE /api/v2/questions/:id/options/:optionId
 * Delete option
 */
router.delete('/:id/options/:optionId', async (req: Request, res: Response) => {
  try {
    const optionId = getParam(req.params.optionId);

    await questionService.deleteOption(optionId);

    sendSuccess(res, null, 'Option deleted');
  } catch (error) {
    console.error('Error deleting option:', error);
    sendError(res, 'Failed to delete option');
  }
});

/**
 * PUT /api/v2/questions/:id/options
 * Replace all options for a question
 */
router.put('/:id/options', async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.id);
    const { options } = req.body;

    if (!options || !Array.isArray(options)) {
      return sendBadRequest(res, 'options array is required');
    }

    const mappedOptions = options.map((opt: {
      option_text: string;
      option_html?: string;
      option_image_url?: string;
      is_correct: boolean;
      sequence_order?: number;
    }, idx: number) => ({
      option_text: opt.option_text,
      option_html: opt.option_html,
      option_image_url: opt.option_image_url,
      is_correct: opt.is_correct,
      sequence_order: opt.sequence_order ?? idx,
    }));

    const updatedOptions = await questionService.replaceOptions(questionId, mappedOptions);

    sendSuccess(res, updatedOptions, 'Options replaced');
  } catch (error) {
    console.error('Error replacing options:', error);
    sendError(res, 'Failed to replace options');
  }
});

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * POST /api/v2/questions/bulk
 * Bulk create questions (import)
 */
router.post('/bulk', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return sendBadRequest(res, 'questions array is required');
    }

    // Map input to expected format
    const mappedQuestions = questions.map((q: {
      subjectId?: string;
      topicId?: string;
      questionText: string;
      questionHtml?: string;
      questionImageUrl?: string;
      questionType: QuestionType;
      difficulty?: DifficultyLevel;
      numericalAnswer?: number;
      numericalTolerance?: number;
      modelAnswer?: string;
      positiveMarks?: number;
      negativeMarks?: number;
      explanation?: string;
      tags?: string[];
      source?: string;
      year?: number;
      options?: Array<{
        option_text: string;
        option_html?: string;
        is_correct: boolean;
        sequence_order?: number;
      }>;
    }) => ({
      subject_id: q.subjectId,
      topic_id: q.topicId,
      question_text: q.questionText,
      question_html: q.questionHtml,
      question_image_url: q.questionImageUrl,
      question_type: q.questionType,
      difficulty: q.difficulty || 'medium',
      numerical_answer: q.numericalAnswer,
      numerical_tolerance: q.numericalTolerance,
      model_answer: q.modelAnswer,
      positive_marks: q.positiveMarks || 4,
      negative_marks: q.negativeMarks || 1,
      explanation: q.explanation,
      tags: q.tags,
      source: q.source,
      year: q.year,
      created_by: req.user?.id,
      options: q.options,
    }));

    const result = await questionService.bulkCreate(mappedQuestions);

    sendSuccess(res, result, `${result.created} questions created, ${result.failed} failed`);
  } catch (error) {
    console.error('Error bulk creating questions:', error);
    sendError(res, 'Failed to bulk create questions');
  }
});

// ============================================
// VERIFICATION
// ============================================

/**
 * POST /api/v2/questions/:id/verify
 * Verify/unverify question
 */
router.post('/:id/verify', requireAdmin, async (req: Request, res: Response) => {
  try {
    const questionId = getParam(req.params.id);
    const { verified } = req.body;

    const question = await questionService.verify(questionId, verified !== false, req.user?.id);

    sendSuccess(res, question, verified !== false ? 'Question verified' : 'Question unverified');
  } catch (error) {
    console.error('Error verifying question:', error);
    sendError(res, 'Failed to verify question');
  }
});

export default router;
