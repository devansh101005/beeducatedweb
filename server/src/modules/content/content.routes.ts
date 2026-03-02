// Content Routes - /api/v2/content
// Handles course content and file management operations

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, attachUser, optionalAuth, requireTeacherOrAdmin, requireAdmin } from '../../middleware/auth.js';
import { contentService, ContentType, MaterialType } from '../../services/contentService.js';
import { getSupabase } from '../../config/supabase.js';
import { storageService, BUCKETS } from '../../services/storageService.js';
import { courseService } from '../../services/courseService.js';
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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

const router = Router();

// ============================================
// CONTENT CRUD
// ============================================

/**
 * GET /api/v2/content
 * List content with filters
 */
router.get('/', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const courseId = req.query.courseId as string | undefined;
    const topicId = req.query.topicId as string | undefined;
    const batchId = req.query.batchId as string | undefined;
    // New hierarchy filters
    const classId = req.query.classId as string | undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const materialType = req.query.materialType as MaterialType | undefined;
    // Other filters
    const contentType = req.query.contentType as ContentType | undefined;
    const isPublished = req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined;
    const isFree = req.query.isFree === 'true' ? true : req.query.isFree === 'false' ? false : undefined;
    const search = req.query.search as string | undefined;

    // For non-admin users, only show published content
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';
    const effectivePublished = isAdminOrTeacher ? isPublished : true;

    // Use listWithHierarchy for admin/teacher to get class/subject names
    if (isAdminOrTeacher) {
      const result = await contentService.listWithHierarchy({
        page,
        limit,
        classId,
        subjectId,
        materialType,
        contentType,
        isPublished: effectivePublished,
        search,
      });
      sendPaginated(res, result.content, result.total, page, limit);
    } else {
      const result = await contentService.list({
        page,
        limit,
        courseId,
        topicId,
        batchId,
        classId,
        subjectId,
        materialType,
        contentType,
        isPublished: effectivePublished,
        isFree,
        search,
      });
      sendPaginated(res, result.content, result.total, page, limit);
    }
  } catch (error) {
    console.error('Error listing content:', error);
    sendError(res, 'Failed to list content');
  }
});

/**
 * GET /api/v2/content/browse
 * Browse all published content for a class (with hierarchy info)
 * Returns both free and paid content - frontend shows lock on paid items
 * Optionally authenticated: works for public users (no token) and signed-in users
 * Free content includes signed file URLs; paid content metadata only
 */
router.get('/browse', optionalAuth, async (req: Request, res: Response) => {
  try {
    const classId = req.query.classId as string;
    const subjectId = req.query.subjectId as string | undefined;
    const materialType = req.query.materialType as MaterialType | undefined;

    if (!classId) {
      return sendBadRequest(res, 'classId is required');
    }

    const result = await contentService.listWithHierarchy({
      classId,
      subjectId,
      materialType,
      isPublished: true,
      page: 1,
      limit: 200,
    });

    // Check if user is enrolled in this class
    let isEnrolled = false;
    if (req.user?.role === 'student') {
      const student = await studentService.getByUserId(req.user.id);
      if (student) {
        const { data: enrollment } = await getSupabase()
          .from('class_enrollments')
          .select('id')
          .eq('student_id', student.id)
          .eq('class_id', classId)
          .eq('status', 'active')
          .limit(1);
        isEnrolled = !!(enrollment && enrollment.length > 0);
      }
    } else if (req.user?.role === 'admin' || req.user?.role === 'teacher') {
      isEnrolled = true;
    }

    // Generate signed file URLs for free content (or all content if enrolled/admin)
    const contentWithUrls = await Promise.all(
      result.content.map(async (item: any) => {
        if ((item.is_free || isEnrolled) && item.file_path) {
          try {
            const { url } = await contentService.getAccessUrl(item.id);
            return { ...item, file_url: url };
          } catch {
            return item;
          }
        }
        return item;
      })
    );

    sendSuccess(res, {
      content: contentWithUrls,
      total: result.total,
      isEnrolled,
    });
  } catch (error) {
    console.error('Error browsing content:', error);
    sendError(res, 'Failed to browse content');
  }
});

/**
 * GET /api/v2/content/stats
 * Get content statistics (admin/teacher only)
 * MUST be before /:id route
 */
router.get('/stats', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    // Optional filters
    const courseTypeId = req.query.courseTypeId as string | undefined;
    const classId = req.query.classId as string | undefined;

    const stats = await contentService.getStats({ courseTypeId, classId });
    sendSuccess(res, stats);
  } catch (error) {
    console.error('Error fetching content stats:', error);
    sendError(res, 'Failed to fetch content stats');
  }
});

