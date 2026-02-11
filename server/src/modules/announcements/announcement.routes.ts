// Announcement Routes - /api/v2/announcements
// Handles announcement management and delivery

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, attachUser, requireTeacherOrAdmin, requireAdmin } from '../../middleware/auth.js';
import { announcementService, AnnouncementPriority, AnnouncementTarget, UserRole } from '../../services/announcementService.js';
import { storageService, BUCKETS } from '../../services/storageService.js';
import { batchService } from '../../services/batchService.js';
import { courseService } from '../../services/courseService.js';
import { courseTypeService } from '../../services/courseTypeService.js';
import { studentService } from '../../services/studentService.js';
import { enrollmentService } from '../../services/enrollmentService.js';
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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max for attachments
  },
});

const router = Router();

// ============================================
// ADMIN/TEACHER ENDPOINTS (must be before /:id routes)
// ============================================

/**
 * GET /api/v2/announcements/admin/targeting-options
 * Get academic classes for announcement targeting dropdowns
 */
router.get('/admin/targeting-options', requireAuth, attachUser, requireTeacherOrAdmin, async (_req: Request, res: Response) => {
  try {
    const classes = await courseTypeService.getClassesWithFeePlans();

    sendSuccess(res, {
      classes: (classes || []).map((c) => ({ id: c.id, name: c.name })),
    });
  } catch (error) {
    console.error('Error fetching targeting options:', error);
    sendError(res, 'Failed to fetch targeting options');
  }
});

/**
 * GET /api/v2/announcements/admin/list
 * List all announcements for admin (includes unpublished)
 */
router.get('/admin/list', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const targetType = req.query.targetType as AnnouncementTarget | undefined;
    const batchId = req.query.batchId as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    const priority = req.query.priority as AnnouncementPriority | undefined;
    const isPublished = req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined;
    const isPinned = req.query.isPinned === 'true' ? true : undefined;
    const search = req.query.search as string | undefined;

    const result = await announcementService.list({
      page,
      limit,
      targetType,
      batchId,
      courseId,
      priority,
      isPublished,
      isPinned,
      excludeExpired: false, // Admins can see expired
      search,
    });

    sendPaginated(res, result.announcements, result.total, page, limit);
  } catch (error) {
    console.error('Error listing announcements:', error);
    sendError(res, 'Failed to list announcements');
  }
});

// ============================================
// USER-FACING ENDPOINTS
// ============================================

/**
 * GET /api/v2/announcements
 * Get announcements for current user
 */
router.get('/', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const userId = req.user!.id;
    const userRole = req.user!.role as UserRole;

    // Get user's batch, course, and class enrollments for targeting
    let batchIds: string[] = [];
    let courseIds: string[] = [];
    let classIds: string[] = [];

    if (userRole === 'student') {
      const student = await studentService.getByUserId(userId);
      if (student) {
        // Get batch enrollments
        const batches = await batchService.getStudentBatches(student.id);
        batchIds = batches.map((b) => b.batch.id);

        // Get course enrollments
        const courses = await courseService.getStudentCourses(student.id);
        courseIds = courses.map((c) => c.enrollment.course_id);

        // Get class enrollments
        classIds = await enrollmentService.getStudentActiveClassIds(student.id);
      }
    }

    const result = await announcementService.getForUser(userId, userRole, {
      page,
      limit,
      batchIds,
      courseIds,
      classIds,
      unreadOnly,
    });

    sendPaginated(res, result.announcements, result.total, page, limit);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    sendError(res, 'Failed to fetch announcements');
  }
});

/**
 * GET /api/v2/announcements/unread-count
 * Get unread announcement count for current user
 */
router.get('/unread-count', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role as UserRole;

    // Get user's batch, course, and class enrollments
    let batchIds: string[] = [];
    let courseIds: string[] = [];
    let classIds: string[] = [];

    if (userRole === 'student') {
      const student = await studentService.getByUserId(userId);
      if (student) {
        const batches = await batchService.getStudentBatches(student.id);
        batchIds = batches.map((b) => b.batch.id);

        const courses = await courseService.getStudentCourses(student.id);
        courseIds = courses.map((c) => c.enrollment.course_id);

        classIds = await enrollmentService.getStudentActiveClassIds(student.id);
      }
    }

    const count = await announcementService.getUnreadCount(userId, userRole, batchIds, courseIds, classIds);
    sendSuccess(res, { count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    sendError(res, 'Failed to get unread count');
  }
});

