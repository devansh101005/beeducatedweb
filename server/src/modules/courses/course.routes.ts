// Course Routes - /api/v2/courses
// Handles course and subject management

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireAdmin, requireTeacherOrAdmin } from '../../middleware/auth.js';
import { courseService, CourseStatus, CourseType, CourseLevel } from '../../services/courseService.js';
import { teacherService } from '../../services/teacherService.js';
import { studentService } from '../../services/studentService.js';
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

// ============================================
// SUBJECTS (Public read, admin write)
// ============================================

/**
 * GET /api/v2/courses/subjects
 * List all active subjects (public)
 */
router.get('/subjects', async (_req: Request, res: Response) => {
  try {
    const subjects = await courseService.getSubjects(true);
    sendSuccess(res, subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    sendError(res, 'Failed to fetch subjects');
  }
});

/**
 * GET /api/v2/courses/subjects/:id
 * Get subject by ID
 */
router.get('/subjects/:id', async (req: Request, res: Response) => {
  try {
    const subjectId = getParam(req.params.id);
    const subject = await courseService.getSubjectById(subjectId);

    if (!subject) {
      return sendNotFound(res, 'Subject');
    }

    sendSuccess(res, subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    sendError(res, 'Failed to fetch subject');
  }
});

/**
 * POST /api/v2/courses/subjects
 * Create subject (admin only)
 */
router.post('/subjects', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { code, name, description, targetExams, icon, color, displayOrder } = req.body;

    if (!code || !name) {
      return sendBadRequest(res, 'Code and name are required');
    }

    const subject = await courseService.createSubject({
      code,
      name,
      description,
      target_exams: targetExams,
      icon,
      color,
      display_order: displayOrder,
    });

    sendCreated(res, subject, 'Subject created successfully');
  } catch (error) {
    console.error('Error creating subject:', error);
    sendError(res, 'Failed to create subject');
  }
});

/**
 * PUT /api/v2/courses/subjects/:id
 * Update subject (admin only)
 */
router.put('/subjects/:id', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const subjectId = getParam(req.params.id);
    const { code, name, description, targetExams, icon, color, displayOrder, isActive } = req.body;

    const existing = await courseService.getSubjectById(subjectId);
    if (!existing) {
      return sendNotFound(res, 'Subject');
    }

    const subject = await courseService.updateSubject(subjectId, {
      code,
      name,
      description,
      target_exams: targetExams,
      icon,
      color,
      display_order: displayOrder,
      is_active: isActive,
    });

    sendSuccess(res, subject, 'Subject updated successfully');
  } catch (error) {
    console.error('Error updating subject:', error);
    sendError(res, 'Failed to update subject');
  }
});

// ============================================
// COURSES
// ============================================

/**
 * GET /api/v2/courses
 * List courses with filters
 * Published courses are public, drafts need auth
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as CourseStatus | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const targetExam = req.query.targetExam as string | undefined;
    const classGrade = req.query.classGrade as string | undefined;
    const courseType = req.query.courseType as CourseType | undefined;
    const teacherId = req.query.teacherId as string | undefined;
    const search = req.query.search as string | undefined;

    // For public access, only show published courses
    const effectiveStatus = status || 'published';

    const result = await courseService.list({
      page,
      limit,
      status: effectiveStatus,
      isActive: isActive ?? true,
      subjectId,
      targetExam,
      classGrade,
      courseType,
      teacherId,
      search,
    });

    sendPaginated(res, result.courses, result.total, page, limit);
  } catch (error) {
    console.error('Error listing courses:', error);
    sendError(res, 'Failed to list courses');
  }
});

/**
 * GET /api/v2/courses/all
 * List all courses including drafts (admin/teacher only)
 */
router.get('/all', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as CourseStatus | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const targetExam = req.query.targetExam as string | undefined;
    const classGrade = req.query.classGrade as string | undefined;
    const courseType = req.query.courseType as CourseType | undefined;
    const teacherId = req.query.teacherId as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await courseService.list({
      page,
      limit,
      status,
      isActive,
      subjectId,
      targetExam,
      classGrade,
      courseType,
      teacherId,
      search,
    });

    sendPaginated(res, result.courses, result.total, page, limit);
  } catch (error) {
    console.error('Error listing courses:', error);
    sendError(res, 'Failed to list courses');
  }
});

/**
 * GET /api/v2/courses/:id
 * Get course by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);
    const includeDetails = req.query.details === 'true';

    if (includeDetails) {
      const result = await courseService.getWithDetails(courseId);
      if (!result) {
        return sendNotFound(res, 'Course');
      }
      sendSuccess(res, result);
    } else {
      const course = await courseService.getById(courseId);
      if (!course) {
        return sendNotFound(res, 'Course');
      }
      sendSuccess(res, course);
    }
  } catch (error) {
    console.error('Error fetching course:', error);
    sendError(res, 'Failed to fetch course');
  }
});

/**
 * GET /api/v2/courses/slug/:slug
 * Get course by slug
 */
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const slug = getParam(req.params.slug);
    const course = await courseService.getBySlug(slug);

    if (!course) {
      return sendNotFound(res, 'Course');
    }

    sendSuccess(res, course);
  } catch (error) {
    console.error('Error fetching course:', error);
    sendError(res, 'Failed to fetch course');
  }
});

