// Batch Routes - /api/v2/batches
// Handles batch management operations

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireAdmin, requireBatchAccess } from '../../middleware/auth.js';
import { batchService, BatchType, EnrollmentStatus } from '../../services/batchService.js';
import { studentService } from '../../services/studentService.js';
import { teacherService } from '../../services/teacherService.js';
import { courseService } from '../../services/courseService.js';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendBadRequest,
  sendPaginated,
} from '../../shared/utils/response.js';

// Helper to get string param (Express 5 can return string | string[])
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

const router = Router();

// All routes require authentication
router.use(requireAuth, attachUser);

// ============================================
// BATCH CRUD
// ============================================

/**
 * GET /api/v2/batches
 * List batches with pagination and filters
 * Anyone authenticated can list batches
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const targetExam = req.query.targetExam as string | undefined;
    const targetYear = req.query.targetYear ? parseInt(req.query.targetYear as string) : undefined;
    const batchType = req.query.batchType as BatchType | undefined;
    const managerId = req.query.managerId as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await batchService.list({
      page,
      limit,
      isActive,
      targetExam,
      targetYear,
      batchType,
      managerId,
      search,
    });

    sendPaginated(res, result.batches, result.total, page, limit);
  } catch (error) {
    console.error('Error listing batches:', error);
    sendError(res, 'Failed to list batches');
  }
});

/**
 * GET /api/v2/batches/stats
 * Get aggregate batch statistics (must be before /:id route)
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const result = await batchService.list({ page: 1, limit: 1000 });
    const allBatches = result.batches;

    const now = new Date();
    const stats = {
      totalBatches: result.total,
      activeBatches: allBatches.filter((b: any) => b.is_active && new Date(b.start_date) <= now).length,
      upcomingBatches: allBatches.filter((b: any) => b.is_active && new Date(b.start_date) > now).length,
      totalStudents: allBatches.reduce((sum: number, b: any) => sum + (b.current_students || 0), 0),
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Error fetching aggregate batch stats:', error);
    sendError(res, 'Failed to fetch batch statistics');
  }
});

/**
 * GET /api/v2/batches/:id
 * Get batch by ID with details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);
    const includeDetails = req.query.details === 'true';

    if (includeDetails) {
      const result = await batchService.getWithDetails(batchId);
      if (!result) {
        return sendNotFound(res, 'Batch');
      }
      sendSuccess(res, result);
    } else {
      const batch = await batchService.getById(batchId);
      if (!batch) {
        return sendNotFound(res, 'Batch');
      }
      sendSuccess(res, batch);
    }
  } catch (error) {
    console.error('Error fetching batch:', error);
    sendError(res, 'Failed to fetch batch');
  }
});

/**
 * POST /api/v2/batches
 * Create a new batch (admin/batch_manager only)
 */
router.post('/', requireBatchAccess, async (req: Request, res: Response) => {
  try {
    const { name, description, targetExam, targetYear, batchType, startDate, endDate, schedule, maxStudents, managerId, metadata } = req.body;

    if (!name) {
      return sendBadRequest(res, 'Batch name is required');
    }

    const batch = await batchService.create({
      name,
      description,
      target_exam: targetExam,
      target_year: targetYear,
      batch_type: batchType,
      start_date: startDate,
      end_date: endDate,
      schedule,
      max_students: maxStudents,
      manager_id: managerId || req.user?.id,
      metadata,
    });

    sendCreated(res, batch, 'Batch created successfully');
  } catch (error) {
    console.error('Error creating batch:', error);
    sendError(res, 'Failed to create batch');
  }
});

/**
 * PUT /api/v2/batches/:id
 * Update batch details (admin/batch_manager only)
 */
router.put('/:id', requireBatchAccess, async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);
    const { name, description, targetExam, targetYear, batchType, startDate, endDate, schedule, maxStudents, isActive, managerId, metadata } = req.body;

    const existingBatch = await batchService.getById(batchId);
    if (!existingBatch) {
      return sendNotFound(res, 'Batch');
    }

    const batch = await batchService.update(batchId, {
      name,
      description,
      target_exam: targetExam,
      target_year: targetYear,
      batch_type: batchType,
      start_date: startDate,
      end_date: endDate,
      schedule,
      max_students: maxStudents,
      is_active: isActive,
      manager_id: managerId,
      metadata,
    });

    sendSuccess(res, batch, 'Batch updated successfully');
  } catch (error) {
    console.error('Error updating batch:', error);
    sendError(res, 'Failed to update batch');
  }
});

