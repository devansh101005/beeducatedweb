// Student Routes - /api/v2/students and /api/v2/student
// Handles student profile, enrollment, and materials operations

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireTeacherOrAdmin } from '../../middleware/auth.js';
import { studentService } from '../../services/studentService.js';
import { courseService } from '../../services/courseService.js';
import { batchService } from '../../services/batchService.js';
import { contentService } from '../../services/contentService.js';
import { enrollmentService } from '../../services/enrollmentService.js';
import { parentService } from '../../services/parentService.js';
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

/**
 * Helper to check if a parent is linked to a specific student
 * Returns true if the parent has a valid relationship with the student
 */
async function isParentOfStudent(userId: string, studentId: string): Promise<boolean> {
  try {
    // Get parent profile by user ID
    const parent = await parentService.getByUserId(userId);
    if (!parent) return false;

    // Get all children linked to this parent
    const children = await parentService.getChildren(parent.id);

    // Check if the requested student is in the parent's children list
    return children.some((child: any) => child.id === studentId);
  } catch (error) {
    console.error('Error checking parent-student relationship:', error);
    return false;
  }
}

const router = Router();

// ============================================
// STUDENT ID MANAGEMENT
// ============================================

/**
 * GET /api/v2/students/suggest-id
 * Get suggested next student ID (admin only)
 */
router.get('/suggest-id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendBadRequest(res, 'Admin access required');
    }

    const suggestedId = await studentService.generateSuggestedStudentId();
    sendSuccess(res, { studentId: suggestedId });
  } catch (error) {
    console.error('Error generating suggested student ID:', error);
    sendError(res, 'Failed to generate student ID');
  }
});

/**
 * GET /api/v2/students/check-id/:studentId
 * Check if student ID is available (admin only)
 */
router.get('/check-id/:studentId', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendBadRequest(res, 'Admin access required');
    }

    const studentId = getParam(req.params.studentId);
    const available = await studentService.isStudentIdAvailable(studentId);
    sendSuccess(res, { studentId, available });
  } catch (error) {
    console.error('Error checking student ID:', error);
    sendError(res, 'Failed to check student ID');
  }
});

// ============================================
// STUDENT PROFILE
// ============================================

/**
 * POST /api/v2/students
 * Create a new student record (admin only)
 */
router.post('/', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendBadRequest(res, 'Admin access required');
    }

    const {
      userId,
      studentId,
      studentType,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      classGrade,
      schoolName,
      board,
      targetExam,
      targetYear,
      parentName,
      parentPhone,
      parentEmail,
      subscriptionStatus,
    } = req.body;

    if (!userId || !studentId || !studentType) {
      return sendBadRequest(res, 'userId, studentId, and studentType are required');
    }

    const student = await studentService.create({
      user_id: userId,
      student_id: studentId,
      student_type: studentType,
      date_of_birth: dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      class_grade: classGrade,
      school_name: schoolName,
      board,
      target_exam: targetExam,
      target_year: targetYear,
      parent_name: parentName,
      parent_phone: parentPhone,
      parent_email: parentEmail,
      subscription_status: subscriptionStatus,
    });

    sendCreated(res, student, 'Student created successfully');
  } catch (error: unknown) {
    console.error('Error creating student:', error);
    const message = error instanceof Error ? error.message : 'Failed to create student';
    sendError(res, message);
  }
});

/**
 * GET /api/v2/students
 * List students with filters (admin/teacher only)
 */
router.get('/', requireAuth, attachUser, requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const studentType = req.query.studentType as string | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const search = req.query.search as string | undefined;

    const result = await studentService.list({ page, limit, studentType, isActive, search });

    sendPaginated(res, result.students, result.total, page, limit);
  } catch (error) {
    console.error('Error listing students:', error);
    sendError(res, 'Failed to list students');
  }
});

/**
 * GET /api/v2/students/me
 * Get current student's own profile
 */
