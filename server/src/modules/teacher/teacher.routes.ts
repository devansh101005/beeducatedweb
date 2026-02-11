// Teacher Routes
// Endpoints for teacher-specific views: My Batches, My Students, Grading

import { Router, Request, Response } from 'express';
import { requireAuth, attachUser, requireTeacherOrAdmin } from '../../middleware/auth.js';
import { teacherService } from '../../services/teacherService.js';
import { batchService } from '../../services/batchService.js';
import { examAttemptService } from '../../services/examAttemptService.js';
import { getSupabase } from '../../config/supabase.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendBadRequest,
} from '../../shared/utils/response.js';

// Helper to get string param (Express 5 can return string | string[])
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

const router = Router();

// All routes require teacher or admin access
const auth = [requireAuth, attachUser, requireTeacherOrAdmin];

// Helper: get teacher record from authenticated user
async function getTeacher(req: Request) {
  return teacherService.getByUserId(req.user!.id);
}

// Helper: derive batch status from data
function deriveBatchStatus(batch: { is_active: boolean; start_date?: string; end_date?: string }): 'active' | 'upcoming' | 'completed' {
  if (!batch.is_active) return 'completed';
  const now = new Date();
  if (batch.start_date && new Date(batch.start_date) > now) return 'upcoming';
  if (batch.end_date && new Date(batch.end_date) < now) return 'completed';
  return 'active';
}

// ============================================
// GROUP A: BATCHES (MyBatchesPage)
// ============================================

/**
 * GET /api/v2/teacher/batches
 * Get all batches assigned to the teacher
 */