/**
 * GET /api/v2/announcements/:id
 * Get announcement by ID
 */
router.get('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const announcementId = getParam(req.params.id);

    const announcement = await announcementService.getById(announcementId);
    if (!announcement) {
      return sendNotFound(res, 'Announcement');
    }

    // Check if user can access this announcement
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (!announcement.is_published && !isAdminOrTeacher) {
      return sendNotFound(res, 'Announcement');
    }

    // Get read status for this user
    const readStatus = await announcementService.getReadStatus([announcementId], req.user!.id);

    sendSuccess(res, {
      ...announcement,
      is_read: readStatus[announcementId] || false,
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    sendError(res, 'Failed to fetch announcement');
  }
});

/**
 * POST /api/v2/announcements/:id/read
 * Mark announcement as read
 */
router.post('/:id/read', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const announcementId = getParam(req.params.id);

    const announcement = await announcementService.getById(announcementId);
    if (!announcement) {
      return sendNotFound(res, 'Announcement');
    }

    await announcementService.markAsRead(announcementId, req.user!.id);
    sendSuccess(res, null, 'Marked as read');
  } catch (error) {
    console.error('Error marking as read:', error);
    sendError(res, 'Failed to mark as read');
  }
});

/**
 * POST /api/v2/announcements/mark-all-read
 * Mark all announcements as read
 */
router.post('/mark-all-read', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const { announcementIds } = req.body;

    if (!announcementIds || !Array.isArray(announcementIds)) {
      return sendBadRequest(res, 'announcementIds array is required');
    }

    await announcementService.markMultipleAsRead(announcementIds, req.user!.id);
    sendSuccess(res, null, 'All marked as read');
  } catch (error) {
    console.error('Error marking all as read:', error);
    sendError(res, 'Failed to mark all as read');
  }
});

/**
 * POST /api/v2/announcements
 * Create new announcement (admin/teacher only)
 */
router.post('/', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      body,
      targetType,
      targetBatchId,
      targetCourseId,
      targetClassId,
      targetRoles,
      priority,
      isPinned,
      publishAt,
      expiresAt,
      isPublished,
    } = req.body;

    if (!title) {
      return sendBadRequest(res, 'title is required');
    }

    if (!body) {
      return sendBadRequest(res, 'body is required');
    }

    // Validate targeting
    if (targetType === 'batch' && !targetBatchId) {
      return sendBadRequest(res, 'targetBatchId is required for batch targeting');
    }

    if (targetType === 'course' && !targetCourseId) {
      return sendBadRequest(res, 'targetCourseId is required for course targeting');
    }

    if (targetType === 'class' && !targetClassId) {
      return sendBadRequest(res, 'targetClassId is required for class targeting');
    }

    if (targetType === 'role' && (!targetRoles || targetRoles.length === 0)) {
      return sendBadRequest(res, 'targetRoles is required for role targeting');
    }

    // Validate class exists if provided
    if (targetClassId) {
      const classData = await courseTypeService.getClassById(targetClassId);
      if (!classData) {
        return sendNotFound(res, 'Class');
      }
    }

    // Validate batch exists if provided
    if (targetBatchId) {
      const batch = await batchService.getById(targetBatchId);
      if (!batch) {
        return sendNotFound(res, 'Batch');
      }
    }

    // Validate course exists if provided
    if (targetCourseId) {
      const course = await courseService.getById(targetCourseId);
      if (!course) {
        return sendNotFound(res, 'Course');
      }
    }

    const announcement = await announcementService.create({
      title,
      body,
      target_type: targetType || 'all',
      target_batch_id: targetType === 'batch' ? targetBatchId : null,
      target_course_id: targetType === 'course' ? targetCourseId : null,
      target_class_id: targetType === 'class' ? targetClassId : null,
      target_roles: targetType === 'role' ? targetRoles : null,
      priority: priority || 'normal',
      is_pinned: isPinned || false,
      publish_at: publishAt,
      expires_at: expiresAt,
      is_published: isPublished !== false, // Default to published
      created_by: req.user?.id,
    });

    sendCreated(res, announcement, 'Announcement created successfully');
  } catch (error) {
    console.error('Error creating announcement:', error);
    sendError(res, 'Failed to create announcement');
  }
});

