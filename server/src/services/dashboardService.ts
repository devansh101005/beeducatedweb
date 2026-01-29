// Dashboard Service
// Provides statistics and metrics for admin dashboard

import { getSupabase } from '../config/supabase.js';

// Types
export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalBatches: number;
  totalExams: number;
  totalQuestions: number;
  activeEnrollments: number;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface RecentActivity {
  id: string;
  userId: string | null;
  userName: string | null;
  activityType: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TopStudent {
  studentId: string;
  fullName: string;
  email: string;
  totalExamsAttempted: number;
  totalExamsPassed: number;
  averageScore: number;
  highestScore: number;
  passPercentage: number;
}

export interface BatchPerformance {
  batchId: string;
  batchName: string;
  totalStudents: number;
  totalExamAttempts: number;
  avgScore: number;
  passedCount: number;
  failedCount: number;
}

export interface CourseEnrollmentSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
  enrolledStudents: number;
  activeStudents: number;
  completedStudents: number;
  avgProgress: number;
}

export interface ExamStats {
  totalExams: number;
  draftExams: number;
  scheduledExams: number;
  liveExams: number;
  completedExams: number;
  totalAttempts: number;
  avgScore: number;
  passRate: number;
}

class DashboardService {
  private supabase = getSupabase();

  /**
   * Get overall dashboard statistics
   */
  async getOverviewStats(): Promise<DashboardStats> {
    // Run all queries in parallel for performance
    const [
      usersResult,
      studentsResult,
      teachersResult,
      coursesResult,
      batchesResult,
      examsResult,
      questionsResult,
      enrollmentsResult,
    ] = await Promise.all([
      this.supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
      this.supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true),
      this.supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher').eq('is_active', true),
      this.supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      this.supabase.from('batches').select('id', { count: 'exact', head: true }).eq('is_active', true),
      this.supabase.from('exams').select('id', { count: 'exact', head: true }),
      this.supabase.from('questions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      this.supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    return {
      totalUsers: usersResult.count || 0,
      totalStudents: studentsResult.count || 0,
      totalTeachers: teachersResult.count || 0,
      totalCourses: coursesResult.count || 0,
      totalBatches: batchesResult.count || 0,
      totalExams: examsResult.count || 0,
      totalQuestions: questionsResult.count || 0,
      activeEnrollments: enrollmentsResult.count || 0,
    };
  }

  /**
   * Get daily statistics for a date range
   */
  async getDailyStats(startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('daily_stats')
      .select('stat_date, new_users, new_students, new_enrollments, exam_attempts, revenue')
      .gte('stat_date', startDate)
      .lte('stat_date', endDate)
      .order('stat_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch daily stats:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user growth trends
   */
  async getUserGrowthTrend(days: number = 30): Promise<TrendData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('daily_stats')
      .select('stat_date, new_users')
      .gte('stat_date', startDate.toISOString().split('T')[0])
      .order('stat_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch user growth:', error);
      return [];
    }

    return (data || []).map((d) => ({
      date: d.stat_date,
      value: d.new_users || 0,
    }));
  }

  /**
   * Get enrollment trends
   */
  async getEnrollmentTrend(days: number = 30): Promise<TrendData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('daily_stats')
      .select('stat_date, new_enrollments')
      .gte('stat_date', startDate.toISOString().split('T')[0])
      .order('stat_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch enrollment trend:', error);
      return [];
    }