router.get('/batches', ...auth, async (req: Request, res: Response) => {
  try {
    const teacher = await getTeacher(req);
    if (!teacher) return sendNotFound(res, 'Teacher profile');

    const teacherBatches = await batchService.getTeacherBatches(teacher.id);

    const batches = await Promise.all(
      teacherBatches.map(async (tb: any) => {
        const batch = tb.batch || tb;

        // Get student count for this batch
        let studentCount = 0;
        let topStudents: { name: string; avatar?: string }[] = [];
        try {
          const students = await batchService.getStudents(batch.id, 'active');
          studentCount = students.length;
          topStudents = students.slice(0, 3).map((s: any) => {
            const user = s.student?.user;
            return {
              name: [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Unknown',
              avatar: user?.avatar_url || undefined,
            };
          });
        } catch { /* ignore */ }

        return {
          id: batch.id,
          name: batch.name,
          code: batch.batch_code,
          course: {
            id: batch.id,
            name: batch.target_exam || batch.name,
          },
          schedule: batch.schedule || { days: [], startTime: '', endTime: '' },
          startDate: batch.start_date || batch.created_at,
          endDate: batch.end_date || undefined,
          studentCount,
          maxStudents: batch.max_students || 50,
          status: deriveBatchStatus(batch),
          topStudents,
        };
      })
    );

    sendSuccess(res, batches);
  } catch (error) {
    console.error('Error fetching teacher batches:', error);
    sendError(res, 'Failed to fetch batches');
  }
});

/**
 * GET /api/v2/teacher/classes/upcoming
 * Get upcoming classes based on batch schedules
 */
router.get('/classes/upcoming', ...auth, async (req: Request, res: Response) => {
  try {
    const teacher = await getTeacher(req);
    if (!teacher) return sendNotFound(res, 'Teacher profile');

    const teacherBatches = await batchService.getTeacherBatches(teacher.id);
    const upcoming: {
      batchId: string;
      batchName: string;
      courseName: string;
      time: string;
      date: string;
      topic?: string;
    }[] = [];

    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    const tomorrow = new Date(now.getTime() + 86400000).toLocaleDateString('en-US', { weekday: 'long' });
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

    for (const tb of teacherBatches) {
      const batch = tb.batch || tb;
      if (!batch.is_active) continue;

      const schedule = batch.schedule as Record<string, string[]> | null;
      if (!schedule) continue;

      // Check today's classes
      if (schedule[today]) {
        for (const time of schedule[today]) {
          upcoming.push({
            batchId: batch.id,
            batchName: batch.name,
            courseName: batch.target_exam || batch.name,
            time,
            date: todayStr,
          });
        }
      }

      // Check tomorrow's classes
      if (schedule[tomorrow]) {
        for (const time of schedule[tomorrow]) {
          upcoming.push({
            batchId: batch.id,
            batchName: batch.name,
            courseName: batch.target_exam || batch.name,
            time,
            date: tomorrowStr,
          });
        }
      }
    }

    // Sort by date then time
    upcoming.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    sendSuccess(res, upcoming);
  } catch (error) {
    console.error('Error fetching upcoming classes:', error);
    sendError(res, 'Failed to fetch upcoming classes');
  }
});

/**
 * GET /api/v2/teacher/batches/stats
 * Get summary statistics for teacher's batches
 */
router.get('/batches/stats', ...auth, async (req: Request, res: Response) => {
  try {
    const teacher = await getTeacher(req);
    if (!teacher) return sendNotFound(res, 'Teacher profile');

    const teacherBatches = await batchService.getTeacherBatches(teacher.id);

    let totalStudents = 0;
    let activeBatches = 0;
    let classesToday = 0;

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    for (const tb of teacherBatches) {
      const batch = tb.batch || tb;
      const status = deriveBatchStatus(batch);
      if (status === 'active') activeBatches++;

      // Count students
      totalStudents += batch.current_students || 0;

      // Count today's classes
      const schedule = batch.schedule as Record<string, string[]> | null;
      if (schedule && schedule[today] && batch.is_active) {
        classesToday += schedule[today].length;
      }
    }

    sendSuccess(res, {
      totalBatches: teacherBatches.length,
      activeBatches,
      totalStudents,
      classesToday,
    });
  } catch (error) {
    console.error('Error fetching batch stats:', error);
    sendError(res, 'Failed to fetch batch statistics');
  }
});

// ============================================
// GROUP B: STUDENTS (MyStudentsPage)
// ============================================

/**
 * GET /api/v2/teacher/students
 * Get paginated students across teacher's batches
 */
router.get('/students', ...auth, async (req: Request, res: Response) => {
  try {
    const teacher = await getTeacher(req);
    if (!teacher) return sendNotFound(res, 'Teacher profile');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const batchId = req.query.batchId as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    // Get teacher's batch IDs
    const teacherBatches = await batchService.getTeacherBatches(teacher.id);
    const batchIds = teacherBatches.map((tb: any) => (tb.batch || tb).id);

    if (batchIds.length === 0) {
      return sendSuccess(res, { students: [], pagination: { totalPages: 0 } });
    }

    // Filter to specific batch if requested
    const targetBatchIds = batchId && batchId !== 'all'
      ? batchIds.filter((id: string) => id === batchId)
      : batchIds;

    if (targetBatchIds.length === 0) {
      return sendSuccess(res, { students: [], pagination: { totalPages: 0 } });
    }

    const supabase = getSupabase();
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('batch_students')
      .select(`
        *,
        batch:batches(id, name),
        student:students(
          *,
          user:users(id, email, first_name, last_name, phone, avatar_url)
        )
      `, { count: 'exact' })
      .in('batch_id', targetBatchIds);

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'active' || statusFilter === 'dropped' || statusFilter === 'completed') {
        query = query.eq('status', statusFilter);
      }
    }

    const { data, error, count } = await query
      .order('enrolled_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch students: ${error.message}`);

    // Filter by search (name/email) in JS since it spans a join
    let students = (data || []).map((enrollment: any) => {
      const user = enrollment.student?.user;
      const firstName = user?.first_name || '';
      const lastName = user?.last_name || '';
      return {
        id: enrollment.student?.id || enrollment.student_id,
        firstName,
        lastName,
        email: user?.email || '',
        phone: user?.phone || undefined,
        avatar: user?.avatar_url || undefined,
        batch: {
          id: enrollment.batch?.id || enrollment.batch_id,
          name: enrollment.batch?.name || 'Unknown',
        },
        enrolledAt: enrollment.enrolled_at,
        progress: 0,
        avgScore: 0,
        attendance: 0,
        status: enrollment.status === 'active' ? 'active' : 'inactive',
        lastActivity: enrollment.student?.updated_at || undefined,
        trend: 'stable' as const,
      };
    });

    // Apply search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      students = students.filter((s: any) => {
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        return fullName.includes(searchLower) || s.email.toLowerCase().includes(searchLower);
      });
    }

    const totalItems = search ? students.length : (count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // If search was applied, we need to re-paginate
    if (search && search.trim()) {
      students = students.slice(0, limit);
    }

    sendSuccess(res, {
      students,
      pagination: { totalPages },
    });
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    sendError(res, 'Failed to fetch students');
  }
});

/**
 * GET /api/v2/teacher/students/stats
 * Get student statistics across teacher's batches
 */