/**
 * PUT /api/v2/announcements/:id
 * Update announcement (admin/teacher only)
 */
router.put('/:id', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const announcementId = getParam(req.params.id);
    const {
      title,
      body,
      targetType,
      targetBatchId,
      targetCourseId,
      targetClassId,
      targetRoles,
      priority,
      isPinned,
      publishAt,
      expiresAt,
      isPublished,
    } = req.body;

    const existingAnnouncement = await announcementService.getById(announcementId);
    if (!existingAnnouncement) {
      return sendNotFound(res, 'Announcement');
    }

    const announcement = await announcementService.update(announcementId, {
      title,
      body,
      target_type: targetType,
      target_batch_id: targetType === 'batch' ? targetBatchId : null,
      target_course_id: targetType === 'course' ? targetCourseId : null,
      target_class_id: targetType === 'class' ? targetClassId : null,
      target_roles: targetType === 'role' ? targetRoles : null,
      priority,
      is_pinned: isPinned,
      publish_at: publishAt,
      expires_at: expiresAt,
      is_published: isPublished,
      updated_by: req.user?.id,
    });

    sendSuccess(res, announcement, 'Announcement updated successfully');
  } catch (error) {
    console.error('Error updating announcement:', error);
    sendError(res, 'Failed to update announcement');
  }
});

/**
 * DELETE /api/v2/announcements/:id
 * Delete announcement (admin only)
 */
router.delete('/:id', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const announcementId = getParam(req.params.id);

    const announcement = await announcementService.getById(announcementId);
    if (!announcement) {
      return sendNotFound(res, 'Announcement');
    }

    await announcementService.delete(announcementId);
    sendSuccess(res, null, 'Announcement deleted successfully');
  } catch (error) {
    console.error('Error deleting announcement:', error);
    sendError(res, 'Failed to delete announcement');
  }
});

// ============================================
// ANNOUNCEMENT ACTIONS
// ============================================

/**
 * POST /api/v2/announcements/:id/publish
 * Publish announcement (admin/teacher only)
 */
router.post('/:id/publish', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const announcementId = getParam(req.params.id);

    const announcement = await announcementService.getById(announcementId);
    if (!announcement) {
      return sendNotFound(res, 'Announcement');
    }

    const updatedAnnouncement = await announcementService.publish(announcementId);
    sendSuccess(res, updatedAnnouncement, 'Announcement published');
  } catch (error) {
    console.error('Error publishing announcement:', error);
    sendError(res, 'Failed to publish announcement');
  }
});

/**
 * POST /api/v2/announcements/:id/unpublish
 * Unpublish announcement (admin/teacher only)
 */
router.post('/:id/unpublish', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const announcementId = getParam(req.params.id);

    const announcement = await announcementService.getById(announcementId);
    if (!announcement) {
      return sendNotFound(res, 'Announcement');
    }

    const updatedAnnouncement = await announcementService.unpublish(announcementId);
    sendSuccess(res, updatedAnnouncement, 'Announcement unpublished');
  } catch (error) {
    console.error('Error unpublishing announcement:', error);
    sendError(res, 'Failed to unpublish announcement');
  }
});

/**
 * POST /api/v2/announcements/:id/pin
 * Pin/unpin announcement (admin/teacher only)
 */
router.post('/:id/pin', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const announcementId = getParam(req.params.id);
    const { isPinned } = req.body;

    const announcement = await announcementService.getById(announcementId);
    if (!announcement) {
      return sendNotFound(res, 'Announcement');
    }

    const updatedAnnouncement = await announcementService.togglePin(
      announcementId,
      isPinned !== undefined ? isPinned : !announcement.is_pinned
    );

    sendSuccess(res, updatedAnnouncement, updatedAnnouncement.is_pinned ? 'Announcement pinned' : 'Announcement unpinned');
  } catch (error) {
    console.error('Error toggling pin:', error);
    sendError(res, 'Failed to toggle pin');
  }
});

