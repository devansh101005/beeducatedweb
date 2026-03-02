// Exam Attempt Service
// Handles exam attempts, responses, and results

import { getSupabase } from '../config/supabase.js';
import { examService, Exam } from './examService.js';

// Types
export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted' | 'graded' | 'abandoned';

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  time_taken_seconds: number | null;
  status: AttemptStatus;
  attempt_number: number;
  tab_switch_count: number;
  ip_address: string | null;
  user_agent: string | null;
  question_order: string[] | null;
  total_questions: number | null;
  attempted_questions: number;
  correct_answers: number | null;
  wrong_answers: number | null;
  skipped_questions: number | null;
  marks_obtained: number | null;
  percentage: number | null;
  rank: number | null;
  graded_at: string | null;
  graded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  exam_question_id: string | null;
  selected_option_ids: string[] | null;
  numerical_answer: number | null;
  text_answer: string | null;
  is_marked_for_review: boolean;
  is_attempted: boolean;
  time_spent_seconds: number;
  is_correct: boolean | null;
  marks_awarded: number | null;
  grader_feedback: string | null;
  answered_at: string | null;
  last_modified_at: string;
  created_at: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  attempt_id: string;
  best_marks: number | null;
  best_percentage: number | null;
  best_attempt_number: number | null;
  total_attempts: number;
  average_marks: number | null;
  average_percentage: number | null;
  rank: number | null;
  percentile: number | null;
  is_passed: boolean | null;
  batch_type: string | null;
  class_grade: string | null;
  certificate_issued: boolean;
  certificate_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StartAttemptInput {
  exam_id: string;
  student_id: string;
  ip_address?: string;
  user_agent?: string;
  access_code?: string;
}

export interface SaveResponseInput {
  question_id: string;
  exam_question_id?: string;
  selected_option_ids?: string[];
  numerical_answer?: number;
  text_answer?: string;
  is_marked_for_review?: boolean;
  time_spent_seconds?: number;
}

class ExamAttemptService {
  private supabase = getSupabase();

  // ============================================
  // ATTEMPT MANAGEMENT
  // ============================================

  /**
   * Get attempt by ID
   */
  async getById(id: string): Promise<ExamAttempt | null> {
    const { data, error } = await this.supabase
      .from('exam_attempts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get attempt: ${error.message}`);
    }

    return data as ExamAttempt;
  }

  /**
   * Get attempt with responses
   */
  async getWithResponses(id: string): Promise<(ExamAttempt & { responses: ExamResponse[] }) | null> {
    const { data, error } = await this.supabase
      .from('exam_attempts')
      .select(`
        *,
        responses:exam_responses(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get attempt: ${error.message}`);
    }

