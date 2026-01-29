// Report Routes - /api/v2/reports
// Handles report generation and management

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireAdmin, requireTeacherOrAdmin } from '../../middleware/auth.js';
import { reportService, ReportType, ReportFormat } from '../../services/reportService.js';
import {
  sendSuccess,
  sendNotFound,
  sendError,
  sendBadRequest,
  sendPaginated,
} from '../../shared/utils/response.js';

const router = Router();

// All report routes require authentication
router.use(requireAuth, attachUser);

// ============================================
// REPORT GENERATION
// ============================================

/**
 * POST /api/v2/reports/student-performance
 * Generate student performance report
 */
router.post('/student-performance', requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const { batchId, courseId, startDate, endDate, format } = req.body;

    const reportData = await reportService.generateStudentPerformanceReport({
      batchId,
      courseId,
      startDate,
      endDate,
    });

    // Create report record
    const reportRecord = await reportService.createReportRecord({
      reportType: 'student_performance',
      reportName: `Student Performance Report - ${new Date().toISOString().split('T')[0]}`,
      filters: { batchId, courseId },
      startDate,
      endDate,
      fileFormat: format || 'json',
      generatedBy: req.user?.id,
    });

    if (format === 'csv') {
      const csv = reportService.convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=student-performance.csv');
      if (reportRecord) {
        await reportService.updateReportStatus(reportRecord.id, 'completed', undefined, csv.length);
      }
      return res.send(csv);
    }

    if (reportRecord) {
      await reportService.updateReportStatus(reportRecord.id, 'completed');
    }

    sendSuccess(res, {
      report: reportData,
      reportId: reportRecord?.id,
    });
  } catch (error) {
    console.error('Error generating student performance report:', error);
    sendError(res, 'Failed to generate report');
  }
});

/**
 * POST /api/v2/reports/batch
 * Generate batch report
 */
router.post('/batch', requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const { batchIds, startDate, endDate, format } = req.body;

    const reportData = await reportService.generateBatchReport({
      batchIds,
      startDate,
      endDate,
    });

    // Create report record
    const reportRecord = await reportService.createReportRecord({
      reportType: 'batch_report',
      reportName: `Batch Report - ${new Date().toISOString().split('T')[0]}`,
      filters: { batchIds },
      startDate,
      endDate,
      fileFormat: format || 'json',
      generatedBy: req.user?.id,
    });

    if (format === 'csv') {
      const csv = reportService.convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=batch-report.csv');
      if (reportRecord) {
        await reportService.updateReportStatus(reportRecord.id, 'completed', undefined, csv.length);
      }
      return res.send(csv);
    }

    if (reportRecord) {
      await reportService.updateReportStatus(reportRecord.id, 'completed');
    }

    sendSuccess(res, {
      report: reportData,
      reportId: reportRecord?.id,
    });
  } catch (error) {
    console.error('Error generating batch report:', error);
    sendError(res, 'Failed to generate report');
  }
});

/**
 * POST /api/v2/reports/course
 * Generate course report
 */
router.post('/course', requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const { courseIds, startDate, endDate, format } = req.body;

    const reportData = await reportService.generateCourseReport({
      courseIds,
      startDate,
      endDate,
    });

    // Create report record
    const reportRecord = await reportService.createReportRecord({
      reportType: 'course_report',
      reportName: `Course Report - ${new Date().toISOString().split('T')[0]}`,
      filters: { courseIds },
      startDate,
      endDate,
      fileFormat: format || 'json',
      generatedBy: req.user?.id,
    });

    if (format === 'csv') {
      const csv = reportService.convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=course-report.csv');
      if (reportRecord) {
        await reportService.updateReportStatus(reportRecord.id, 'completed', undefined, csv.length);
      }
      return res.send(csv);
    }

    if (reportRecord) {
      await reportService.updateReportStatus(reportRecord.id, 'completed');
    }

    sendSuccess(res, {
      report: reportData,
      reportId: reportRecord?.id,
    });
  } catch (error) {
    console.error('Error generating course report:', error);
    sendError(res, 'Failed to generate report');
  }
});