router.get('/me', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    const student = await studentService.getByUserId(req.user.id);
    if (!student) {
      return sendNotFound(res, 'Student profile');
    }

    sendSuccess(res, student);
  } catch (error) {
    console.error('Error fetching own profile:', error);
    sendError(res, 'Failed to fetch profile');
  }
});

// ============================================
// STUDENT MATERIALS (Content Access)
// IMPORTANT: These routes MUST come before /:id routes
// ============================================

/**
 * GET /api/v2/student/materials
 * Get study materials for the current student
 * Only shows content for classes the student is enrolled in
 */
router.get('/materials', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendSuccess(res, {
        materials: [],
        total: 0,
        enrolledClasses: [],
        message: 'Please log in to access study materials.',
      });
    }

    console.log('[Materials] Looking up student for user ID:', req.user.id);
    const student = await studentService.getByUserId(req.user.id);

    if (!student) {
      console.log('[Materials] No student found for user ID:', req.user.id);
      // Return empty result instead of error - student profile may not exist yet
      return sendSuccess(res, {
        materials: [],
        total: 0,
        enrolledClasses: [],
        message: 'Student profile not found. Please complete your profile setup.',
        debug: { userId: req.user.id, studentFound: false },
      });
    }

    console.log('[Materials] Found student:', { id: student.id, studentId: student.student_id });

    // Get filters from query params
    const classId = req.query.classId as string | undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const materialType = req.query.materialType as string | undefined;
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get student's active enrollments
    const accessSummary = await enrollmentService.getStudentAccessSummary(student.id);
    const enrolledClassIds = accessSummary.activeEnrollments.map(e => e.classId);

    console.log('[Materials] Enrollment summary:', {
      studentDbId: student.id,
      activeEnrollments: accessSummary.activeEnrollments.length,
      enrolledClassIds,
      classGrade: student.class_grade,
    });

    // If no formal enrollments, check if student has class_grade set (fallback)
    const hasClassGrade = !!student.class_grade;

    if (enrolledClassIds.length === 0 && !hasClassGrade) {
      return sendSuccess(res, {
        materials: [],
        total: 0,
        enrolledClasses: [],
        message: 'No active enrollments found. Please enroll in a class to access study materials.',
        debug: {
          studentDbId: student.id,
          studentId: student.student_id,
          enrollmentsFound: 0,
          classGrade: null,
        },
      });
    }

    // If using class_grade fallback, log it
    if (enrolledClassIds.length === 0 && hasClassGrade) {
      console.log('[Materials] Using class_grade fallback:', student.class_grade);
    }

    // If a specific class is requested, verify the student has access
    // (either through formal enrollment or class_grade fallback)
    if (classId && !enrolledClassIds.includes(classId) && !hasClassGrade) {
      return sendSuccess(res, {
        materials: [],
        total: 0,
        enrolledClasses: accessSummary.activeEnrollments,
        message: 'You are not enrolled in this class.',
      });
    }

    // Get content for enrolled classes using the new hierarchy
    // Pass classGrade as fallback for students without formal enrollments
    let content: any[] = [];
    try {
      content = await contentService.getStudentClassContent(student.id, {
        classId: classId || undefined,
        subjectId: subjectId || undefined,
        materialType: materialType as any || undefined,
        classGrade: student.class_grade || undefined,
      });
    } catch (contentError) {
      console.error('Error fetching content:', contentError);
      // Return empty array if content fetch fails (e.g., view doesn't exist)
      content = [];
    }

    // Apply additional filters (search, content type)
    let filteredContent = content;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContent = filteredContent.filter((c: any) =>
        c.title?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    }
    if (type) {
      filteredContent = filteredContent.filter((c: any) => c.content_type === type);
    }

    // Paginate
    const total = filteredContent.length;
    const startIndex = (page - 1) * limit;
    const paginatedContent = filteredContent.slice(startIndex, startIndex + limit);

    // Transform content to materials format expected by frontend
    const materials = paginatedContent.map((content: any) => ({
      id: content.id,
      title: content.title,
      description: content.description,
      type: content.content_type,
      materialType: content.material_type,
      classId: content.class_id,
      className: content.class_name,
      subjectId: content.subject_id,
      subjectName: content.subject_name,
      subjectCode: content.subject_code,
      fileSize: content.file_size,
      duration: content.duration_seconds,
      thumbnailUrl: content.thumbnail_path,
      fileUrl: content.file_path,
      isDownloadable: content.is_downloadable,
      isFree: content.is_free,
      isCompleted: content.is_completed,
      progressPercent: content.progress_percent,
      createdAt: content.created_at,
      updatedAt: content.updated_at,
    }));

    // Build enrolled classes info - include class_grade fallback if used
    let enrolledClassesInfo = accessSummary.activeEnrollments;

    // If no formal enrollments but content was returned (via class_grade fallback),
    // create a pseudo-enrollment entry for UI display
    if (enrolledClassesInfo.length === 0 && hasClassGrade && content.length > 0) {
      // Get unique classes from the content
      const classesFromContent = content.reduce((acc: any[], c: any) => {
        if (c.class_id && !acc.find(x => x.classId === c.class_id)) {
          acc.push({
            classId: c.class_id,
            className: c.class_name || `Class ${student.class_grade}`,
            courseTypeName: c.course_type_name || 'General',
            enrolledAt: null,
            expiresAt: null,
            daysRemaining: null,
            isClassGradeFallback: true,
          });
        }
        return acc;
      }, []);
      enrolledClassesInfo = classesFromContent;
    }

    sendSuccess(res, {
      materials,
      total,
      page,
      limit,
      enrolledClasses: enrolledClassesInfo,
      usingClassGradeFallback: enrolledClassIds.length === 0 && hasClassGrade,
    });
  } catch (error) {
    console.error('Error fetching student materials:', error);
    sendError(res, 'Failed to fetch study materials');
  }
});

