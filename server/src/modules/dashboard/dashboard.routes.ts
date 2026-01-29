// Dashboard Routes - /api/v2/dashboard
// Handles dashboard statistics and analytics

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireAdmin, requireTeacherOrAdmin } from '../../middleware/auth.js';
import { dashboardService } from '../../services/dashboardService.js';
import { sendSuccess, sendError, sendBadRequest } from '../../shared/utils/response.js';

const router = Router();

// All dashboard routes require authentication
router.use(requireAuth, attachUser);

// ============================================
// ADMIN DASHBOARD
// ============================================

/**
 * GET /api/v2/dashboard/admin/overview
 * Get admin dashboard overview statistics
 */
router.get('/admin/overview', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getOverviewStats();
    sendSuccess(res, stats);
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    sendError(res, 'Failed to fetch dashboard overview');
  }
});

/**
 * GET /api/v2/dashboard/admin/trends
 * Get trend data for admin dashboard
 */
router.get('/admin/trends', requireAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const type = req.query.type as string || 'users';

    let trendData;
    switch (type) {
      case 'users':
        trendData = await dashboardService.getUserGrowthTrend(days);
        break;
      case 'enrollments':
        trendData = await dashboardService.getEnrollmentTrend(days);
        break;
      case 'exams':
        trendData = await dashboardService.getExamPerformanceTrend(days);
        break;
      default:
        return sendBadRequest(res, 'Invalid trend type. Use: users, enrollments, or exams');
    }

    sendSuccess(res, trendData);
  } catch (error) {
    console.error('Error fetching trends:', error);
    sendError(res, 'Failed to fetch trend data');
  }
});

/**
 * GET /api/v2/dashboard/admin/activity
 * Get recent activity logs
 */
router.get('/admin/activity', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await dashboardService.getRecentActivity(limit);
    sendSuccess(res, activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    sendError(res, 'Failed to fetch activity logs');
  }
});

/**
 * GET /api/v2/dashboard/admin/top-students
 * Get top performing students
 */
router.get('/admin/top-students', requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const topStudents = await dashboardService.getTopStudents(limit);
    sendSuccess(res, topStudents);
  } catch (error) {
    console.error('Error fetching top students:', error);
    sendError(res, 'Failed to fetch top students');
  }
});

/**
 * GET /api/v2/dashboard/admin/batch-performance
 * Get batch performance summary
 */
router.get('/admin/batch-performance', requireTeacherOrAdmin, async (_req: Request, res: Response) => {
  try {
    const batchPerformance = await dashboardService.getBatchPerformance();
    sendSuccess(res, batchPerformance);
  } catch (error) {
    console.error('Error fetching batch performance:', error);
    sendError(res, 'Failed to fetch batch performance');
  }
});

/**
 * GET /api/v2/dashboard/admin/course-summary
 * Get course enrollment summary
 */
router.get('/admin/course-summary', requireTeacherOrAdmin, async (_req: Request, res: Response) => {
  try {
    const courseSummary = await dashboardService.getCourseEnrollmentSummary();
    sendSuccess(res, courseSummary);
  } catch (error) {
    console.error('Error fetching course summary:', error);
    sendError(res, 'Failed to fetch course summary');
  }
});

/**
 * GET /api/v2/dashboard/admin/exam-stats
 * Get exam statistics
 */
router.get('/admin/exam-stats', requireTeacherOrAdmin, async (_req: Request, res: Response) => {
  try {
    const examStats = await dashboardService.getExamStats();
    sendSuccess(res, examStats);
  } catch (error) {
    console.error('Error fetching exam stats:', error);
    sendError(res, 'Failed to fetch exam statistics');
  }
});

/**
 * POST /api/v2/dashboard/admin/update-daily-stats
 * Trigger daily stats update (admin only)
 */
router.post('/admin/update-daily-stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const date = req.body.date as string | undefined;
    const success = await dashboardService.updateDailyStats(date);

    if (success) {
      sendSuccess(res, null, 'Daily stats updated successfully');
    } else {
      sendError(res, 'Failed to update daily stats');
    }
  } catch (error) {
    console.error('Error updating daily stats:', error);
    sendError(res, 'Failed to update daily stats');
  }
});

// ============================================
// TEACHER DASHBOARD
// ============================================

/**
 * GET /api/v2/dashboard/teacher
 * Get teacher's dashboard
 */
router.get('/teacher', requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return sendBadRequest(res, 'User ID not found');
    }

    const dashboard = await dashboardService.getTeacherDashboard(teacherId);
    sendSuccess(res, dashboard);
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    sendError(res, 'Failed to fetch teacher dashboard');
  }
});

// ============================================
// STUDENT DASHBOARD
// ============================================

/**
 * GET /api/v2/dashboard/student
 * Get student's personal dashboard
 */
router.get('/student', async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return sendBadRequest(res, 'User ID not found');
    }

    const dashboard = await dashboardService.getStudentDashboard(studentId);
    sendSuccess(res, dashboard);
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    sendError(res, 'Failed to fetch student dashboard');
  }
});

// ============================================
// ACTIVITY LOGGING
// ============================================

/**
 * POST /api/v2/dashboard/activity
 * Log user activity
 */
router.post('/activity', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || null;
    const { activityType, entityType, entityId, metadata } = req.body;

    if (!activityType) {
      return sendBadRequest(res, 'activityType is required');
    }

    const logId = await dashboardService.logActivity(
      userId,
      activityType,
      entityType,
      entityId,
      metadata
    );

    if (logId) {
      sendSuccess(res, { logId }, 'Activity logged');
    } else {
      sendError(res, 'Failed to log activity');
    }
  } catch (error) {
    console.error('Error logging activity:', error);
    sendError(res, 'Failed to log activity');
  }
});

export default router;