/**
 * POST /api/v2/announcements/:id/schedule
 * Schedule announcement for future publish (admin/teacher only)
 */
router.post('/:id/schedule', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const announcementId = getParam(req.params.id);
    const { publishAt } = req.body;

    if (!publishAt) {
      return sendBadRequest(res, 'publishAt is required');
    }

    const announcement = await announcementService.getById(announcementId);
    if (!announcement) {
      return sendNotFound(res, 'Announcement');
    }

    const updatedAnnouncement = await announcementService.schedule(announcementId, publishAt);
    sendSuccess(res, updatedAnnouncement, 'Announcement scheduled');
  } catch (error) {
    console.error('Error scheduling announcement:', error);
    sendError(res, 'Failed to schedule announcement');
  }
});

// ============================================
// ATTACHMENTS
// ============================================

/**
 * POST /api/v2/announcements/:id/attachments
 * Upload attachment to announcement (admin/teacher only)
 */
router.post(
  '/:id/attachments',
  requireAuth,
  attachUser,
  requireTeacherOrAdmin,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const announcementId = getParam(req.params.id);

      if (!req.file) {
        return sendBadRequest(res, 'No file uploaded');
      }

      const announcement = await announcementService.getById(announcementId);
      if (!announcement) {
        return sendNotFound(res, 'Announcement');
      }

      // Generate storage path
      const storagePath = storageService.generatePath({
        folder: `announcements/${announcementId}`,
        fileName: req.file.originalname,
      });

      // Upload to Supabase Storage
      const uploadResult = await storageService.upload({
        bucket: BUCKETS.ANNOUNCEMENTS,
        path: storagePath,
        file: req.file.buffer,
        contentType: req.file.mimetype,
      });

      // Add attachment to announcement
      const updatedAnnouncement = await announcementService.addAttachment(announcementId, {
        name: req.file.originalname,
        path: uploadResult.path,
        size: uploadResult.size,
        type: req.file.mimetype,
      });

      sendSuccess(res, updatedAnnouncement, 'Attachment uploaded');
    } catch (error) {
      console.error('Error uploading attachment:', error);
      sendError(res, 'Failed to upload attachment');
    }
  }
);

/**
 * DELETE /api/v2/announcements/:id/attachments
 * Remove attachment from announcement (admin/teacher only)
 */
router.delete('/:id/attachments', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const announcementId = getParam(req.params.id);
    const { path } = req.body;

    if (!path) {
      return sendBadRequest(res, 'path is required');
    }

    const announcement = await announcementService.getById(announcementId);
    if (!announcement) {
      return sendNotFound(res, 'Announcement');
    }

    const updatedAnnouncement = await announcementService.removeAttachment(announcementId, path);
    sendSuccess(res, updatedAnnouncement, 'Attachment removed');
  } catch (error) {
    console.error('Error removing attachment:', error);
    sendError(res, 'Failed to remove attachment');
  }
});

/**
 * GET /api/v2/announcements/:id/attachments/:attachmentIndex/url
 * Get signed URL for attachment download
 */
router.get('/:id/attachments/:attachmentIndex/url', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const announcementId = getParam(req.params.id);
    const attachmentIndex = parseInt(getParam(req.params.attachmentIndex));

    const announcement = await announcementService.getById(announcementId);
    if (!announcement) {
      return sendNotFound(res, 'Announcement');
    }

    if (!announcement.attachments || !announcement.attachments[attachmentIndex]) {
      return sendNotFound(res, 'Attachment');
    }

    const attachment = announcement.attachments[attachmentIndex];

    const url = await storageService.getSignedUrl({
      bucket: BUCKETS.ANNOUNCEMENTS,
      path: attachment.path,
      expiresIn: 3600,
      download: true,
      fileName: attachment.name,
    });

    sendSuccess(res, { url, fileName: attachment.name });
  } catch (error) {
    console.error('Error getting attachment URL:', error);
    sendError(res, 'Failed to get attachment URL');
  }
});

export default router;