/**
 * GET /api/v2/student/materials/categories
 * Get material categories (classes with subjects) for the current student
 */
router.get('/materials/categories', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    const student = await studentService.getByUserId(req.user.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    // Get student's enrolled classes
    const accessSummary = await enrollmentService.getStudentAccessSummary(student.id);

    if (accessSummary.activeEnrollments.length === 0) {
      return sendSuccess(res, []);
    }

    // Get content counts by class
    const categories = await Promise.all(
      accessSummary.activeEnrollments.map(async (enrollment) => {
        // Get content count for this class
        const content = await contentService.getByClass(enrollment.classId, { publishedOnly: true });

        // Group content by subject
        const subjectGroups: Record<string, number> = {};
        content.forEach((c: any) => {
          if (c.subject_id) {
            subjectGroups[c.subject_id] = (subjectGroups[c.subject_id] || 0) + 1;
          }
        });

        return {
          id: enrollment.classId,
          name: enrollment.className,
          courseType: enrollment.courseTypeName,
          materialCount: content.length,
          daysRemaining: enrollment.daysRemaining,
          subjects: Object.entries(subjectGroups).map(([subjectId, count]) => ({
            id: subjectId,
            count,
          })),
          icon: getContentIcon(enrollment.courseTypeName),
        };
      })
    );

    // Also add a general category for free content
    const freeContent = await contentService.list({
      isFree: true,
      isPublished: true,
      limit: 1,
    });

    const allCategories = [
      ...categories,
      {
        id: 'free',
        name: 'Free Materials',
        courseType: 'Free',
        materialCount: freeContent.total,
        daysRemaining: null,
        subjects: [],
        icon: 'gift',
      },
    ];

    sendSuccess(res, allCategories);
  } catch (error) {
    console.error('Error fetching material categories:', error);
    sendError(res, 'Failed to fetch categories');
  }
});

/**
 * POST /api/v2/student/materials/:id/bookmark
 * Bookmark a material (placeholder - needs bookmark table)
 */
router.post('/materials/:id/bookmark', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);

    // For now, just acknowledge the bookmark
    // TODO: Implement proper bookmarking with a database table
    console.log(`Student ${req.user?.id} bookmarked content ${contentId}`);

    sendSuccess(res, { bookmarked: true, contentId });
  } catch (error) {
    console.error('Error bookmarking material:', error);
    sendError(res, 'Failed to bookmark material');
  }
});

