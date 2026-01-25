// Report Service
// Handles report generation and management

import { getSupabase } from '../config/supabase.js';

// Types
export type ReportType =
  | 'student_performance'
  | 'batch_report'
  | 'course_report'
  | 'exam_analysis'
  | 'revenue_report'
  | 'enrollment_report'
  | 'question_bank_report';

export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ReportFormat = 'json' | 'csv';

export interface GeneratedReport {
  id: string;
  reportType: ReportType;
  reportName: string;
  description: string | null;
  filters: Record<string, unknown>;
  startDate: string | null;
  endDate: string | null;
  fileUrl: string | null;
  fileFormat: ReportFormat;
  fileSizeBytes: number | null;
  status: ReportStatus;
  errorMessage: string | null;
  generatedBy: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface StudentPerformanceReport {
  studentId: string;
  studentName: string;
  email: string;
  batchName: string | null;
  totalExams: number;
  examsPassed: number;
  examsFailed: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passPercentage: number;
  totalStudyTime: number;
  lastActive: string | null;
}

export interface BatchReport {
  batchId: string;
  batchName: string;
  totalStudents: number;
  activeStudents: number;
  totalExamAttempts: number;
  avgScore: number;
  passRate: number;
  topPerformer: string | null;
  topScore: number;
}

export interface CourseReport {
  courseId: string;
  courseName: string;
  courseCode: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  avgProgress: number;
  totalContent: number;
  contentViews: number;
}

export interface ExamAnalysisReport {
  examId: string;
  examTitle: string;
  totalAttempts: number;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  avgTimeSpent: number;
  questionWiseAnalysis: QuestionAnalysis[];
}

export interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  skipped: number;
  accuracy: number;
  avgTimeSpent: number;
}

export interface EnrollmentReport {
  period: string;
  newEnrollments: number;
  totalEnrollments: number;
  completedEnrollments: number;
  droppedEnrollments: number;
  courseBreakdown: { courseId: string; courseName: string; count: number }[];
}

export interface QuestionBankReport {
  totalQuestions: number;
  byType: { type: string; count: number }[];
  byDifficulty: { difficulty: string; count: number }[];
  bySubject: { subjectId: string; subjectName: string; count: number }[];
  verifiedCount: number;
  unverifiedCount: number;
  recentlyAdded: number;
}

class ReportService {
  private supabase = getSupabase();

  // ============================================
  // REPORT GENERATION
  // ============================================