/**
 * POST /api/v2/reports/exam-analysis/:examId
 * Generate exam analysis report
 */
router.post('/exam-analysis/:examId', requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const examId = req.params.examId as string;
    const { format } = req.body;

    const reportData = await reportService.generateExamAnalysisReport(examId);

    if (!reportData) {
      return sendNotFound(res, 'Exam');
    }

    // Create report record
    const reportRecord = await reportService.createReportRecord({
      reportType: 'exam_analysis',
      reportName: `Exam Analysis - ${reportData.examTitle}`,
      filters: { examId },
      fileFormat: format || 'json',
      generatedBy: req.user?.id,
    });

    if (format === 'csv') {
      // Flatten question analysis for CSV
      const flatData = reportData.questionWiseAnalysis.map((q) => ({
        examId: reportData.examId,
        examTitle: reportData.examTitle,
        examTotalAttempts: reportData.totalAttempts,
        examAvgScore: reportData.avgScore,
        questionId: q.questionId,
        questionText: q.questionText,
        questionTotalAttempts: q.totalAttempts,
        correctAttempts: q.correctAttempts,
        incorrectAttempts: q.incorrectAttempts,
        skipped: q.skipped,
        accuracy: q.accuracy,
        avgTimeSpent: q.avgTimeSpent,
      }));
      const csv = reportService.convertToCSV(flatData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=exam-analysis.csv');
      if (reportRecord) {
        await reportService.updateReportStatus(reportRecord.id, 'completed', undefined, csv.length);
      }
      return res.send(csv);
    }

    if (reportRecord) {
      await reportService.updateReportStatus(reportRecord.id, 'completed');
    }

    sendSuccess(res, {
      report: reportData,
      reportId: reportRecord?.id,
    });
  } catch (error) {
    console.error('Error generating exam analysis report:', error);
    sendError(res, 'Failed to generate report');
  }
});

/**
 * POST /api/v2/reports/enrollment
 * Generate enrollment report
 */
router.post('/enrollment', requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy, format } = req.body;

    if (!startDate || !endDate) {
      return sendBadRequest(res, 'startDate and endDate are required');
    }

    const reportData = await reportService.generateEnrollmentReport({
      startDate,
      endDate,
      groupBy,
    });

    // Create report record
    const reportRecord = await reportService.createReportRecord({
      reportType: 'enrollment_report',
      reportName: `Enrollment Report - ${startDate} to ${endDate}`,
      filters: { groupBy },
      startDate,
      endDate,
      fileFormat: format || 'json',
      generatedBy: req.user?.id,
    });

    if (format === 'csv') {
      // Flatten for CSV
      const flatData = reportData.map((r) => ({
        period: r.period,
        newEnrollments: r.newEnrollments,
        totalEnrollments: r.totalEnrollments,
        completedEnrollments: r.completedEnrollments,
        droppedEnrollments: r.droppedEnrollments,
        coursesCount: r.courseBreakdown.length,
      }));
      const csv = reportService.convertToCSV(flatData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=enrollment-report.csv');
      if (reportRecord) {
        await reportService.updateReportStatus(reportRecord.id, 'completed', undefined, csv.length);
      }
      return res.send(csv);
    }

    if (reportRecord) {
      await reportService.updateReportStatus(reportRecord.id, 'completed');
    }

    sendSuccess(res, {
      report: reportData,
      reportId: reportRecord?.id,
    });
  } catch (error) {
    console.error('Error generating enrollment report:', error);
    sendError(res, 'Failed to generate report');
  }
});

/**
 * GET /api/v2/reports/question-bank
 * Generate question bank report
 */