/**
 * GET /api/v2/content/:id
 * Get content by ID
 */
router.get('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);

    const content = await contentService.getById(contentId);
    if (!content) {
      return sendNotFound(res, 'Content');
    }

    // Check access permissions
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (!content.is_published && !isAdminOrTeacher) {
      return sendNotFound(res, 'Content');
    }

    // For paid content, check enrollment (unless free or admin/teacher)
    if (!content.is_free && !isAdminOrTeacher && content.course_id) {
      const student = await studentService.getByUserId(req.user!.id);
      if (student) {
        // Check if enrolled in course
        const courses = await courseService.getStudentCourses(student.id);
        const isEnrolled = courses.some((c) => c.enrollment.course_id === content.course_id);
        if (!isEnrolled) {
          return sendBadRequest(res, 'Not enrolled in this course');
        }
      } else {
        return sendBadRequest(res, 'Not authorized to view this content');
      }
    }

    sendSuccess(res, content);
  } catch (error) {
    console.error('Error fetching content:', error);
    sendError(res, 'Failed to fetch content');
  }
});

/**
 * POST /api/v2/content
 * Create new content (admin/teacher only)
 */
router.post('/', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const {
      courseId,
      topicId,
      batchId,
      // New hierarchy fields
      classId,
      subjectId,
      materialType,
      // Basic info
      title,
      description,
      contentType,
      filePath,
      fileName,
      fileSize,
      mimeType,
      durationSeconds,
      thumbnailPath,
      sequenceOrder,
      isFree,
      isDownloadable,
      isPublished,
      tags,
      metadata,
    } = req.body;

    if (!title) {
      return sendBadRequest(res, 'title is required');
    }

    if (!contentType) {
      return sendBadRequest(res, 'contentType is required');
    }

    // Note: filePath is optional here because the file is uploaded separately via POST /:id/upload
    // The file_path will be set when the file upload completes

    // Validate course exists if provided
    if (courseId) {
      const course = await courseService.getById(courseId);
      if (!course) {
        return sendNotFound(res, 'Course');
      }
    }

    const content = await contentService.create({
      course_id: courseId,
      topic_id: topicId,
      batch_id: batchId,
      // New hierarchy fields
      class_id: classId,
      subject_id: subjectId,
      material_type: materialType,
      // Basic info
      title,
      description,
      content_type: contentType,
      file_path: filePath || '',
      file_name: fileName,
      file_size: fileSize,
      mime_type: mimeType,
      duration_seconds: durationSeconds,
      thumbnail_path: thumbnailPath,
      sequence_order: sequenceOrder || 0,
      is_free: isFree || false,
      is_downloadable: isDownloadable || false,
      is_published: isPublished || false,
      tags,
      metadata,
      created_by: req.user?.id,
    });

    sendCreated(res, content, 'Content created successfully');
  } catch (error) {
    console.error('Error creating content:', error);
    sendError(res, 'Failed to create content');
  }
});

/**
 * PUT /api/v2/content/:id
 * Update content (admin/teacher only)
 */
router.put('/:id', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);
    const {
      title,
      description,
      // New hierarchy fields
      classId,
      subjectId,
      materialType,
      // File info
      filePath,
      fileName,
      fileSize,
      mimeType,
      durationSeconds,
      thumbnailPath,
      sequenceOrder,
      isFree,
      isDownloadable,
      isPublished,
      tags,
      metadata,
    } = req.body;

    const existingContent = await contentService.getById(contentId);
    if (!existingContent) {
      return sendNotFound(res, 'Content');
    }

    const content = await contentService.update(contentId, {
      title,
      description,
      // New hierarchy fields
      class_id: classId,
      subject_id: subjectId,
      material_type: materialType,
      // File info
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      mime_type: mimeType,
      duration_seconds: durationSeconds,
      thumbnail_path: thumbnailPath,
      sequence_order: sequenceOrder,
      is_free: isFree,
      is_downloadable: isDownloadable,
      is_published: isPublished,
      tags,
      metadata,
      updated_by: req.user?.id,
    });

    sendSuccess(res, content, 'Content updated successfully');
  } catch (error) {
    console.error('Error updating content:', error);
    sendError(res, 'Failed to update content');
  }
});

/**
 * DELETE /api/v2/content/:id
 * Delete content (admin only)
 */
router.delete('/:id', requireAuth, attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);

    const content = await contentService.getById(contentId);
    if (!content) {
      return sendNotFound(res, 'Content');
    }

    await contentService.delete(contentId);
    sendSuccess(res, null, 'Content deleted successfully');
  } catch (error) {
    console.error('Error deleting content:', error);
    sendError(res, 'Failed to delete content');
  }
});