/**
 * DELETE /api/v2/batches/:id
 * Deactivate batch (admin only)
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);

    const batch = await batchService.getById(batchId);
    if (!batch) {
      return sendNotFound(res, 'Batch');
    }

    await batchService.deactivate(batchId);
    sendSuccess(res, null, 'Batch deactivated successfully');
  } catch (error) {
    console.error('Error deactivating batch:', error);
    sendError(res, 'Failed to deactivate batch');
  }
});

/**
 * POST /api/v2/batches/:id/reactivate
 * Reactivate batch (admin only)
 */
router.post('/:id/reactivate', requireAdmin, async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);

    const batch = await batchService.getById(batchId);
    if (!batch) {
      return sendNotFound(res, 'Batch');
    }

    await batchService.reactivate(batchId);
    sendSuccess(res, null, 'Batch reactivated successfully');
  } catch (error) {
    console.error('Error reactivating batch:', error);
    sendError(res, 'Failed to reactivate batch');
  }
});

// ============================================
// STUDENT ENROLLMENT
// ============================================

/**
 * GET /api/v2/batches/:id/students
 * Get students enrolled in a batch
 */
router.get('/:id/students', async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);
    const status = req.query.status as EnrollmentStatus | undefined;

    const batch = await batchService.getById(batchId);
    if (!batch) {
      return sendNotFound(res, 'Batch');
    }

    const students = await batchService.getStudents(batchId, status);
    sendSuccess(res, students);
  } catch (error) {
    console.error('Error fetching batch students:', error);
    sendError(res, 'Failed to fetch batch students');
  }
});

/**
 * POST /api/v2/batches/:id/students
 * Enroll a student in the batch (admin/batch_manager only)
 */
router.post('/:id/students', requireBatchAccess, async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);
    const { studentId } = req.body;

    if (!studentId) {
      return sendBadRequest(res, 'studentId is required');
    }

    const batch = await batchService.getById(batchId);
    if (!batch) {
      return sendNotFound(res, 'Batch');
    }

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    const enrollment = await batchService.enrollStudent(batchId, studentId);
    sendCreated(res, enrollment, 'Student enrolled successfully');
  } catch (error: unknown) {
    console.error('Error enrolling student:', error);
    const message = error instanceof Error ? error.message : 'Failed to enroll student';
    sendError(res, message);
  }
});

/**
 * DELETE /api/v2/batches/:id/students/:studentId
 * Remove student from batch (admin/batch_manager only)
 */
router.delete('/:id/students/:studentId', requireBatchAccess, async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);

    await batchService.removeStudent(batchId, studentId);
    sendSuccess(res, null, 'Student removed from batch');
  } catch (error: unknown) {
    console.error('Error removing student:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove student';
    sendError(res, message);
  }
});

/**
 * PUT /api/v2/batches/:id/students/:studentId/status
 * Update student enrollment status
 */
router.put('/:id/students/:studentId/status', requireBatchAccess, async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);
    const { status } = req.body;

    if (!status || !['active', 'dropped', 'completed'].includes(status)) {
      return sendBadRequest(res, 'Invalid status. Must be: active, dropped, or completed');
    }

    const enrollment = await batchService.updateEnrollmentStatus(batchId, studentId, status as EnrollmentStatus);
    sendSuccess(res, enrollment, 'Enrollment status updated');
  } catch (error) {
    console.error('Error updating enrollment:', error);
    sendError(res, 'Failed to update enrollment status');
  }
});

// ============================================
// TEACHER ASSIGNMENT
// ============================================

/**
 * GET /api/v2/batches/:id/teachers
 * Get teachers assigned to a batch
 */
router.get('/:id/teachers', async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);

    const batch = await batchService.getById(batchId);
    if (!batch) {
      return sendNotFound(res, 'Batch');
    }

    const teachers = await batchService.getTeachers(batchId);
    sendSuccess(res, teachers);
  } catch (error) {
    console.error('Error fetching batch teachers:', error);
    sendError(res, 'Failed to fetch batch teachers');
  }
});