router.get('/question-bank', requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const format = req.query.format as string | undefined;

    const reportData = await reportService.generateQuestionBankReport();

    // Create report record
    const reportRecord = await reportService.createReportRecord({
      reportType: 'question_bank_report',
      reportName: `Question Bank Report - ${new Date().toISOString().split('T')[0]}`,
      fileFormat: (format as ReportFormat) || 'json',
      generatedBy: req.user?.id,
    });

    if (format === 'csv') {
      // Flatten for CSV
      const flatData = [
        { metric: 'Total Questions', value: reportData.totalQuestions },
        { metric: 'Verified', value: reportData.verifiedCount },
        { metric: 'Unverified', value: reportData.unverifiedCount },
        { metric: 'Recently Added (30 days)', value: reportData.recentlyAdded },
        ...reportData.byType.map((t) => ({ metric: `Type: ${t.type}`, value: t.count })),
        ...reportData.byDifficulty.map((d) => ({ metric: `Difficulty: ${d.difficulty}`, value: d.count })),
      ];
      const csv = reportService.convertToCSV(flatData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=question-bank-report.csv');
      if (reportRecord) {
        await reportService.updateReportStatus(reportRecord.id, 'completed', undefined, csv.length);
      }
      return res.send(csv);
    }

    if (reportRecord) {
      await reportService.updateReportStatus(reportRecord.id, 'completed');
    }

    sendSuccess(res, {
      report: reportData,
      reportId: reportRecord?.id,
    });
  } catch (error) {
    console.error('Error generating question bank report:', error);
    sendError(res, 'Failed to generate report');
  }
});

// ============================================
// REPORT MANAGEMENT
// ============================================

/**
 * GET /api/v2/reports
 * List generated reports
 */
router.get('/', requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const reportType = req.query.reportType as ReportType | undefined;
    const status = req.query.status as 'pending' | 'processing' | 'completed' | 'failed' | undefined;

    // Non-admins can only see their own reports
    const generatedBy = req.user?.role === 'admin' ? undefined : req.user?.id;

    const { reports, total } = await reportService.listReports({
      reportType,
      status,
      generatedBy,
      page,
      limit,
    });

    sendPaginated(res, reports, total, page, limit);
  } catch (error) {
    console.error('Error listing reports:', error);
    sendError(res, 'Failed to list reports');
  }
});

/**
 * GET /api/v2/reports/:id
 * Get report by ID
 */
router.get('/:id', requireTeacherOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const report = await reportService.getReportById(id);
    if (!report) {
      return sendNotFound(res, 'Report');
    }

    // Non-admins can only view their own reports
    if (req.user?.role !== 'admin' && report.generatedBy !== req.user?.id) {
      return sendNotFound(res, 'Report');
    }

    sendSuccess(res, report);
  } catch (error) {
    console.error('Error fetching report:', error);
    sendError(res, 'Failed to fetch report');
  }
});

/**
 * DELETE /api/v2/reports/:id
 * Delete report
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const report = await reportService.getReportById(id);
    if (!report) {
      return sendNotFound(res, 'Report');
    }

    const success = await reportService.deleteReport(id);
    if (success) {
      sendSuccess(res, null, 'Report deleted successfully');
    } else {
      sendError(res, 'Failed to delete report');
    }
  } catch (error) {
    console.error('Error deleting report:', error);
    sendError(res, 'Failed to delete report');
  }
});

// ============================================
// QUICK STATS (for widgets)
// ============================================

/**
 * GET /api/v2/reports/quick/summary
 * Get quick summary stats for dashboard widgets
 */
router.get('/quick/summary', requireTeacherOrAdmin, async (_req: Request, res: Response) => {
  try {
    // Get multiple quick stats in parallel
    const [questionBankReport] = await Promise.all([
      reportService.generateQuestionBankReport(),
    ]);

    sendSuccess(res, {
      questionBank: {
        total: questionBankReport.totalQuestions,
        verified: questionBankReport.verifiedCount,
        recentlyAdded: questionBankReport.recentlyAdded,
      },
    });
  } catch (error) {
    console.error('Error fetching quick summary:', error);
    sendError(res, 'Failed to fetch summary');
  }
});

export default router;