// ============================================
// FILE UPLOAD
// ============================================

/**
 * POST /api/v2/content/:id/upload
 * Upload file for content (admin/teacher only)
 */
router.post(
  '/:id/upload',
  requireAuth,
  attachUser,
  requireTeacherOrAdmin,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const contentId = getParam(req.params.id);

      if (!req.file) {
        return sendBadRequest(res, 'No file uploaded');
      }

      const content = await contentService.getById(contentId);
      if (!content) {
        return sendNotFound(res, 'Content');
      }

      // Generate storage path
      const folder = content.course_id
        ? `courses/${content.course_id}`
        : content.batch_id
          ? `batches/${content.batch_id}`
          : 'general';

      const storagePath = storageService.generatePath({
        folder,
        fileName: req.file.originalname,
      });

      // Upload to Supabase Storage
      const uploadResult = await storageService.upload({
        bucket: BUCKETS.COURSE_CONTENT,
        path: storagePath,
        file: req.file.buffer,
        contentType: req.file.mimetype,
      });

      // Update content record
      const updatedContent = await contentService.update(contentId, {
        file_path: uploadResult.path,
        file_name: req.file.originalname,
        file_size: uploadResult.size,
        mime_type: req.file.mimetype,
        updated_by: req.user?.id,
      });

      sendSuccess(res, updatedContent, 'File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      sendError(res, 'Failed to upload file');
    }
  }
);

/**
 * POST /api/v2/content/:id/thumbnail
 * Upload thumbnail for content (admin/teacher only)
 */
router.post(
  '/:id/thumbnail',
  requireAuth,
  attachUser,
  requireTeacherOrAdmin,
  upload.single('thumbnail'),
  async (req: Request, res: Response) => {
    try {
      const contentId = getParam(req.params.id);

      if (!req.file) {
        return sendBadRequest(res, 'No thumbnail uploaded');
      }

      const content = await contentService.getById(contentId);
      if (!content) {
        return sendNotFound(res, 'Content');
      }

      // Generate thumbnail path
      const storagePath = storageService.generatePath({
        folder: `content/${contentId}`,
        fileName: req.file.originalname,
      });

      // Upload to thumbnails bucket (public)
      const uploadResult = await storageService.upload({
        bucket: BUCKETS.THUMBNAILS,
        path: storagePath,
        file: req.file.buffer,
        contentType: req.file.mimetype,
      });

      // Update content record
      const updatedContent = await contentService.update(contentId, {
        thumbnail_path: uploadResult.path,
        updated_by: req.user?.id,
      });

      sendSuccess(res, updatedContent, 'Thumbnail uploaded successfully');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      sendError(res, 'Failed to upload thumbnail');
    }
  }
);

/**
 * GET /api/v2/content/:id/signed-url
 * Get signed URL for content access
 */
router.get('/:id/signed-url', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);
    const download = req.query.download === 'true';

    const content = await contentService.getById(contentId);
    if (!content) {
      return sendNotFound(res, 'Content');
    }

    // Check access permissions
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (!content.is_published && !isAdminOrTeacher) {
      return sendNotFound(res, 'Content');
    }

    // For paid content, check enrollment
    if (!content.is_free && !isAdminOrTeacher && content.course_id) {
      const student = await studentService.getByUserId(req.user!.id);
      if (student) {
        const courses = await courseService.getStudentCourses(student.id);
        const isEnrolled = courses.some((c) => c.enrollment.course_id === content.course_id);
        if (!isEnrolled) {
          return sendBadRequest(res, 'Not enrolled in this course');
        }
      } else {
        return sendBadRequest(res, 'Not authorized to access this content');
      }
    }

    // Check if downloadable
    if (download && !content.is_downloadable && !isAdminOrTeacher) {
      return sendBadRequest(res, 'This content is not downloadable');
    }

    // Get student ID for progress tracking
    let studentId: string | undefined;
    if (req.user?.role === 'student') {
      const student = await studentService.getByUserId(req.user.id);
      studentId = student?.id;
    }

    const result = await contentService.getAccessUrl(contentId, studentId, download);

    sendSuccess(res, result);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    sendError(res, 'Failed to generate access URL');
  }
});

// ============================================
// CONTENT PROGRESS
// ============================================

/**
 * GET /api/v2/content/:id/progress
 * Get current user's progress for content
 */
router.get('/:id/progress', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);

    const content = await contentService.getById(contentId);
    if (!content) {
      return sendNotFound(res, 'Content');
    }

    // Get student
    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const progress = await contentService.getProgress(contentId, student.id);
    sendSuccess(res, progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    sendError(res, 'Failed to fetch progress');
  }
});

/**
 * PUT /api/v2/content/:id/progress
 * Update content progress (student only)
 */