router.get('/students/stats', ...auth, async (req: Request, res: Response) => {
  try {
    const teacher = await getTeacher(req);
    if (!teacher) return sendNotFound(res, 'Teacher profile');

    const teacherBatches = await batchService.getTeacherBatches(teacher.id);
    const batchIds = teacherBatches.map((tb: any) => (tb.batch || tb).id);

    if (batchIds.length === 0) {
      return sendSuccess(res, { total: 0, active: 0, atRisk: 0, avgProgress: 0 });
    }

    const supabase = getSupabase();
    const { data: enrollments } = await supabase
      .from('batch_students')
      .select('status')
      .in('batch_id', batchIds);

    const total = enrollments?.length || 0;
    const active = (enrollments || []).filter((e: any) => e.status === 'active').length;

    sendSuccess(res, {
      total,
      active,
      atRisk: 0,
      avgProgress: 0,
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    sendError(res, 'Failed to fetch student statistics');
  }
});

/**
 * GET /api/v2/teacher/students/export
 * Export all students as CSV
 */
router.get('/students/export', ...auth, async (req: Request, res: Response) => {
  try {
    const teacher = await getTeacher(req);
    if (!teacher) return sendNotFound(res, 'Teacher profile');

    const teacherBatches = await batchService.getTeacherBatches(teacher.id);
    const batchIds = teacherBatches.map((tb: any) => (tb.batch || tb).id);

    if (batchIds.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
      return res.send('Name,Email,Phone,Batch,Enrolled Date,Status\n');
    }

    const supabase = getSupabase();
    const { data } = await supabase
      .from('batch_students')
      .select(`
        *,
        batch:batches(name),
        student:students(
          user:users(first_name, last_name, email, phone)
        )
      `)
      .in('batch_id', batchIds)
      .order('enrolled_at', { ascending: false });

    const rows = (data || []).map((enrollment: any) => {
      const user = enrollment.student?.user;
      const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Unknown';
      const email = user?.email || '';
      const phone = user?.phone || '';
      const batchName = enrollment.batch?.name || '';
      const enrolledDate = enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : '';
      const status = enrollment.status || '';

      // Escape CSV fields
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      return [escape(name), escape(email), escape(phone), escape(batchName), escape(enrolledDate), escape(status)].join(',');
    });

    const csv = ['Name,Email,Phone,Batch,Enrolled Date,Status', ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=students-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting students:', error);
    sendError(res, 'Failed to export students');
  }
});

// ============================================
// GROUP C: GRADING (GradingPage)
// ============================================

/**
 * GET /api/v2/teacher/submissions
 * Get exam submissions for teacher's exams
 */
router.get('/submissions', ...auth, async (req: Request, res: Response) => {
  try {
    const teacher = await getTeacher(req);
    if (!teacher) return sendNotFound(res, 'Teacher profile');

    const statusFilter = req.query.status as string | undefined;
    const examId = req.query.examId as string | undefined;
    const search = req.query.search as string | undefined;

    const supabase = getSupabase();

    // Get exams created by this teacher
    let examQuery = supabase
      .from('exams')
      .select('id, title, exam_type, total_marks')
      .eq('created_by', teacher.id);

    if (examId && examId !== 'all') {
      examQuery = examQuery.eq('id', examId);
    }

    const { data: teacherExams, error: examError } = await examQuery;
    if (examError) throw new Error(`Failed to fetch exams: ${examError.message}`);

    if (!teacherExams || teacherExams.length === 0) {
      return sendSuccess(res, []);
    }

    const examIds = teacherExams.map((e: any) => e.id);
    const examMap = new Map(teacherExams.map((e: any) => [e.id, e]));

    // Get attempts for these exams
    let attemptQuery = supabase
      .from('exam_attempts')
      .select(`
        *,
        student:students(
          id,
          user:users(first_name, last_name, avatar_url)
        )
      `)
      .in('exam_id', examIds)
      .in('status', ['submitted', 'auto_submitted', 'graded'])
      .order('submitted_at', { ascending: false });

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        attemptQuery = supabase
          .from('exam_attempts')
          .select(`
            *,
            student:students(
              id,
              user:users(first_name, last_name, avatar_url)
            )
          `)
          .in('exam_id', examIds)
          .in('status', ['submitted', 'auto_submitted'])
          .order('submitted_at', { ascending: false });
      } else if (statusFilter === 'graded') {
        attemptQuery = supabase
          .from('exam_attempts')
          .select(`
            *,
            student:students(
              id,
              user:users(first_name, last_name, avatar_url)
            )
          `)
          .in('exam_id', examIds)
          .eq('status', 'graded')
          .order('submitted_at', { ascending: false });
      }
    }

    const { data: attempts, error: attemptError } = await attemptQuery;
    if (attemptError) throw new Error(`Failed to fetch attempts: ${attemptError.message}`);

    // Build submission objects
    let submissions = await Promise.all(
      (attempts || []).map(async (attempt: any) => {
        const exam = examMap.get(attempt.exam_id) as any;
        const user = attempt.student?.user;
        const studentName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Unknown';

        // Get responses with question details for this attempt
        const { data: responses } = await supabase
          .from('exam_responses')
          .select(`
            *,
            question:questions(id, question_text, question_type, positive_marks),
            exam_question:exam_questions(positive_marks)
          `)
          .eq('attempt_id', attempt.id);

        const answers = (responses || []).map((r: any) => ({
          questionId: r.question_id,
          questionText: r.question?.question_text || '',
          questionType: mapQuestionType(r.question?.question_type),
          studentAnswer: r.text_answer || (r.selected_option_ids || []).join(', ') || String(r.numerical_answer ?? ''),
          correctAnswer: undefined,
          marks: r.marks_awarded || 0,
          maxMarks: r.exam_question?.positive_marks || r.question?.positive_marks || 4,
          isCorrect: r.is_correct,
          feedback: r.grader_feedback || undefined,
        }));

        // Map status
        let submissionStatus: 'pending' | 'graded' | 'needs_review' = 'pending';
        if (attempt.status === 'graded') submissionStatus = 'graded';

        return {
          id: attempt.id,
          student: {
            id: attempt.student?.id || attempt.student_id,
            name: studentName,
            avatar: user?.avatar_url || undefined,
            batch: '',
          },
          exam: {
            id: exam?.id || attempt.exam_id,
            title: exam?.title || 'Unknown Exam',
            type: exam?.exam_type || 'test',
            totalMarks: exam?.total_marks || 0,
          },
          submittedAt: attempt.submitted_at || attempt.created_at,
          status: submissionStatus,
          autoScore: attempt.marks_obtained,
          manualScore: attempt.status === 'graded' ? attempt.marks_obtained : undefined,
          timeTaken: attempt.time_taken_seconds || 0,
          answers,
        };
      })
    );

    // Apply search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      submissions = submissions.filter((s: any) =>
        s.student.name.toLowerCase().includes(searchLower)
      );
    }

    sendSuccess(res, submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    sendError(res, 'Failed to fetch submissions');
  }
});