/**
 * POST /api/v2/courses
 * Create a new course (admin/teacher only)
 */
router.post('/', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      subjectId,
      targetExam,
      classGrade,
      level,
      durationWeeks,
      totalLectures,
      totalHours,
      price,
      discountPrice,
      courseType,
      teacherId,
      thumbnailUrl,
      previewVideoUrl,
      metadata,
    } = req.body;

    if (!name) {
      return sendBadRequest(res, 'Course name is required');
    }

    // If teacher ID provided, verify it exists
    if (teacherId) {
      const teacher = await teacherService.getById(teacherId);
      if (!teacher) {
        return sendNotFound(res, 'Teacher');
      }
    }

    const course = await courseService.create({
      name,
      description,
      subject_id: subjectId,
      target_exam: targetExam,
      class_grade: classGrade,
      level: level as CourseLevel,
      duration_weeks: durationWeeks,
      total_lectures: totalLectures,
      total_hours: totalHours,
      price,
      discount_price: discountPrice,
      course_type: courseType as CourseType,
      primary_teacher_id: teacherId,
      thumbnail_url: thumbnailUrl,
      preview_video_url: previewVideoUrl,
      metadata,
    });

    sendCreated(res, course, 'Course created successfully');
  } catch (error) {
    console.error('Error creating course:', error);
    sendError(res, 'Failed to create course');
  }
});

/**
 * PUT /api/v2/courses/:id
 * Update course (admin/teacher only)
 */
router.put('/:id', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);
    const {
      name,
      description,
      subjectId,
      targetExam,
      classGrade,
      level,
      durationWeeks,
      totalLectures,
      totalHours,
      price,
      discountPrice,
      courseType,
      status,
      isActive,
      teacherId,
      thumbnailUrl,
      previewVideoUrl,
      metadata,
    } = req.body;

    const existing = await courseService.getById(courseId);
    if (!existing) {
      return sendNotFound(res, 'Course');
    }

    const course = await courseService.update(courseId, {
      name,
      description,
      subject_id: subjectId,
      target_exam: targetExam,
      class_grade: classGrade,
      level: level as CourseLevel,
      duration_weeks: durationWeeks,
      total_lectures: totalLectures,
      total_hours: totalHours,
      price,
      discount_price: discountPrice,
      course_type: courseType as CourseType,
      status: status as CourseStatus,
      is_active: isActive,
      primary_teacher_id: teacherId,
      thumbnail_url: thumbnailUrl,
      preview_video_url: previewVideoUrl,
      metadata,
    });

    sendSuccess(res, course, 'Course updated successfully');
  } catch (error) {
    console.error('Error updating course:', error);
    sendError(res, 'Failed to update course');
  }
});

/**
 * POST /api/v2/courses/:id/publish
 * Publish course (admin/teacher only)
 */
router.post('/:id/publish', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);

    const existing = await courseService.getById(courseId);
    if (!existing) {
      return sendNotFound(res, 'Course');
    }

    const course = await courseService.publish(courseId);
    sendSuccess(res, course, 'Course published successfully');
  } catch (error) {
    console.error('Error publishing course:', error);
    sendError(res, 'Failed to publish course');
  }
});

/**
 * POST /api/v2/courses/:id/archive
 * Archive course (admin only)
 */
router.post('/:id/archive', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);

    const existing = await courseService.getById(courseId);
    if (!existing) {
      return sendNotFound(res, 'Course');
    }

    const course = await courseService.archive(courseId);
    sendSuccess(res, course, 'Course archived successfully');
  } catch (error) {
    console.error('Error archiving course:', error);
    sendError(res, 'Failed to archive course');
  }
});

// ============================================
// TOPICS
// ============================================

/**
 * GET /api/v2/courses/:id/topics
 * Get course topics
 */
router.get('/:id/topics', async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);

    const course = await courseService.getById(courseId);
    if (!course) {
      return sendNotFound(res, 'Course');
    }

    const topics = await courseService.getTopics(courseId);
    sendSuccess(res, topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    sendError(res, 'Failed to fetch topics');
  }
});

/**
 * POST /api/v2/courses/:id/topics
 * Create topic (admin/teacher only)
 */