router.put('/:id/progress', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);
    const { progressSeconds, progressPercent, lastPositionSeconds, completed, note } = req.body;

    const content = await contentService.getById(contentId);
    if (!content) {
      return sendNotFound(res, 'Content');
    }

    // Get student
    const student = await studentService.getByUserId(req.user!.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    const progress = await contentService.updateProgress(contentId, student.id, {
      progress_seconds: progressSeconds,
      progress_percent: progressPercent,
      last_position_seconds: lastPositionSeconds,
      completed,
      note,
    });

    sendSuccess(res, progress, 'Progress updated');
  } catch (error) {
    console.error('Error updating progress:', error);
    sendError(res, 'Failed to update progress');
  }
});

// ============================================
// COURSE CONTENT
// ============================================

/**
 * GET /api/v2/content/course/:courseId
 * Get all content for a course with progress
 */
router.get('/course/:courseId', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const courseId = getParam(req.params.courseId);

    const course = await courseService.getById(courseId);
    if (!course) {
      return sendNotFound(res, 'Course');
    }

    // Get student for progress
    let studentId: string | undefined;
    if (req.user?.role === 'student') {
      const student = await studentService.getByUserId(req.user.id);
      studentId = student?.id;
    }

    if (studentId) {
      const contentWithProgress = await contentService.getCourseProgress(courseId, studentId);
      sendSuccess(res, contentWithProgress);
    } else {
      const content = await contentService.getByCourse(courseId);
      sendSuccess(res, content);
    }
  } catch (error) {
    console.error('Error fetching course content:', error);
    sendError(res, 'Failed to fetch course content');
  }
});

// ============================================
// CONTENT ACTIONS
// ============================================

/**
 * POST /api/v2/content/:id/publish
 * Publish content (admin/teacher only)
 */
router.post('/:id/publish', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);

    const content = await contentService.getById(contentId);
    if (!content) {
      return sendNotFound(res, 'Content');
    }

    const updatedContent = await contentService.publish(contentId);
    sendSuccess(res, updatedContent, 'Content published');
  } catch (error) {
    console.error('Error publishing content:', error);
    sendError(res, 'Failed to publish content');
  }
});

/**
 * POST /api/v2/content/:id/unpublish
 * Unpublish content (admin/teacher only)
 */
router.post('/:id/unpublish', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);

    const content = await contentService.getById(contentId);
    if (!content) {
      return sendNotFound(res, 'Content');
    }

    const updatedContent = await contentService.unpublish(contentId);
    sendSuccess(res, updatedContent, 'Content unpublished');
  } catch (error) {
    console.error('Error unpublishing content:', error);
    sendError(res, 'Failed to unpublish content');
  }
});

/**
 * POST /api/v2/content/:id/duplicate
 * Duplicate content (admin/teacher only)
 */
router.post('/:id/duplicate', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);
    const { newCourseId } = req.body;

    const content = await contentService.getById(contentId);
    if (!content) {
      return sendNotFound(res, 'Content');
    }

    const duplicatedContent = await contentService.duplicate(contentId, newCourseId);
    sendCreated(res, duplicatedContent, 'Content duplicated successfully');
  } catch (error) {
    console.error('Error duplicating content:', error);
    sendError(res, 'Failed to duplicate content');
  }
});

/**
 * PUT /api/v2/content/reorder
 * Reorder content (admin/teacher only)
 */
router.put('/reorder', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const { contentIds } = req.body;

    if (!contentIds || !Array.isArray(contentIds)) {
      return sendBadRequest(res, 'contentIds array is required');
    }

    await contentService.reorder(contentIds);
    sendSuccess(res, null, 'Content reordered successfully');
  } catch (error) {
    console.error('Error reordering content:', error);
    sendError(res, 'Failed to reorder content');
  }
});

// ============================================
// UPLOAD URL (Client-side uploads)
// ============================================

/**
 * POST /api/v2/content/upload-url
 * Generate signed upload URL for client-side uploads (admin/teacher only)
 */
router.post('/upload-url', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, folder, bucket } = req.body;

    if (!fileName) {
      return sendBadRequest(res, 'fileName is required');
    }

    const storagePath = storageService.generatePath({
      folder: folder || 'uploads',
      fileName,
    });

    const bucketName = bucket === 'thumbnails' ? BUCKETS.THUMBNAILS : BUCKETS.COURSE_CONTENT;

    const result = await storageService.getUploadUrl({
      bucket: bucketName,
      path: storagePath,
    });

    sendSuccess(res, result);
  } catch (error) {
    console.error('Error generating upload URL:', error);
    sendError(res, 'Failed to generate upload URL');
  }
});

export default router;
