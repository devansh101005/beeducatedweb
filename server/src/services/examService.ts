// Exam Service
// Handles exam CRUD and management operations

import { getSupabase } from '../config/supabase.js';

// Types
export type ExamStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  exam_type: string | null;
  subject_id: string | null;
  course_id: string | null;
  batch_id: string | null;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  total_marks: number | null;
  passing_marks: number | null;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_result_immediately: boolean;
  show_answers_after_submit: boolean;
  allow_review: boolean;
  enable_tab_switch_detection: boolean;
  max_tab_switches: number;
  enable_fullscreen: boolean;
  is_free: boolean;
  access_code: string | null;
  status: ExamStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamSection {
  id: string;
  exam_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  duration_minutes: number | null;
  questions_to_attempt: number | null;
  positive_marks_override: number | null;
  negative_marks_override: number | null;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  section_id: string | null;
  question_id: string;
  positive_marks: number | null;
  negative_marks: number | null;
  sequence_order: number;
  is_mandatory: boolean;
  created_at: string;
}

export interface CreateExamInput {
  title: string;
  description?: string;
  instructions?: string;
  exam_type?: string;
  subject_id?: string;
  course_id?: string;
  batch_id?: string;
  duration_minutes: number;
  start_time?: string;
  end_time?: string;
  total_marks?: number;
  passing_marks?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_result_immediately?: boolean;
  show_answers_after_submit?: boolean;
  allow_review?: boolean;
  enable_tab_switch_detection?: boolean;
  max_tab_switches?: number;
  enable_fullscreen?: boolean;
  is_free?: boolean;
  access_code?: string;
  status?: ExamStatus;
  created_by?: string;
}

export interface UpdateExamInput {
  title?: string;
  description?: string;
  instructions?: string;
  exam_type?: string;
  subject_id?: string | null;
  course_id?: string | null;
  batch_id?: string | null;
  duration_minutes?: number;
  start_time?: string | null;
  end_time?: string | null;
  total_marks?: number;
  passing_marks?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_result_immediately?: boolean;
  show_answers_after_submit?: boolean;
  allow_review?: boolean;
  enable_tab_switch_detection?: boolean;
  max_tab_switches?: number;
  enable_fullscreen?: boolean;
  is_free?: boolean;
  access_code?: string | null;
  status?: ExamStatus;
  updated_by?: string;
}

export interface ExamListOptions {
  page?: number;
  limit?: number;
  status?: ExamStatus;
  courseId?: string;
  batchId?: string;
  subjectId?: string;
  examType?: string;
  search?: string;
  includeExpired?: boolean;
}

class ExamService {
  private supabase = getSupabase();