  /**
   * Generate student performance report
   */
  async generateStudentPerformanceReport(filters: {
    batchId?: string;
    courseId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<StudentPerformanceReport[]> {
    let query = this.supabase
      .from('student_performance')
      .select(`
        student_id,
        total_exams_attempted,
        total_exams_passed,
        total_exams_failed,
        average_score,
        highest_score,
        lowest_score,
        total_study_time_minutes,
        last_active_date,
        users:student_id (
          full_name,
          email
        )
      `)
      .gt('total_exams_attempted', 0);

    // Apply filters
    if (filters.batchId) {
      // Get students in batch
      const { data: members } = await this.supabase
        .from('batch_members')
        .select('student_id')
        .eq('batch_id', filters.batchId)
        .eq('status', 'active');

      const studentIds = (members || []).map((m) => m.student_id);
      if (studentIds.length > 0) {
        query = query.in('student_id', studentIds);
      }
    }

    const { data, error } = await query.order('average_score', { ascending: false });

    if (error) {
      console.error('Failed to generate student performance report:', error);
      return [];
    }

    // Get batch names for students
    const studentIds = (data || []).map((d) => d.student_id);
    const { data: batchData } = await this.supabase
      .from('batch_members')
      .select('student_id, batches (name)')
      .in('student_id', studentIds)
      .eq('status', 'active');

    const batchMap = new Map<string, string>();
    for (const b of batchData || []) {
      const batchArr = b.batches as { name: string }[] | { name: string } | null;
      const batch = Array.isArray(batchArr) ? batchArr[0] : batchArr;
      if (batch) {
        batchMap.set(b.student_id, batch.name);
      }
    }

    return (data || []).map((s) => {
      const userArr = s.users as { full_name: string; email: string }[] | { full_name: string; email: string } | null;
      const user = Array.isArray(userArr) ? userArr[0] : userArr;
      return {
        studentId: s.student_id,
        studentName: user?.full_name || '',
        email: user?.email || '',
        batchName: batchMap.get(s.student_id) || null,
        totalExams: s.total_exams_attempted,
        examsPassed: s.total_exams_passed,
        examsFailed: s.total_exams_failed,
        averageScore: s.average_score || 0,
        highestScore: s.highest_score || 0,
        lowestScore: s.lowest_score || 0,
        passPercentage: s.total_exams_attempted > 0
          ? Math.round((s.total_exams_passed / s.total_exams_attempted) * 100 * 100) / 100
          : 0,
        totalStudyTime: s.total_study_time_minutes || 0,
        lastActive: s.last_active_date,
      };
    });
  }

  /**
   * Generate batch report
   */
  async generateBatchReport(filters: {
    batchIds?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<BatchReport[]> {
    let query = this.supabase
      .from('batches')
      .select(`
        id,
        name,
        batch_members (
          student_id,
          status
        )
      `)
      .eq('is_active', true);

    if (filters.batchIds && filters.batchIds.length > 0) {
      query = query.in('id', filters.batchIds);
    }

    const { data: batches, error } = await query;

    if (error) {
      console.error('Failed to generate batch report:', error);
      return [];
    }

    const reports: BatchReport[] = [];

    for (const batch of batches || []) {
      const members = batch.batch_members as { student_id: string; status: string }[] || [];
      const activeMembers = members.filter((m) => m.status === 'active');
      const studentIds = activeMembers.map((m) => m.student_id);

      if (studentIds.length === 0) {
        reports.push({
          batchId: batch.id,
          batchName: batch.name,
          totalStudents: members.length,
          activeStudents: 0,
          totalExamAttempts: 0,
          avgScore: 0,
          passRate: 0,
          topPerformer: null,
          topScore: 0,
        });
        continue;
      }

      // Get exam results for students
      let resultsQuery = this.supabase
        .from('exam_results')
        .select(`
          percentage_score,
          is_passed,
          exam_attempts!inner (
            student_id
          )
        `)
        .in('exam_attempts.student_id', studentIds);

      if (filters.startDate) {
        resultsQuery = resultsQuery.gte('calculated_at', filters.startDate);
      }
      if (filters.endDate) {
        resultsQuery = resultsQuery.lte('calculated_at', filters.endDate);
      }

      const { data: results } = await resultsQuery;
      const examResults = results || [];

      // Get top performer
      const { data: topStudent } = await this.supabase
        .from('student_performance')
        .select('student_id, average_score, users:student_id (full_name)')
        .in('student_id', studentIds)
        .order('average_score', { ascending: false })
        .limit(1)
        .single();

      const avgScore = examResults.length > 0
        ? examResults.reduce((sum, r) => sum + (r.percentage_score || 0), 0) / examResults.length
        : 0;

      const passedCount = examResults.filter((r) => r.is_passed).length;
      const passRate = examResults.length > 0 ? (passedCount / examResults.length) * 100 : 0;

      let topPerformerName: string | null = null;
      if (topStudent) {
        const userArr = topStudent.users as { full_name: string }[] | { full_name: string } | null;
        const user = Array.isArray(userArr) ? userArr[0] : userArr;
        topPerformerName = user?.full_name || null;
      }

      reports.push({
        batchId: batch.id,
        batchName: batch.name,
        totalStudents: members.length,
        activeStudents: activeMembers.length,
        totalExamAttempts: examResults.length,
        avgScore: Math.round(avgScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        topPerformer: topPerformerName,
        topScore: topStudent?.average_score || 0,
      });
    }

    return reports;
  }

  /**
   * Generate course report
   */
  async generateCourseReport(filters: {
    courseIds?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<CourseReport[]> {
    let query = this.supabase
      .from('courses')
      .select(`
        id,
        name,
        code,
        course_enrollments (
          student_id,
          status,
          progress
        )
      `)
      .eq('is_active', true);

    if (filters.courseIds && filters.courseIds.length > 0) {
      query = query.in('id', filters.courseIds);
    }

    const { data: courses, error } = await query;

    if (error) {
      console.error('Failed to generate course report:', error);
      return [];
    }

    const reports: CourseReport[] = [];

    for (const course of courses || []) {
      const enrollments = course.course_enrollments as { student_id: string; status: string; progress: number }[] || [];

      // Get content count and views
      const { count: contentCount } = await this.supabase
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', course.id)
        .eq('is_published', true);

      const { count: viewCount } = await this.supabase
        .from('content_progress')
        .select('id', { count: 'exact', head: true })
        .eq('content.course_id', course.id);

      const activeEnrollments = enrollments.filter((e) => e.status === 'active');
      const completedEnrollments = enrollments.filter((e) => e.status === 'completed');
      const avgProgress = enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
        : 0;

      reports.push({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code || '',
        totalEnrollments: enrollments.length,
        activeEnrollments: activeEnrollments.length,
        completedEnrollments: completedEnrollments.length,
        avgProgress: Math.round(avgProgress * 100) / 100,
        totalContent: contentCount || 0,
        contentViews: viewCount || 0,
      });
    }

    return reports;
  }

  /**
   * Generate exam analysis report
   */
  async generateExamAnalysisReport(examId: string): Promise<ExamAnalysisReport | null> {
    // Get exam details
    const { data: exam, error: examError } = await this.supabase
      .from('exams')
      .select('id, title')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      console.error('Failed to fetch exam:', examError);
      return null;
    }

    // Get all attempts for this exam
    const { data: attempts } = await this.supabase
      .from('exam_attempts')
      .select(`
        id,
        time_spent_seconds,
        exam_results (
          percentage_score,
          is_passed
        )
      `)
      .eq('exam_id', examId)
      .eq('status', 'graded');

    const examAttempts = attempts || [];
    const results = examAttempts
      .map((a) => a.exam_results)
      .flat()
      .filter((r): r is { percentage_score: number; is_passed: boolean } => r != null);

    const scores = results.map((r) => r.percentage_score || 0);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passedCount = results.filter((r) => r.is_passed).length;
    const passRate = results.length > 0 ? (passedCount / results.length) * 100 : 0;

    const timeSpent = examAttempts.map((a) => a.time_spent_seconds || 0);
    const avgTimeSpent = timeSpent.length > 0
      ? timeSpent.reduce((a, b) => a + b, 0) / timeSpent.length
      : 0;

    // Get question-wise analysis
    const { data: questions } = await this.supabase
      .from('exam_questions')
      .select(`
        question_id,
        questions (
          id,
          question_text
        )
      `)
      .eq('exam_id', examId);

    const questionAnalysis: QuestionAnalysis[] = [];

    for (const eq of questions || []) {
      const questionArr = eq.questions as { id: string; question_text: string }[] | { id: string; question_text: string } | null;
      const question = Array.isArray(questionArr) ? questionArr[0] : questionArr;
      if (!question) continue;

      // Get responses for this question
      const { data: responses } = await this.supabase
        .from('exam_responses')
        .select('is_correct, is_skipped, time_spent_seconds')
        .eq('question_id', question.id)
        .in('attempt_id', examAttempts.map((a) => a.id));

      const questionResponses = responses || [];
      const correctCount = questionResponses.filter((r) => r.is_correct).length;
      const incorrectCount = questionResponses.filter((r) => !r.is_correct && !r.is_skipped).length;
      const skippedCount = questionResponses.filter((r) => r.is_skipped).length;
      const accuracy = questionResponses.length > 0
        ? (correctCount / questionResponses.length) * 100
        : 0;
      const qTimeSpent = questionResponses.map((r) => r.time_spent_seconds || 0);
      const qAvgTime = qTimeSpent.length > 0
        ? qTimeSpent.reduce((a, b) => a + b, 0) / qTimeSpent.length
        : 0;

      questionAnalysis.push({
        questionId: question.id,
        questionText: question.question_text.substring(0, 100) + (question.question_text.length > 100 ? '...' : ''),
        totalAttempts: questionResponses.length,
        correctAttempts: correctCount,
        incorrectAttempts: incorrectCount,
        skipped: skippedCount,
        accuracy: Math.round(accuracy * 100) / 100,
        avgTimeSpent: Math.round(qAvgTime),
      });
    }

    return {
      examId: exam.id,
      examTitle: exam.title,
      totalAttempts: examAttempts.length,
      avgScore: Math.round(avgScore * 100) / 100,
      highestScore,
      lowestScore,
      passRate: Math.round(passRate * 100) / 100,
      avgTimeSpent: Math.round(avgTimeSpent),
      questionWiseAnalysis: questionAnalysis,
    };
  }

  /**
   * Generate enrollment report
   */
  async generateEnrollmentReport(filters: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<EnrollmentReport[]> {
    const { data: enrollments, error } = await this.supabase
      .from('course_enrollments')
      .select(`
        id,
        status,
        enrolled_at,
        course_id,
        courses (name)
      `)
      .gte('enrolled_at', filters.startDate)
      .lte('enrolled_at', filters.endDate)
      .order('enrolled_at', { ascending: true });

    if (error) {
      console.error('Failed to generate enrollment report:', error);
      return [];
    }

    // Group by period
    const groupBy = filters.groupBy || 'day';
    const grouped = new Map<string, typeof enrollments>();

    for (const enrollment of enrollments || []) {
      const date = new Date(enrollment.enrolled_at);
      let period: string;

      if (groupBy === 'day') {
        period = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        period = `Week of ${weekStart.toISOString().split('T')[0]}`;
      } else {
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped.has(period)) {
        grouped.set(period, []);
      }
      grouped.get(period)!.push(enrollment);
    }

    const reports: EnrollmentReport[] = [];
    let totalEnrollments = 0;

    for (const [period, periodEnrollments] of grouped) {
      totalEnrollments += periodEnrollments.length;

      // Count by course
      const courseCount = new Map<string, { courseId: string; courseName: string; count: number }>();
      for (const e of periodEnrollments) {
        const courseId = e.course_id;
        const courseArr = e.courses as { name: string }[] | { name: string } | null;
        const course = Array.isArray(courseArr) ? courseArr[0] : courseArr;
        const courseName = course?.name || '';
        if (!courseCount.has(courseId)) {
          courseCount.set(courseId, { courseId, courseName, count: 0 });
        }
        courseCount.get(courseId)!.count++;
      }

      reports.push({
        period,
        newEnrollments: periodEnrollments.length,
        totalEnrollments,
        completedEnrollments: periodEnrollments.filter((e) => e.status === 'completed').length,
        droppedEnrollments: periodEnrollments.filter((e) => e.status === 'dropped').length,
        courseBreakdown: Array.from(courseCount.values()),
      });
    }

    return reports;
  }

  /**
   * Generate question bank report
   */
  async generateQuestionBankReport(): Promise<QuestionBankReport> {
    // Get total count
    const { count: totalCount } = await this.supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get by type
    const { data: typeData } = await this.supabase
      .from('questions')
      .select('question_type')
      .eq('is_active', true);

    const typeCounts = new Map<string, number>();
    for (const q of typeData || []) {
      const type = q.question_type || 'unknown';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }

    // Get by difficulty
    const { data: difficultyData } = await this.supabase
      .from('questions')
      .select('difficulty')
      .eq('is_active', true);

    const difficultyCounts = new Map<string, number>();
    for (const q of difficultyData || []) {
      const difficulty = q.difficulty || 'medium';
      difficultyCounts.set(difficulty, (difficultyCounts.get(difficulty) || 0) + 1);
    }

    // Get by subject
    const { data: subjectData } = await this.supabase
      .from('questions')
      .select('subject_id, subjects (name)')
      .eq('is_active', true)
      .not('subject_id', 'is', null);

    const subjectCounts = new Map<string, { subjectId: string; subjectName: string; count: number }>();
    for (const q of subjectData || []) {
      const subjectId = q.subject_id;
      const subjectArr = q.subjects as { name: string }[] | { name: string } | null;
      const subject = Array.isArray(subjectArr) ? subjectArr[0] : subjectArr;
      const subjectName = subject?.name || '';
      if (!subjectCounts.has(subjectId)) {
        subjectCounts.set(subjectId, { subjectId, subjectName, count: 0 });
      }
      subjectCounts.get(subjectId)!.count++;
    }

    // Get verified/unverified counts
    const { count: verifiedCount } = await this.supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_verified', true);

    // Get recently added (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: recentCount } = await this.supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      totalQuestions: totalCount || 0,
      byType: Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count })),
      byDifficulty: Array.from(difficultyCounts.entries()).map(([difficulty, count]) => ({ difficulty, count })),
      bySubject: Array.from(subjectCounts.values()),
      verifiedCount: verifiedCount || 0,
      unverifiedCount: (totalCount || 0) - (verifiedCount || 0),
      recentlyAdded: recentCount || 0,
    };
  }

  // ============================================
  // REPORT TRACKING
  // ============================================

  /**
   * Create a report record
   */
  async createReportRecord(input: {
    reportType: ReportType;
    reportName: string;
    description?: string;
    filters?: Record<string, unknown>;
    startDate?: string;
    endDate?: string;
    fileFormat?: ReportFormat;
    generatedBy?: string;
  }): Promise<GeneratedReport | null> {
    const { data, error } = await this.supabase
      .from('generated_reports')
      .insert({
        report_type: input.reportType,
        report_name: input.reportName,
        description: input.description,
        filters: input.filters || {},
        start_date: input.startDate,
        end_date: input.endDate,
        file_format: input.fileFormat || 'json',
        status: 'pending',
        generated_by: input.generatedBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create report record:', error);
      return null;
    }

    return this.mapToGeneratedReport(data);
  }

  /**
   * Update report status
   */
  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    fileUrl?: string,
    fileSizeBytes?: number,
    errorMessage?: string
  ): Promise<boolean> {
    const updateData: Record<string, unknown> = { status };

    if (fileUrl) updateData.file_url = fileUrl;
    if (fileSizeBytes) updateData.file_size_bytes = fileSizeBytes;
    if (errorMessage) updateData.error_message = errorMessage;
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const { error } = await this.supabase
      .from('generated_reports')
      .update(updateData)
      .eq('id', reportId);

    if (error) {
      console.error('Failed to update report status:', error);
      return false;
    }

    return true;
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string): Promise<GeneratedReport | null> {
    const { data, error } = await this.supabase
      .from('generated_reports')
      .select()
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('Failed to fetch report:', error);
      return null;
    }

    return this.mapToGeneratedReport(data);
  }

  /**
   * List reports
   */
  async listReports(filters: {
    reportType?: ReportType;
    status?: ReportStatus;
    generatedBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ reports: GeneratedReport[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('generated_reports')
      .select('*', { count: 'exact' });

    if (filters.reportType) {
      query = query.eq('report_type', filters.reportType);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.generatedBy) {
      query = query.eq('generated_by', filters.generatedBy);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to list reports:', error);
      return { reports: [], total: 0 };
    }

    return {
      reports: (data || []).map(this.mapToGeneratedReport),
      total: count || 0,
    };
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('generated_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Failed to delete report:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // HELPERS
  // ============================================

  private mapToGeneratedReport(data: Record<string, unknown>): GeneratedReport {
    return {
      id: data.id as string,
      reportType: data.report_type as ReportType,
      reportName: data.report_name as string,
      description: data.description as string | null,
      filters: (data.filters as Record<string, unknown>) || {},
      startDate: data.start_date as string | null,
      endDate: data.end_date as string | null,
      fileUrl: data.file_url as string | null,
      fileFormat: (data.file_format as ReportFormat) || 'json',
      fileSizeBytes: data.file_size_bytes as number | null,
      status: (data.status as ReportStatus) || 'pending',
      errorMessage: data.error_message as string | null,
      generatedBy: data.generated_by as string | null,
      createdAt: data.created_at as string,
      completedAt: data.completed_at as string | null,
    };
  }

  /**
   * Convert report data to CSV format
   */
  convertToCSV<T extends object>(data: T[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const rowRecord = row as Record<string, unknown>;
      const values = headers.map((header) => {
        const value = rowRecord[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma
          const escaped = value.replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        }
        return String(value);
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

export const reportService = new ReportService();