router.post('/:id/topics', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);
    const { name, description, sequenceNumber, estimatedHours } = req.body;

    if (!name || sequenceNumber === undefined) {
      return sendBadRequest(res, 'Name and sequence number are required');
    }

    const course = await courseService.getById(courseId);
    if (!course) {
      return sendNotFound(res, 'Course');
    }

    const topic = await courseService.createTopic({
      course_id: courseId,
      name,
      description,
      sequence_number: sequenceNumber,
      estimated_hours: estimatedHours,
    });

    sendCreated(res, topic, 'Topic created successfully');
  } catch (error) {
    console.error('Error creating topic:', error);
    sendError(res, 'Failed to create topic');
  }
});

/**
 * PUT /api/v2/courses/:id/topics/:topicId
 * Update topic (admin/teacher only)
 */
router.put('/:id/topics/:topicId', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const topicId = getParam(req.params.topicId);
    const { name, description, sequenceNumber, estimatedHours, isActive } = req.body;

    const topic = await courseService.updateTopic(topicId, {
      name,
      description,
      sequence_number: sequenceNumber,
      estimated_hours: estimatedHours,
      is_active: isActive,
    });

    sendSuccess(res, topic, 'Topic updated successfully');
  } catch (error) {
    console.error('Error updating topic:', error);
    sendError(res, 'Failed to update topic');
  }
});

/**
 * DELETE /api/v2/courses/:id/topics/:topicId
 * Delete topic (admin/teacher only)
 */
router.delete('/:id/topics/:topicId', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const topicId = getParam(req.params.topicId);

    await courseService.deleteTopic(topicId);
    sendSuccess(res, null, 'Topic deleted successfully');
  } catch (error) {
    console.error('Error deleting topic:', error);
    sendError(res, 'Failed to delete topic');
  }
});

/**
 * POST /api/v2/courses/:id/topics/reorder
 * Reorder topics (admin/teacher only)
 */
router.post('/:id/topics/reorder', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);
    const { topicIds } = req.body;

    if (!topicIds || !Array.isArray(topicIds)) {
      return sendBadRequest(res, 'topicIds array is required');
    }

    await courseService.reorderTopics(courseId, topicIds);
    sendSuccess(res, null, 'Topics reordered successfully');
  } catch (error) {
    console.error('Error reordering topics:', error);
    sendError(res, 'Failed to reorder topics');
  }
});

// ============================================
// STUDENT ENROLLMENT
// ============================================

/**
 * GET /api/v2/courses/:id/students
 * Get students enrolled in a course (admin/teacher only)
 */
router.get('/:id/students', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);

    const course = await courseService.getById(courseId);
    if (!course) {
      return sendNotFound(res, 'Course');
    }

    const students = await courseService.getCourseStudents(courseId);
    sendSuccess(res, students);
  } catch (error) {
    console.error('Error fetching course students:', error);
    sendError(res, 'Failed to fetch course students');
  }
});

/**
 * POST /api/v2/courses/:id/students
 * Enroll a student in the course (admin/teacher only)
 */
router.post('/:id/students', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);
    const { studentId, expiresAt, paymentId } = req.body;

    if (!studentId) {
      return sendBadRequest(res, 'studentId is required');
    }

    const course = await courseService.getById(courseId);
    if (!course) {
      return sendNotFound(res, 'Course');
    }

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    const enrollment = await courseService.enrollStudent(studentId, courseId, expiresAt, paymentId);
    sendCreated(res, enrollment, 'Student enrolled in course successfully');
  } catch (error: unknown) {
    console.error('Error enrolling student in course:', error);
    const message = error instanceof Error ? error.message : 'Failed to enroll student';
    sendError(res, message);
  }
});

/**
 * PUT /api/v2/courses/:id/students/:studentId/progress
 * Update student progress in course
 */
router.put('/:id/students/:studentId/progress', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);
    const { progressPercent, lastAccessedAt, completedAt, status } = req.body;

    // Allow students to update their own progress, or admin/teacher for anyone
    const isOwnProgress = req.user?.role === 'student';
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (!isOwnProgress && !isAdminOrTeacher) {
      return sendBadRequest(res, 'Not authorized to update this progress');
    }

    const enrollment = await courseService.updateProgress(studentId, courseId, {
      progress_percent: progressPercent,
      last_accessed_at: lastAccessedAt,
      completed_at: completedAt,
      status,
    });

    sendSuccess(res, enrollment, 'Progress updated successfully');
  } catch (error) {
    console.error('Error updating progress:', error);
    sendError(res, 'Failed to update progress');
  }
});

/**
 * DELETE /api/v2/courses/:id/students/:studentId
 * Unenroll student from course (admin only)
 */
router.delete('/:id/students/:studentId', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);

    await courseService.unenrollStudent(studentId, courseId);
    sendSuccess(res, null, 'Student unenrolled from course');
  } catch (error: unknown) {
    console.error('Error unenrolling student:', error);
    const message = error instanceof Error ? error.message : 'Failed to unenroll student';
    sendError(res, message);
  }
});

export default router;