/**
 * POST /api/v2/student/materials/:id/download
 * Track material download
 */
router.post('/materials/:id/download', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);

    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    const student = await studentService.getByUserId(req.user.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    // Get the content to check if downloadable
    const content = await contentService.getById(contentId);
    if (!content) {
      return sendNotFound(res, 'Content');
    }

    if (!content.is_downloadable && !content.is_free) {
      return sendBadRequest(res, 'This content is not available for download');
    }

    // Update progress to track the download/view
    await contentService.updateProgress(contentId, student.id, {
      view_count: 1, // Increment view count
    });

    // Generate signed URL for download
    const signedUrl = await contentService.getAccessUrl(contentId, req.user.id);

    sendSuccess(res, {
      downloaded: true,
      contentId,
      url: signedUrl,
    });
  } catch (error) {
    console.error('Error tracking download:', error);
    sendError(res, 'Failed to track download');
  }
});

/**
 * GET /api/v2/student/materials/:id
 * Get a specific material with access check
 */
router.get('/materials/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const contentId = getParam(req.params.id);

    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    const content = await contentService.getById(contentId);
    if (!content) {
      return sendNotFound(res, 'Content');
    }

    // Check if content is free
    if (content.is_free) {
      return sendSuccess(res, content);
    }

    // Check if student is enrolled
    const student = await studentService.getByUserId(req.user.id);
    if (!student) {
      return sendBadRequest(res, 'Student profile not found');
    }

    // Check access using class_id (new hierarchy) or course_id (legacy)
    const classIdToCheck = content.class_id || content.course_id;
    if (!classIdToCheck) {
      // Content has no class association, treat as general content
      return sendSuccess(res, content);
    }

    const accessResult = await enrollmentService.checkClassAccess(student.id, classIdToCheck);
    if (!accessResult.hasAccess) {
      return sendBadRequest(res, `You do not have access to this content. ${accessResult.reason}`);
    }

    sendSuccess(res, content);
  } catch (error) {
    console.error('Error fetching material:', error);
    sendError(res, 'Failed to fetch material');
  }
});

// ============================================
// STUDENT PROFILE BY ID (must come AFTER /materials routes)
// ============================================

/**
 * GET /api/v2/students/:id
 * Get student by ID
 */
router.get('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);

    // Students can only view their own profile, admins/teachers can view any
    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions
    const isOwner = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    // For parents, verify they are actually linked to this student
    let isLinkedParent = false;
    if (req.user?.role === 'parent' && req.user?.id) {
      isLinkedParent = await isParentOfStudent(req.user.id, studentId);
    }

    if (!isOwner && !isAdminOrTeacher && !isLinkedParent) {
      return sendBadRequest(res, 'Not authorized to view this student');
    }

    sendSuccess(res, student);
  } catch (error) {
    console.error('Error fetching student:', error);
    sendError(res, 'Failed to fetch student');
  }
});

/**
 * PUT /api/v2/students/:id
 * Update student profile
 */
router.put('/:id', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);
    const { targetExam, classGrade, schoolName, city, state, parentPhone, address, dateOfBirth, gender, metadata } = req.body;

    const existingStudent = await studentService.getById(studentId);
    if (!existingStudent) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions - students can update their own, admins can update any
    const isOwner = req.user?.role === 'student' && existingStudent.user_id === req.user.id;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendBadRequest(res, 'Not authorized to update this student');
    }

    const student = await studentService.update(studentId, {
      target_exam: targetExam,
      class_grade: classGrade,
      school_name: schoolName,
      city,
      state,
      parent_phone: parentPhone,
      address,
      date_of_birth: dateOfBirth,
      gender,
      metadata,
    });

    sendSuccess(res, student, 'Profile updated successfully');
  } catch (error) {
    console.error('Error updating student:', error);
    sendError(res, 'Failed to update student');
  }
});

// ============================================
// STUDENT COURSES
// ============================================

/**
 * GET /api/v2/students/:id/courses
 * Get student's enrolled courses
 */