/**
 * POST /api/v2/batches/:id/teachers
 * Assign a teacher to the batch (admin/batch_manager only)
 */
router.post('/:id/teachers', requireBatchAccess, async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);
    const { teacherId, subject, isPrimary = false } = req.body;

    if (!teacherId) {
      return sendBadRequest(res, 'teacherId is required');
    }

    const batch = await batchService.getById(batchId);
    if (!batch) {
      return sendNotFound(res, 'Batch');
    }

    const teacher = await teacherService.getById(teacherId);
    if (!teacher) {
      return sendNotFound(res, 'Teacher');
    }

    const assignment = await batchService.assignTeacher(batchId, teacherId, subject, isPrimary);
    sendCreated(res, assignment, 'Teacher assigned successfully');
  } catch (error: unknown) {
    console.error('Error assigning teacher:', error);
    const message = error instanceof Error ? error.message : 'Failed to assign teacher';
    sendError(res, message);
  }
});

/**
 * DELETE /api/v2/batches/:id/teachers/:teacherId
 * Remove teacher from batch (admin/batch_manager only)
 */
router.delete('/:id/teachers/:teacherId', requireBatchAccess, async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);
    const teacherId = getParam(req.params.teacherId);
    const subject = req.query.subject as string | undefined;

    await batchService.removeTeacher(batchId, teacherId, subject);
    sendSuccess(res, null, 'Teacher removed from batch');
  } catch (error: unknown) {
    console.error('Error removing teacher:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove teacher';
    sendError(res, message);
  }
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /api/v2/batches/:id/stats
 * Get batch statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);

    const batch = await batchService.getById(batchId);
    if (!batch) {
      return sendNotFound(res, 'Batch');
    }

    const stats = await batchService.getStats(batchId);
    sendSuccess(res, stats);
  } catch (error) {
    console.error('Error fetching batch stats:', error);
    sendError(res, 'Failed to fetch batch statistics');
  }
});

// ============================================
// BATCH-COURSE RELATIONSHIPS
// ============================================

/**
 * GET /api/v2/batches/:id/courses
 * Get courses assigned to a batch
 */
router.get('/:id/courses', async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);

    const batch = await batchService.getById(batchId);
    if (!batch) {
      return sendNotFound(res, 'Batch');
    }

    const courses = await courseService.getBatchCourses(batchId);
    sendSuccess(res, courses);
  } catch (error) {
    console.error('Error fetching batch courses:', error);
    sendError(res, 'Failed to fetch batch courses');
  }
});

/**
 * POST /api/v2/batches/:id/courses
 * Assign a course to the batch (admin/batch_manager only)
 */
router.post('/:id/courses', requireBatchAccess, async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);
    const { courseId, startDate, endDate } = req.body;

    if (!courseId) {
      return sendBadRequest(res, 'courseId is required');
    }

    const batch = await batchService.getById(batchId);
    if (!batch) {
      return sendNotFound(res, 'Batch');
    }

    const course = await courseService.getById(courseId);
    if (!course) {
      return sendNotFound(res, 'Course');
    }

    const assignment = await courseService.addCourseToBatch(batchId, courseId, startDate, endDate);
    sendCreated(res, assignment, 'Course assigned to batch successfully');
  } catch (error: unknown) {
    console.error('Error assigning course to batch:', error);
    const message = error instanceof Error ? error.message : 'Failed to assign course to batch';
    sendError(res, message);
  }
});

/**
 * DELETE /api/v2/batches/:id/courses/:courseId
 * Remove course from batch (admin/batch_manager only)
 */
router.delete('/:id/courses/:courseId', requireBatchAccess, async (req: Request, res: Response) => {
  try {
    const batchId = getParam(req.params.id);
    const courseId = getParam(req.params.courseId);

    await courseService.removeCourseFromBatch(batchId, courseId);
    sendSuccess(res, null, 'Course removed from batch');
  } catch (error: unknown) {
    console.error('Error removing course from batch:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove course from batch';
    sendError(res, message);
  }
});

export default router;