    return (data || []).map((d) => ({
      date: d.stat_date,
      value: d.new_enrollments || 0,
    }));
  }

  /**
   * Get exam performance trends
   */
  async getExamPerformanceTrend(days: number = 30): Promise<TrendData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('daily_stats')
      .select('stat_date, avg_exam_score')
      .gte('stat_date', startDate.toISOString().split('T')[0])
      .order('stat_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch exam performance trend:', error);
      return [];
    }

    return (data || []).map((d) => ({
      date: d.stat_date,
      value: d.avg_exam_score || 0,
    }));
  }

  /**
   * Get recent activity logs
   */
  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    const { data, error } = await this.supabase
      .from('activity_logs')
      .select(`
        id,
        user_id,
        activity_type,
        entity_type,
        entity_id,
        metadata,
        created_at,
        users:user_id (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch recent activity:', error);
      return [];
    }

    return (data || []).map((a) => {
      const userArr = a.users as { full_name: string }[] | null;
      const user = Array.isArray(userArr) ? userArr[0] : userArr;
      return {
        id: a.id,
        userId: a.user_id,
        userName: user?.full_name || null,
        activityType: a.activity_type,
        entityType: a.entity_type,
        entityId: a.entity_id,
        metadata: a.metadata || {},
        createdAt: a.created_at,
      };
    });
  }

  /**
   * Get top performing students
   */
  async getTopStudents(limit: number = 10): Promise<TopStudent[]> {
    const { data, error } = await this.supabase
      .from('student_performance')
      .select(`
        student_id,
        total_exams_attempted,
        total_exams_passed,
        average_score,
        highest_score,
        users:student_id (full_name, email)
      `)
      .gt('total_exams_attempted', 0)
      .order('average_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch top students:', error);
      return [];
    }

    return (data || []).map((s) => {
      const userArr = s.users as { full_name: string; email: string }[] | null;
      const user = Array.isArray(userArr) ? userArr[0] : userArr;
      return {
        studentId: s.student_id,
        fullName: user?.full_name || '',
        email: user?.email || '',
        totalExamsAttempted: s.total_exams_attempted,
        totalExamsPassed: s.total_exams_passed,
        averageScore: s.average_score || 0,
        highestScore: s.highest_score || 0,
        passPercentage: s.total_exams_attempted > 0
          ? Math.round((s.total_exams_passed / s.total_exams_attempted) * 100 * 100) / 100
          : 0,
      };
    });
  }

  /**
   * Get batch performance summary
   */
  async getBatchPerformance(): Promise<BatchPerformance[]> {
    const { data, error } = await this.supabase
      .from('batches')
      .select(`
        id,
        name,
        batch_members (student_id)
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to fetch batch performance:', error);
      return [];
    }

    // Get exam stats for each batch
    const batchPerformance: BatchPerformance[] = [];

    for (const batch of data || []) {
      const members = batch.batch_members as { student_id: string }[] || [];
      const studentIds = members.map((m) => m.student_id);

      if (studentIds.length === 0) {
        batchPerformance.push({
          batchId: batch.id,
          batchName: batch.name,
          totalStudents: 0,
          totalExamAttempts: 0,
          avgScore: 0,
          passedCount: 0,
          failedCount: 0,
        });
        continue;
      }

      // Get exam results for batch students
      const { data: results } = await this.supabase
        .from('exam_results')
        .select(`
          percentage_score,
          is_passed,
          exam_attempts!inner (student_id)
        `)
        .in('exam_attempts.student_id', studentIds);

      const examResults = results || [];
      const avgScore = examResults.length > 0
        ? examResults.reduce((sum, r) => sum + (r.percentage_score || 0), 0) / examResults.length
        : 0;

      batchPerformance.push({
        batchId: batch.id,
        batchName: batch.name,
        totalStudents: studentIds.length,
        totalExamAttempts: examResults.length,
        avgScore: Math.round(avgScore * 100) / 100,
        passedCount: examResults.filter((r) => r.is_passed).length,
        failedCount: examResults.filter((r) => !r.is_passed).length,
      });
    }

    return batchPerformance;
  }

  /**
   * Get course enrollment summary
   */
  async getCourseEnrollmentSummary(): Promise<CourseEnrollmentSummary[]> {
    const { data, error } = await this.supabase
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

    if (error) {
      console.error('Failed to fetch course enrollment summary:', error);
      return [];
    }

    return (data || []).map((c) => {
      const enrollments = c.course_enrollments as { student_id: string; status: string; progress: number }[] || [];
      const activeEnrollments = enrollments.filter((e) => e.status === 'active');
      const completedEnrollments = enrollments.filter((e) => e.status === 'completed');
      const avgProgress = enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
        : 0;

      return {
        courseId: c.id,
        courseName: c.name,
        courseCode: c.code || '',
        enrolledStudents: enrollments.length,
        activeStudents: activeEnrollments.length,
        completedStudents: completedEnrollments.length,
        avgProgress: Math.round(avgProgress * 100) / 100,
      };
    });
  }

  /**
   * Get exam statistics
   */
  async getExamStats(): Promise<ExamStats> {
    // Get exam counts by status
    const [
      totalResult,
      draftResult,
      scheduledResult,
      liveResult,
      completedResult,
      attemptsResult,
      resultsData,
    ] = await Promise.all([
      this.supabase.from('exams').select('id', { count: 'exact', head: true }),
      this.supabase.from('exams').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      this.supabase.from('exams').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
      this.supabase.from('exams').select('id', { count: 'exact', head: true }).eq('status', 'live'),
      this.supabase.from('exams').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      this.supabase.from('exam_attempts').select('id', { count: 'exact', head: true }),
      this.supabase.from('exam_results').select('percentage_score, is_passed'),
    ]);

    const results = resultsData.data || [];
    const avgScore = results.length > 0
      ? results.reduce((sum, r) => sum + (r.percentage_score || 0), 0) / results.length
      : 0;
    const passedCount = results.filter((r) => r.is_passed).length;
    const passRate = results.length > 0 ? (passedCount / results.length) * 100 : 0;

    return {
      totalExams: totalResult.count || 0,
      draftExams: draftResult.count || 0,
      scheduledExams: scheduledResult.count || 0,
      liveExams: liveResult.count || 0,
      completedExams: completedResult.count || 0,
      totalAttempts: attemptsResult.count || 0,
      avgScore: Math.round(avgScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
    };
  }

  /**
   * Log user activity
   */
  async logActivity(
    userId: string | null,
    activityType: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        activity_type: activityType,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log activity:', error);
      return null;
    }

    return data?.id || null;
  }

  /**
   * Trigger daily stats update
   */
  async updateDailyStats(date?: string): Promise<boolean> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { error } = await this.supabase.rpc('update_daily_stats', {
      p_date: targetDate,
    });

    if (error) {
      console.error('Failed to update daily stats:', error);
      return false;
    }

    return true;
  }

  /**
   * Get student's personal dashboard
   */
  async getStudentDashboard(studentId: string) {
    // Get student performance
    const { data: performance } = await this.supabase
      .from('student_performance')
      .select('*')
      .eq('student_id', studentId)
      .single();

    // Get upcoming exams
    const now = new Date().toISOString();
    const { data: upcomingExams } = await this.supabase
      .from('exams')
      .select('id, title, start_time, duration_minutes, total_marks')
      .gte('start_time', now)
      .in('status', ['scheduled', 'live'])
      .order('start_time', { ascending: true })
      .limit(5);

    // Get recent exam results
    const { data: recentResults } = await this.supabase
      .from('exam_results')
      .select(`
        id,
        total_marks_obtained,
        percentage_score,
        is_passed,
        calculated_at,
        exam_attempts!inner (
          exam_id,
          exams (title)
        )
      `)
      .eq('exam_attempts.student_id', studentId)
      .order('calculated_at', { ascending: false })
      .limit(5);

    // Get enrolled courses progress
    const { data: courseProgress } = await this.supabase
      .from('course_enrollments')
      .select(`
        progress,
        status,
        courses (id, name, thumbnail_url)
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');

    return {
      performance: performance || {
        totalExamsAttempted: 0,
        totalExamsPassed: 0,
        averageScore: 0,
        highestScore: 0,
        currentStreak: 0,
      },
      upcomingExams: upcomingExams || [],
      recentResults: recentResults || [],
      courseProgress: courseProgress || [],
    };
  }

  /**
   * Get teacher's dashboard
   */
  async getTeacherDashboard(teacherId: string) {
    // Get batches assigned to teacher
    const { data: batches } = await this.supabase
      .from('batch_teachers')
      .select(`
        batches (
          id,
          name,
          batch_members (student_id)
        )
      `)
      .eq('teacher_id', teacherId);

    const batchIds = (batches || [])
      .map((b) => {
        const batchArr = b.batches as { id: string }[] | { id: string } | null;
        const batch = Array.isArray(batchArr) ? batchArr[0] : batchArr;
        return batch?.id;
      })
      .filter((id): id is string => id != null);

    // Get total students under teacher
    let totalStudents = 0;
    for (const batch of batches || []) {
      const batchArr = batch.batches as { batch_members: { student_id: string }[] }[] | { batch_members: { student_id: string }[] } | null;
      const batchData = Array.isArray(batchArr) ? batchArr[0] : batchArr;
      const members = batchData?.batch_members || [];
      totalStudents += members.length;
    }

    // Get exams created by teacher
    const { data: exams, count: totalExams } = await this.supabase
      .from('exams')
      .select('id, title, status, start_time', { count: 'exact' })
      .eq('created_by', teacherId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get questions created by teacher
    const { count: totalQuestions } = await this.supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', teacherId);

    return {
      totalBatches: batchIds.length,
      totalStudents,
      totalExams: totalExams || 0,
      totalQuestions: totalQuestions || 0,
      recentExams: exams || [],
    };
  }
}

export const dashboardService = new DashboardService();