router.get('/:id/courses', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions
    const isOwner = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    // For parents, verify they are actually linked to this student
    let isLinkedParent = false;
    if (req.user?.role === 'parent' && req.user?.id) {
      isLinkedParent = await isParentOfStudent(req.user.id, studentId);
    }

    if (!isOwner && !isAdminOrTeacher && !isLinkedParent) {
      return sendBadRequest(res, 'Not authorized to view this student\'s courses');
    }

    const courses = await courseService.getStudentCourses(studentId);
    sendSuccess(res, courses);
  } catch (error) {
    console.error('Error fetching student courses:', error);
    sendError(res, 'Failed to fetch student courses');
  }
});

/**
 * POST /api/v2/students/:id/courses
 * Enroll student in a course (admin/teacher only or self-enrollment)
 */
router.post('/:id/courses', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);
    const { courseId, expiresAt, paymentId } = req.body;

    if (!courseId) {
      return sendBadRequest(res, 'courseId is required');
    }

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions - admin/teacher can enroll anyone, students can only self-enroll
    const isOwner = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (!isOwner && !isAdminOrTeacher) {
      return sendBadRequest(res, 'Not authorized to enroll this student');
    }

    const course = await courseService.getById(courseId);
    if (!course) {
      return sendNotFound(res, 'Course');
    }

    const enrollment = await courseService.enrollStudent(studentId, courseId, expiresAt, paymentId);
    sendCreated(res, enrollment, 'Enrolled in course successfully');
  } catch (error: unknown) {
    console.error('Error enrolling in course:', error);
    const message = error instanceof Error ? error.message : 'Failed to enroll in course';
    sendError(res, message);
  }
});

/**
 * PUT /api/v2/students/:id/courses/:courseId/progress
 * Update course progress
 */
router.put('/:id/courses/:courseId/progress', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);
    const courseId = getParam(req.params.courseId);
    const { progressPercent } = req.body;

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Only the student themselves or admin/teacher can update progress
    const isOwner = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (!isOwner && !isAdminOrTeacher) {
      return sendBadRequest(res, 'Not authorized to update progress');
    }

    const enrollment = await courseService.updateProgress(studentId, courseId, {
      progress_percent: progressPercent,
    });

    sendSuccess(res, enrollment, 'Progress updated successfully');
  } catch (error) {
    console.error('Error updating progress:', error);
    sendError(res, 'Failed to update progress');
  }
});

// ============================================
// STUDENT BATCHES
// ============================================

/**
 * GET /api/v2/students/:id/batches
 * Get student's enrolled batches
 */
router.get('/:id/batches', requireAuth, attachUser, async (req: Request, res: Response) => {
  try {
    const studentId = getParam(req.params.id);

    const student = await studentService.getById(studentId);
    if (!student) {
      return sendNotFound(res, 'Student');
    }

    // Check permissions
    const isOwner = req.user?.role === 'student' && student.user_id === req.user.id;
    const isAdminOrTeacher = req.user?.role === 'admin' || req.user?.role === 'teacher';

    // For parents, verify they are actually linked to this student
    let isLinkedParent = false;
    if (req.user?.role === 'parent' && req.user?.id) {
      isLinkedParent = await isParentOfStudent(req.user.id, studentId);
    }

    if (!isOwner && !isAdminOrTeacher && !isLinkedParent) {
      return sendBadRequest(res, 'Not authorized to view this student\'s batches');
    }

    const batches = await batchService.getStudentBatches(studentId);
    sendSuccess(res, batches);
  } catch (error) {
    console.error('Error fetching student batches:', error);
    sendError(res, 'Failed to fetch student batches');
  }
});

// Helper function to get icon based on course type
function getContentIcon(courseType: string): string {
  switch (courseType?.toLowerCase()) {
    case 'offline coaching':
      return 'school';
    case 'online coaching':
      return 'video';
    case 'home tuition':
      return 'home';
    case 'test series':
      return 'clipboard';
    default:
      return 'book';
  }
}

export default router;