/**
 * GET /api/v2/teacher/exams
 * Get teacher's exams (optionally only those with submissions)
 */
router.get('/exams', ...auth, async (req: Request, res: Response) => {
  try {
    const teacher = await getTeacher(req);
    if (!teacher) return sendNotFound(res, 'Teacher profile');

    const hasSubmissions = req.query.hasSubmissions === 'true';
    const supabase = getSupabase();

    const { data: exams, error } = await supabase
      .from('exams')
      .select('id, title')
      .eq('created_by', teacher.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch exams: ${error.message}`);

    if (!hasSubmissions) {
      return sendSuccess(res, exams || []);
    }

    // Filter to only exams that have submissions
    const examsWithSubmissions = [];
    for (const exam of exams || []) {
      const { count } = await supabase
        .from('exam_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('exam_id', exam.id)
        .in('status', ['submitted', 'auto_submitted', 'graded']);

      if (count && count > 0) {
        examsWithSubmissions.push(exam);
      }
    }

    sendSuccess(res, examsWithSubmissions);
  } catch (error) {
    console.error('Error fetching teacher exams:', error);
    sendError(res, 'Failed to fetch exams');
  }
});

/**
 * GET /api/v2/teacher/submissions/stats
 * Get grading statistics
 */
router.get('/submissions/stats', ...auth, async (req: Request, res: Response) => {
  try {
    const teacher = await getTeacher(req);
    if (!teacher) return sendNotFound(res, 'Teacher profile');

    const supabase = getSupabase();

    // Get teacher's exam IDs
    const { data: exams } = await supabase
      .from('exams')
      .select('id')
      .eq('created_by', teacher.id);

    const examIds = (exams || []).map((e: any) => e.id);

    if (examIds.length === 0) {
      return sendSuccess(res, { pending: 0, graded: 0, needsReview: 0, avgScore: 0 });
    }

    // Count by status
    const { count: pendingCount } = await supabase
      .from('exam_attempts')
      .select('id', { count: 'exact', head: true })
      .in('exam_id', examIds)
      .in('status', ['submitted', 'auto_submitted']);

    const { count: gradedCount } = await supabase
      .from('exam_attempts')
      .select('id', { count: 'exact', head: true })
      .in('exam_id', examIds)
      .eq('status', 'graded');

    // Average score of graded attempts
    const { data: gradedAttempts } = await supabase
      .from('exam_attempts')
      .select('percentage')
      .in('exam_id', examIds)
      .eq('status', 'graded')
      .not('percentage', 'is', null);

    let avgScore = 0;
    if (gradedAttempts && gradedAttempts.length > 0) {
      const sum = gradedAttempts.reduce((acc: number, a: any) => acc + (a.percentage || 0), 0);
      avgScore = Math.round(sum / gradedAttempts.length);
    }

    sendSuccess(res, {
      pending: pendingCount || 0,
      graded: gradedCount || 0,
      needsReview: 0,
      avgScore,
    });
  } catch (error) {
    console.error('Error fetching submission stats:', error);
    sendError(res, 'Failed to fetch submission statistics');
  }
});

/**
 * POST /api/v2/teacher/submissions/:submissionId/grade
 * Grade a submission (exam attempt)
 */
router.post('/submissions/:submissionId/grade', ...auth, async (req: Request, res: Response) => {
  try {
    const teacher = await getTeacher(req);
    if (!teacher) return sendNotFound(res, 'Teacher profile');

    const submissionId = getParam(req.params.submissionId);
    const { grades } = req.body;

    if (!grades || !Array.isArray(grades)) {
      return sendBadRequest(res, 'grades array is required');
    }

    const supabase = getSupabase();

    // Verify the attempt exists and belongs to teacher's exam
    const attempt = await examAttemptService.getById(submissionId);
    if (!attempt) return sendNotFound(res, 'Submission');

    // Verify teacher owns this exam
    const { data: exam } = await supabase
      .from('exams')
      .select('id, total_marks, created_by')
      .eq('id', attempt.exam_id)
      .single();

    if (!exam || exam.created_by !== teacher.id) {
      return sendBadRequest(res, 'You can only grade submissions for your own exams');
    }

    // Update each response with grades
    let totalMarksAwarded = 0;
    for (const grade of grades) {
      const { questionId, marks, feedback } = grade;

      if (questionId && marks !== undefined) {
        await supabase
          .from('exam_responses')
          .update({
            marks_awarded: marks,
            grader_feedback: feedback || null,
            is_correct: marks > 0,
          })
          .eq('attempt_id', submissionId)
          .eq('question_id', questionId);

        totalMarksAwarded += marks;
      }
    }

    // Recalculate total marks for the attempt
    const { data: allResponses } = await supabase
      .from('exam_responses')
      .select('marks_awarded')
      .eq('attempt_id', submissionId);

    const recalculatedMarks = (allResponses || []).reduce(
      (sum: number, r: any) => sum + (r.marks_awarded || 0),
      0
    );

    const totalExamMarks = exam.total_marks || 1;
    const percentage = Math.round((Math.max(0, recalculatedMarks) / totalExamMarks) * 100 * 100) / 100;

    // Update attempt as graded
    await supabase
      .from('exam_attempts')
      .update({
        status: 'graded',
        marks_obtained: Math.max(0, recalculatedMarks),
        percentage,
        graded_by: teacher.id,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    // Update exam result
    const { data: existingResult } = await supabase
      .from('exam_results')
      .select('*')
      .eq('exam_id', attempt.exam_id)
      .eq('student_id', attempt.student_id)
      .single();

    if (existingResult) {
      const isBetter = Math.max(0, recalculatedMarks) > (existingResult.best_marks || 0);
      await supabase
        .from('exam_results')
        .update({
          ...(isBetter
            ? {
                best_marks: Math.max(0, recalculatedMarks),
                best_percentage: percentage,
                best_attempt_number: attempt.attempt_number,
                attempt_id: submissionId,
              }
            : {}),
          is_passed: existingResult.is_passed || (percentage >= 40),
        })
        .eq('id', existingResult.id);
    }

    sendSuccess(res, { message: 'Submission graded successfully' });
  } catch (error) {
    console.error('Error grading submission:', error);
    sendError(res, 'Failed to grade submission');
  }
});

// ============================================
// HELPERS
// ============================================

function mapQuestionType(dbType: string | undefined): 'mcq' | 'short' | 'long' | 'code' {
  switch (dbType) {
    case 'single_choice':
    case 'multiple_choice':
    case 'true_false':
      return 'mcq';
    case 'numerical':
    case 'fill_blank':
      return 'short';
    case 'subjective':
      return 'long';
    default:
      return 'short';
  }
}

export default router;