    return data as ExamAttempt & { responses: ExamResponse[] };
  }

  /**
   * Start a new exam attempt
   */
  async startAttempt(input: StartAttemptInput): Promise<ExamAttempt & { questions: unknown[] }> {
    const { exam_id, student_id, ip_address, user_agent, access_code } = input;

    // Get exam
    const exam = await examService.getById(exam_id);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Validate exam is available
    const now = new Date();
    if (exam.status !== 'live' && exam.status !== 'scheduled') {
      throw new Error('Exam is not available');
    }

    // Allow entry 10 minutes before start time
    if (exam.start_time) {
      const startTime = new Date(exam.start_time);
      const minsUntilStart = (startTime.getTime() - now.getTime()) / 60000;
      if (minsUntilStart > 10) {
        throw new Error('Exam has not started yet');
      }
    }

    if (exam.end_time && new Date(exam.end_time) < now) {
      throw new Error('Exam has ended');
    }

    // Validate access code if required
    if (exam.access_code && exam.access_code !== access_code) {
      throw new Error('Invalid access code');
    }

    // Check attempt count
    const { count: attemptCount } = await this.supabase
      .from('exam_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('exam_id', exam_id)
      .eq('student_id', student_id)
      .in('status', ['submitted', 'auto_submitted', 'graded']);

    if (attemptCount && attemptCount >= exam.max_attempts) {
      throw new Error(`Maximum attempts (${exam.max_attempts}) reached`);
    }

    // Check for in-progress attempt
    const { data: existingAttempt } = await this.supabase
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', exam_id)
      .eq('student_id', student_id)
      .eq('status', 'in_progress')
      .single();

    if (existingAttempt) {
      // If exam has ended, auto-submit this attempt instead of returning it
      if (exam.end_time && new Date(exam.end_time) < now) {
        await this.submitAttempt(existingAttempt.id, true);
        throw new Error('Exam has ended');
      }
      // Return existing attempt
      const questions = await this.getAttemptQuestions(existingAttempt.id, exam);
      return {
        ...existingAttempt,
        questions,
      } as ExamAttempt & { questions: unknown[] };
    }

    // Get questions for exam
    const examQuestions = await examService.getQuestions(exam_id);

    // Generate question order
    let questionOrder = examQuestions.map((eq) => eq.question_id);
    if (exam.shuffle_questions) {
      questionOrder = questionOrder.sort(() => Math.random() - 0.5);
    }

    // Create attempt
    const { data: attempt, error } = await this.supabase
      .from('exam_attempts')
      .insert({
        exam_id,
        student_id,
        attempt_number: (attemptCount || 0) + 1,
        ip_address,
        user_agent,
        question_order: questionOrder,
        total_questions: questionOrder.length,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (race condition: two simultaneous attempts)
      if (error.code === '23505') {
        const { data: raceAttempt } = await this.supabase
          .from('exam_attempts')
          .select('*')
          .eq('exam_id', exam_id)
          .eq('student_id', student_id)
          .eq('status', 'in_progress')
          .single();
        if (raceAttempt) {
          const questions = await this.getAttemptQuestions(raceAttempt.id, exam);
          return { ...raceAttempt, questions } as ExamAttempt & { questions: unknown[] };
        }
      }
      throw new Error(`Failed to start attempt: ${error.message}`);
    }

    // Create empty responses for all questions
    const responses = questionOrder.map((qId) => {
      const eq = examQuestions.find((e) => e.question_id === qId);
      return {
        attempt_id: attempt.id,
        question_id: qId,
        exam_question_id: eq?.id,
      };
    });

    await this.supabase.from('exam_responses').insert(responses);

    // Get questions with shuffled options if needed
    const questions = await this.getAttemptQuestions(attempt.id, exam);

    return {
      ...attempt,
      questions,
    } as ExamAttempt & { questions: unknown[] };
  }

  /**
   * Get questions for an attempt (respecting shuffle settings)
   */
  private async getAttemptQuestions(attemptId: string, exam: Exam): Promise<unknown[]> {
    const attempt = await this.getById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    const questionOrder = attempt.question_order || [];

    // Get questions with options
    const { data: questions, error } = await this.supabase
      .from('questions')
      .select(`
        *,
        options:question_options(*)
      `)
      .in('id', questionOrder);

    if (error) {
      throw new Error(`Failed to get questions: ${error.message}`);
    }

    // Order by attempt's question order
    const orderedQuestions = questionOrder.map((qId) =>
      questions?.find((q) => q.id === qId)
    ).filter(Boolean);

    // Shuffle options if needed
    if (exam.shuffle_options) {
      orderedQuestions.forEach((q) => {
        if (q?.options) {
          q.options = q.options.sort(() => Math.random() - 0.5);
        }
      });
    }

    // Remove correct answer info (for student view)
    return orderedQuestions.map((q) => ({
      ...q,
      numerical_answer: undefined,
      model_answer: undefined,
      explanation: undefined,
      options: q?.options?.map((opt: { id: string; option_text: string; option_html: string | null; option_image_url: string | null; sequence_order: number }) => ({
        id: opt.id,
        option_text: opt.option_text,
        option_html: opt.option_html,
        option_image_url: opt.option_image_url,
        sequence_order: opt.sequence_order,
        // is_correct is hidden
      })),
    }));
  }

  /**
   * Save response for a question
   */
  async saveResponse(attemptId: string, input: SaveResponseInput): Promise<ExamResponse> {
    const attempt = await this.getById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.status !== 'in_progress') {
      throw new Error('Attempt is not in progress');
    }

    const isAttempted = !!(
      (input.selected_option_ids && input.selected_option_ids.length > 0) ||
      input.numerical_answer !== undefined ||
      (input.text_answer && input.text_answer.trim().length > 0)
    );

    const { data, error } = await this.supabase
      .from('exam_responses')
      .upsert({
        attempt_id: attemptId,
        question_id: input.question_id,
        exam_question_id: input.exam_question_id || null,
        selected_option_ids: input.selected_option_ids,
        numerical_answer: input.numerical_answer,
        text_answer: input.text_answer,
        is_marked_for_review: input.is_marked_for_review ?? false,
        is_attempted: isAttempted,
        time_spent_seconds: input.time_spent_seconds || 0,
        answered_at: isAttempted ? new Date().toISOString() : null,
        last_modified_at: new Date().toISOString(),
      }, { onConflict: 'attempt_id,question_id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save response: ${error.message}`);
    }

    // Update attempted count
    const { count: attemptedCount } = await this.supabase
      .from('exam_responses')
      .select('id', { count: 'exact', head: true })
      .eq('attempt_id', attemptId)
      .eq('is_attempted', true);

    await this.supabase
      .from('exam_attempts')
      .update({ attempted_questions: attemptedCount || 0 })
      .eq('id', attemptId);

    return data as ExamResponse;
  }

  /**
   * Submit exam attempt
   */
  async submitAttempt(attemptId: string, autoSubmit: boolean = false): Promise<ExamAttempt> {
    const attempt = await this.getById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.status !== 'in_progress') {
      throw new Error('Attempt is not in progress');
    }

    const now = new Date();
    const startedAt = new Date(attempt.started_at);
    const timeTaken = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    // Grade MCQ responses
    await this.gradeResponses(attemptId);

    // Calculate results
    const results = await this.calculateResults(attemptId);

    // Update attempt
    const { data, error } = await this.supabase
      .from('exam_attempts')
      .update({
        status: autoSubmit ? 'auto_submitted' : 'submitted',
        submitted_at: now.toISOString(),
        time_taken_seconds: timeTaken,
        correct_answers: results.correct,
        wrong_answers: results.wrong,
        skipped_questions: results.skipped,
        marks_obtained: results.marks,
        percentage: results.percentage,
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit attempt: ${error.message}`);
    }

    // Update exam result
    await this.updateExamResult(attemptId);

    return data as ExamAttempt;
  }

  /**
   * Grade MCQ responses automatically
   */
  private async gradeResponses(attemptId: string): Promise<void> {
    // Get all responses with question details
    const { data: responses, error } = await this.supabase
      .from('exam_responses')
      .select(`
        *,
        question:questions(*),
        exam_question:exam_questions(*)
      `)
      .eq('attempt_id', attemptId);

    if (error) {
      throw new Error(`Failed to get responses: ${error.message}`);
    }

    for (const response of responses || []) {
      const question = response.question;
      if (!question) continue;

      // Skip subjective questions (manual grading)
      if (question.question_type === 'subjective') {
        continue;
      }

      // Get marks
      const positiveMarks = response.exam_question?.positive_marks || question.positive_marks || 4;
      const negativeMarks = response.exam_question?.negative_marks || question.negative_marks || 1;

      let isCorrect: boolean | null = null;
      let marksAwarded: number = 0;

      if (!response.is_attempted) {
        // Not attempted - no marks
        isCorrect = null;
        marksAwarded = 0;
      } else if (question.question_type === 'numerical') {
        // Numerical answer
        if (response.numerical_answer !== null && question.numerical_answer !== null) {
          const tolerance = question.numerical_tolerance || 0;
          isCorrect = Math.abs(response.numerical_answer - question.numerical_answer) <= tolerance;
          marksAwarded = isCorrect ? positiveMarks : -negativeMarks;
        }
      } else {
        // MCQ (single/multiple choice, true/false)
        const { data: correctOptions } = await this.supabase
          .from('question_options')
          .select('id')
          .eq('question_id', question.id)
          .eq('is_correct', true);

        const correctIds = (correctOptions || []).map((o) => o.id);
        const selectedIds = response.selected_option_ids || [];

        if (question.question_type === 'single_choice' || question.question_type === 'true_false') {
          isCorrect = selectedIds.length === 1 && correctIds.includes(selectedIds[0]);
          marksAwarded = isCorrect ? positiveMarks : -negativeMarks;
        } else if (question.question_type === 'multiple_choice') {
          const allCorrect = correctIds.every((id: string) => selectedIds.includes(id)) &&
            selectedIds.every((id: string) => correctIds.includes(id));

          if (allCorrect) {
            isCorrect = true;
            marksAwarded = positiveMarks;
          } else if (question.partial_marks_allowed) {
            // Partial marks if all selected are correct (but not all correct selected)
            const allSelectedCorrect = selectedIds.every((id: string) => correctIds.includes(id));
            if (allSelectedCorrect && selectedIds.length > 0) {
              isCorrect = false; // Partially correct
              marksAwarded = positiveMarks * (selectedIds.length / correctIds.length);
            } else {
              isCorrect = false;
              marksAwarded = -negativeMarks;
            }
          } else {
            isCorrect = false;
            marksAwarded = -negativeMarks;
          }
        }
      }

      // Update response
      await this.supabase
        .from('exam_responses')
        .update({
          is_correct: isCorrect,
          marks_awarded: marksAwarded,
        })
        .eq('id', response.id);
    }
  }

  /**
   * Calculate results for an attempt
   */
  private async calculateResults(attemptId: string): Promise<{
    correct: number;
    wrong: number;
    skipped: number;
    marks: number;
    percentage: number;
  }> {
    const attempt = await this.getById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    const exam = await examService.getById(attempt.exam_id);
    if (!exam) {
      throw new Error('Exam not found');
    }

    const { data: responses } = await this.supabase
      .from('exam_responses')
      .select('is_correct, is_attempted, marks_awarded')
      .eq('attempt_id', attemptId);

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let marks = 0;

    (responses || []).forEach((r) => {
      if (!r.is_attempted) {
        skipped++;
      } else if (r.is_correct === true) {
        correct++;
        marks += r.marks_awarded || 0;
      } else if (r.is_correct === false) {
        wrong++;
        marks += r.marks_awarded || 0; // Negative marks
      }
    });

    const totalMarks = exam.total_marks || 0;
    const percentage = totalMarks > 0 ? Math.round((marks / totalMarks) * 100 * 100) / 100 : 0;

    return { correct, wrong, skipped, marks: Math.max(0, marks), percentage };
  }

  /**
   * Update exam result record
   */
  private async updateExamResult(attemptId: string): Promise<void> {
    const attempt = await this.getById(attemptId);
    if (!attempt) return;

    const exam = await examService.getById(attempt.exam_id);
    if (!exam) return;

    const isPassed = exam.passing_marks ? (attempt.marks_obtained || 0) >= exam.passing_marks : true;

    // Check if result exists
    const { data: existingResult } = await this.supabase
      .from('exam_results')
      .select('*')
      .eq('exam_id', attempt.exam_id)
      .eq('student_id', attempt.student_id)
      .single();

    if (existingResult) {
      // Update existing
      const newBest = (attempt.marks_obtained || 0) > (existingResult.best_marks || 0);
      const totalAttempts = existingResult.total_attempts + 1;
      const avgMarks = ((existingResult.average_marks || 0) * existingResult.total_attempts + (attempt.marks_obtained || 0)) / totalAttempts;
      const avgPercent = ((existingResult.average_percentage || 0) * existingResult.total_attempts + (attempt.percentage || 0)) / totalAttempts;

      await this.supabase
        .from('exam_results')
        .update({
          attempt_id: newBest ? attemptId : existingResult.attempt_id,
          best_marks: newBest ? attempt.marks_obtained : existingResult.best_marks,
          best_percentage: newBest ? attempt.percentage : existingResult.best_percentage,
          best_attempt_number: newBest ? attempt.attempt_number : existingResult.best_attempt_number,
          total_attempts: totalAttempts,
          average_marks: avgMarks,
          average_percentage: avgPercent,
          is_passed: existingResult.is_passed || isPassed,
        })
        .eq('id', existingResult.id);
    } else {
      // Create new — include batch_type and class_grade from exam targeting
      await this.supabase
        .from('exam_results')
        .insert({
          exam_id: attempt.exam_id,
          student_id: attempt.student_id,
          attempt_id: attemptId,
          best_marks: attempt.marks_obtained,
          best_percentage: attempt.percentage,
          best_attempt_number: attempt.attempt_number,
          total_attempts: 1,
          average_marks: attempt.marks_obtained,
          average_percentage: attempt.percentage,
          is_passed: isPassed,
          batch_type: exam.target_batch_type || null,
          class_grade: exam.target_class || null,
        });
    }
  }

  /**
   * Record tab switch
   */
  async recordTabSwitch(attemptId: string): Promise<{ count: number; exceeded: boolean }> {
    const attempt = await this.getById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    const exam = await examService.getById(attempt.exam_id);
    if (!exam) {
      throw new Error('Exam not found');
    }

    const newCount = (attempt.tab_switch_count || 0) + 1;

    await this.supabase
      .from('exam_attempts')
      .update({ tab_switch_count: newCount })
      .eq('id', attemptId);

    const exceeded = exam.enable_tab_switch_detection && newCount >= exam.max_tab_switches;

    if (exceeded) {
      // Auto-submit if exceeded
      await this.submitAttempt(attemptId, true);
    }

    return { count: newCount, exceeded };
  }

  /**
   * Auto-submit all expired in-progress attempts
   * Called periodically by server interval
   */
  async autoSubmitExpiredAttempts(): Promise<number> {
    // Find all in-progress attempts where the exam has ended
    const { data: expiredAttempts, error } = await this.supabase
      .from('exam_attempts')
      .select('id, exam_id')
      .eq('status', 'in_progress');

    if (error || !expiredAttempts || expiredAttempts.length === 0) {
      return 0;
    }

    let submitted = 0;
    for (const attempt of expiredAttempts) {
      try {
        const exam = await examService.getById(attempt.exam_id);
        if (!exam) continue;

        // Check if exam end_time has passed
        if (exam.end_time && new Date(exam.end_time) < new Date()) {
          await this.submitAttempt(attempt.id, true);
          submitted++;
        }
      } catch (err) {
        console.error(`Failed to auto-submit attempt ${attempt.id}:`, err);
      }
    }

    if (submitted > 0) {
      console.log(`[AUTO_SUBMIT] Auto-submitted ${submitted} expired attempt(s)`);
    }
    return submitted;
  }

  // ============================================
  // RESULTS & ANALYTICS
  // ============================================

  /**
   * Get result for a student
   */
  async getStudentResult(examId: string, studentId: string): Promise<ExamResult | null> {
    const { data, error } = await this.supabase
      .from('exam_results')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get result: ${error.message}`);
    }

    return data as ExamResult;
  }

  /**
   * Get detailed result with responses
   */
  async getDetailedResult(attemptId: string): Promise<{
    attempt: ExamAttempt;
    exam: Exam;
    responses: (ExamResponse & { question: unknown })[];
  } | null> {
    const attempt = await this.getById(attemptId);
    if (!attempt || attempt.status === 'in_progress') {
      return null;
    }

    const exam = await examService.getById(attempt.exam_id);
    if (!exam) {
      return null;
    }

    // Get responses with questions and correct answers
    const { data: responses, error } = await this.supabase
      .from('exam_responses')
      .select(`
        *,
        question:questions(
          *,
          options:question_options(*)
        )
      `)
      .eq('attempt_id', attemptId);

    if (error) {
      throw new Error(`Failed to get responses: ${error.message}`);
    }

    // Sort by question order
    const questionOrder = attempt.question_order || [];
    const sortedResponses = questionOrder
      .map((qId) => responses?.find((r) => r.question_id === qId))
      .filter(Boolean);

    return {
      attempt,
      exam,
      responses: sortedResponses as (ExamResponse & { question: unknown })[],
    };
  }

  /**
   * Get exam leaderboard
   */
  async getLeaderboard(examId: string, limit: number = 10): Promise<ExamResult[]> {
    const { data, error } = await this.supabase
      .from('exam_results')
      .select(`
        *,
        student:students(
          *,
          user:users(first_name, last_name, avatar_url)
        )
      `)
      .eq('exam_id', examId)
      .order('best_marks', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get leaderboard: ${error.message}`);
    }

    return data as ExamResult[];
  }

  /**
   * Get student's exam attempts
   */
  async getStudentAttempts(examId: string, studentId: string): Promise<ExamAttempt[]> {
    const { data, error } = await this.supabase
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .order('attempt_number', { ascending: true });

    if (error) {
      throw new Error(`Failed to get attempts: ${error.message}`);
    }

    return data as ExamAttempt[];
  }

  /**
   * Get all attempts for an exam (admin view)
   */
  async getExamAttempts(examId: string, options: {
    page?: number;
    limit?: number;
    status?: AttemptStatus;
  } = {}): Promise<{ attempts: ExamAttempt[]; total: number }> {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('exam_attempts')
      .select(`
        *,
        student:students(
          *,
          user:users(first_name, last_name, email)
        )
      `, { count: 'exact' })
      .eq('exam_id', examId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get attempts: ${error.message}`);
    }

    return {
      attempts: data as ExamAttempt[],
      total: count || 0,
    };
  }

  /**
   * Calculate ranks for an exam
   */
  async calculateRanks(examId: string): Promise<void> {
    const { data: results, error } = await this.supabase
      .from('exam_results')
      .select('id, best_marks')
      .eq('exam_id', examId)
      .order('best_marks', { ascending: false });

    if (error) {
      throw new Error(`Failed to get results: ${error.message}`);
    }

    // Assign ranks
    let currentRank = 0;
    let previousMarks: number | null = null;

    for (let i = 0; i < (results || []).length; i++) {
      const result = results![i];
      if (result.best_marks !== previousMarks) {
        currentRank = i + 1;
        previousMarks = result.best_marks;
      }

      await this.supabase
        .from('exam_results')
        .update({
          rank: currentRank,
          percentile: Math.round(((results!.length - currentRank) / results!.length) * 100 * 100) / 100,
        })
        .eq('id', result.id);
    }
  }
}

// Export singleton instance
export const examAttemptService = new ExamAttemptService();