  /**
   * Get exam by ID
   */
  async getById(id: string): Promise<Exam | null> {
    const { data, error } = await this.supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get exam: ${error.message}`);
    }

    return data as Exam;
  }

  /**
   * Get exam with full details (sections, questions)
   */
  async getWithDetails(id: string): Promise<Exam & { sections: ExamSection[]; question_count: number } | null> {
    const { data: exam, error } = await this.supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get exam: ${error.message}`);
    }

    // Get sections
    const { data: sections } = await this.supabase
      .from('exam_sections')
      .select('*')
      .eq('exam_id', id)
      .order('sequence_order', { ascending: true });

    // Get question count
    const { count } = await this.supabase
      .from('exam_questions')
      .select('id', { count: 'exact', head: true })
      .eq('exam_id', id);

    return {
      ...exam,
      sections: sections || [],
      question_count: count || 0,
    } as Exam & { sections: ExamSection[]; question_count: number };
  }

  /**
   * Create new exam
   */
  async create(input: CreateExamInput): Promise<Exam> {
    const { data, error } = await this.supabase
      .from('exams')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create exam: ${error.message}`);
    }

    return data as Exam;
  }

  /**
   * Update exam
   */
  async update(id: string, input: UpdateExamInput): Promise<Exam> {
    const { data, error } = await this.supabase
      .from('exams')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update exam: ${error.message}`);
    }

    return data as Exam;
  }

  /**
   * Delete exam
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete exam: ${error.message}`);
    }
  }

  /**
   * List exams with filters
   */
  async list(options: ExamListOptions = {}): Promise<{ exams: Exam[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      status,
      courseId,
      batchId,
      subjectId,
      examType,
      search,
      includeExpired = false,
    } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('exams')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (batchId) {
      query = query.eq('batch_id', batchId);
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (examType) {
      query = query.eq('exam_type', examType);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (!includeExpired) {
      const now = new Date().toISOString();
      query = query.or(`end_time.is.null,end_time.gt.${now}`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list exams: ${error.message}`);
    }

    return {
      exams: data as Exam[],
      total: count || 0,
    };
  }

  /**
   * Get available exams for a student
   */
  async getAvailableForStudent(
    _studentId: string,
    batchIds: string[],
    courseIds: string[]
  ): Promise<Exam[]> {
    const now = new Date().toISOString();

    let query = this.supabase
      .from('exams')
      .select('*')
      .in('status', ['scheduled', 'live'])
      .or(`start_time.is.null,start_time.lte.${now}`)
      .or(`end_time.is.null,end_time.gt.${now}`);

    // Filter by batch or course access
    const accessFilters: string[] = ['is_free.eq.true'];

    if (batchIds.length > 0) {
      accessFilters.push(`batch_id.in.(${batchIds.join(',')})`);
    }

    if (courseIds.length > 0) {
      accessFilters.push(`course_id.in.(${courseIds.join(',')})`);
    }

    query = query.or(accessFilters.join(','));

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to get available exams: ${error.message}`);
    }

    return data as Exam[];
  }

  // ============================================
  // SECTIONS
  // ============================================

  /**
   * Create exam section
   */
  async createSection(examId: string, input: {
    title: string;
    description?: string;
    instructions?: string;
    duration_minutes?: number;
    questions_to_attempt?: number;
    positive_marks_override?: number;
    negative_marks_override?: number;
    sequence_order?: number;
  }): Promise<ExamSection> {
    const { data, error } = await this.supabase
      .from('exam_sections')
      .insert({ ...input, exam_id: examId })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create section: ${error.message}`);
    }

    return data as ExamSection;
  }

  /**
   * Update exam section
   */
  async updateSection(sectionId: string, input: Partial<ExamSection>): Promise<ExamSection> {
    const { data, error } = await this.supabase
      .from('exam_sections')
      .update(input)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update section: ${error.message}`);
    }

    return data as ExamSection;
  }

  /**
   * Delete exam section
   */
  async deleteSection(sectionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('exam_sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      throw new Error(`Failed to delete section: ${error.message}`);
    }
  }

  /**
   * Get sections for an exam
   */
  async getSections(examId: string): Promise<ExamSection[]> {
    const { data, error } = await this.supabase
      .from('exam_sections')
      .select('*')
      .eq('exam_id', examId)
      .order('sequence_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get sections: ${error.message}`);
    }

    return data as ExamSection[];
  }

  // ============================================
  // EXAM QUESTIONS
  // ============================================

  /**
   * Add question to exam
   */
  async addQuestion(examId: string, input: {
    question_id: string;
    section_id?: string;
    positive_marks?: number;
    negative_marks?: number;
    sequence_order?: number;
    is_mandatory?: boolean;
  }): Promise<ExamQuestion> {
    const { data, error } = await this.supabase
      .from('exam_questions')
      .insert({ ...input, exam_id: examId })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add question: ${error.message}`);
    }

    // Update total marks
    await this.recalculateTotalMarks(examId);

    return data as ExamQuestion;
  }

  /**
   * Add multiple questions to exam
   */
  async addQuestions(examId: string, questionIds: string[], sectionId?: string): Promise<ExamQuestion[]> {
    const questions = questionIds.map((qId, idx) => ({
      exam_id: examId,
      question_id: qId,
      section_id: sectionId,
      sequence_order: idx,
    }));

    const { data, error } = await this.supabase
      .from('exam_questions')
      .insert(questions)
      .select();

    if (error) {
      throw new Error(`Failed to add questions: ${error.message}`);
    }

    // Update total marks
    await this.recalculateTotalMarks(examId);

    return data as ExamQuestion[];
  }

  /**
   * Remove question from exam
   */
  async removeQuestion(examId: string, questionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('exam_questions')
      .delete()
      .eq('exam_id', examId)
      .eq('question_id', questionId);

    if (error) {
      throw new Error(`Failed to remove question: ${error.message}`);
    }

    // Update total marks
    await this.recalculateTotalMarks(examId);
  }

  /**
   * Get questions for an exam (with question details)
   */
  async getQuestions(examId: string): Promise<(ExamQuestion & { question: unknown })[]> {
    const { data, error } = await this.supabase
      .from('exam_questions')
      .select(`
        *,
        question:questions(
          *,
          options:question_options(*)
        )
      `)
      .eq('exam_id', examId)
      .order('sequence_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get questions: ${error.message}`);
    }

    return data as (ExamQuestion & { question: unknown })[];
  }

  /**
   * Reorder exam questions
   */
  async reorderQuestions(examId: string, questionIds: string[]): Promise<void> {
    for (let i = 0; i < questionIds.length; i++) {
      const { error } = await this.supabase
        .from('exam_questions')
        .update({ sequence_order: i })
        .eq('exam_id', examId)
        .eq('question_id', questionIds[i]);

      if (error) {
        throw new Error(`Failed to reorder questions: ${error.message}`);
      }
    }
  }

  /**
   * Recalculate total marks for exam
   */
  private async recalculateTotalMarks(examId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('exam_questions')
      .select(`
        positive_marks,
        question:questions(positive_marks)
      `)
      .eq('exam_id', examId);

    if (error) {
      console.error('Failed to recalculate marks:', error);
      return;
    }

    const totalMarks = data.reduce((sum: number, eq: { positive_marks: number | null; question: unknown }) => {
      const questionData = eq.question as { positive_marks: number } | null;
      const marks = eq.positive_marks || questionData?.positive_marks || 4;
      return sum + marks;
    }, 0);

    await this.supabase
      .from('exams')
      .update({ total_marks: totalMarks })
      .eq('id', examId);
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  /**
   * Publish exam (make it scheduled/live)
   */
  async publish(id: string): Promise<Exam> {
    const exam = await this.getById(id);
    if (!exam) {
      throw new Error('Exam not found');
    }

    const now = new Date();
    let newStatus: ExamStatus = 'scheduled';

    if (exam.start_time) {
      const startTime = new Date(exam.start_time);
      if (startTime <= now) {
        newStatus = 'live';
      }
    } else {
      newStatus = 'live';
    }

    return this.update(id, { status: newStatus });
  }

  /**
   * Cancel exam
   */
  async cancel(id: string): Promise<Exam> {
    return this.update(id, { status: 'cancelled' });
  }

  /**
   * Complete exam
   */
  async complete(id: string): Promise<Exam> {
    return this.update(id, { status: 'completed' });
  }

  /**
   * Duplicate exam
   */
  async duplicate(id: string): Promise<Exam> {
    const original = await this.getWithDetails(id);
    if (!original) {
      throw new Error('Exam not found');
    }

    // Create new exam
    const newExam = await this.create({
      title: `${original.title} (Copy)`,
      description: original.description || undefined,
      instructions: original.instructions || undefined,
      exam_type: original.exam_type || undefined,
      subject_id: original.subject_id || undefined,
      course_id: original.course_id || undefined,
      batch_id: original.batch_id || undefined,
      duration_minutes: original.duration_minutes,
      total_marks: original.total_marks || undefined,
      passing_marks: original.passing_marks || undefined,
      max_attempts: original.max_attempts,
      shuffle_questions: original.shuffle_questions,
      shuffle_options: original.shuffle_options,
      show_result_immediately: original.show_result_immediately,
      show_answers_after_submit: original.show_answers_after_submit,
      allow_review: original.allow_review,
      is_free: original.is_free,
      status: 'draft',
    });

    // Copy sections
    const sectionMapping: Record<string, string> = {};
    for (const section of original.sections) {
      const newSection = await this.createSection(newExam.id, {
        title: section.title,
        description: section.description || undefined,
        instructions: section.instructions || undefined,
        duration_minutes: section.duration_minutes || undefined,
        questions_to_attempt: section.questions_to_attempt || undefined,
        sequence_order: section.sequence_order,
      });
      sectionMapping[section.id] = newSection.id;
    }

    // Copy questions
    const questions = await this.getQuestions(id);
    for (const eq of questions) {
      await this.addQuestion(newExam.id, {
        question_id: eq.question_id,
        section_id: eq.section_id ? sectionMapping[eq.section_id] : undefined,
        positive_marks: eq.positive_marks || undefined,
        negative_marks: eq.negative_marks || undefined,
        sequence_order: eq.sequence_order,
        is_mandatory: eq.is_mandatory,
      });
    }

    return newExam;
  }
}

// Export singleton instance
export const examService = new ExamService();
