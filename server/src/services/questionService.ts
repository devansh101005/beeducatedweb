// Question Service
// Handles question bank CRUD operations

import { getSupabase } from '../config/supabase.js';

// Types
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'numerical' | 'subjective';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  subject_id: string | null;
  topic_id: string | null;
  question_text: string;
  question_html: string | null;
  question_image_url: string | null;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  numerical_answer: number | null;
  numerical_tolerance: number | null;
  model_answer: string | null;
  max_words: number | null;
  positive_marks: number;
  negative_marks: number | null;
  partial_marks_allowed: boolean;
  explanation: string | null;
  explanation_image_url: string | null;
  tags: string[] | null;
  source: string | null;
  year: number | null;
  is_active: boolean;
  is_verified: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_html: string | null;
  option_image_url: string | null;
  is_correct: boolean;
  sequence_order: number;
  created_at: string;
}

export interface CreateQuestionInput {
  subject_id?: string;
  topic_id?: string;
  question_text: string;
  question_html?: string;
  question_image_url?: string;
  question_type: QuestionType;
  difficulty?: DifficultyLevel;
  numerical_answer?: number;
  numerical_tolerance?: number;
  model_answer?: string;
  max_words?: number;
  positive_marks?: number;
  negative_marks?: number;
  partial_marks_allowed?: boolean;
  explanation?: string;
  explanation_image_url?: string;
  tags?: string[];
  source?: string;
  year?: number;
  is_active?: boolean;
  created_by?: string;
  options?: CreateOptionInput[];
}

export interface CreateOptionInput {
  option_text: string;
  option_html?: string;
  option_image_url?: string;
  is_correct: boolean;
  sequence_order?: number;
}

export interface UpdateQuestionInput {
  subject_id?: string | null;
  topic_id?: string | null;
  question_text?: string;
  question_html?: string;
  question_image_url?: string | null;
  question_type?: QuestionType;
  difficulty?: DifficultyLevel;
  numerical_answer?: number | null;
  numerical_tolerance?: number;
  model_answer?: string | null;
  max_words?: number | null;
  positive_marks?: number;
  negative_marks?: number;
  partial_marks_allowed?: boolean;
  explanation?: string | null;
  explanation_image_url?: string | null;
  tags?: string[];
  source?: string | null;
  year?: number | null;
  is_active?: boolean;
  is_verified?: boolean;
  updated_by?: string;
}

export interface QuestionListOptions {
  page?: number;
  limit?: number;
  subjectId?: string;
  topicId?: string;
  questionType?: QuestionType;
  difficulty?: DifficultyLevel;
  isActive?: boolean;
  isVerified?: boolean;
  tags?: string[];
  source?: string;
  year?: number;
  search?: string;
}

class QuestionService {
  private supabase = getSupabase();

  /**
   * Get question by ID
   */
  async getById(id: string): Promise<Question | null> {
    const { data, error } = await this.supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get question: ${error.message}`);
    }

    return data as Question;
  }

  /**
   * Get question with options
   */
  async getWithOptions(id: string): Promise<(Question & { options: QuestionOption[] }) | null> {
    const { data, error } = await this.supabase
      .from('questions')
      .select(`
        *,
        options:question_options(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get question: ${error.message}`);
    }

    // Sort options by sequence_order
    if (data.options) {
      data.options.sort((a: QuestionOption, b: QuestionOption) => a.sequence_order - b.sequence_order);
    }

    return data as Question & { options: QuestionOption[] };
  }

  /**
   * Create new question with options
   */
  async create(input: CreateQuestionInput): Promise<Question & { options: QuestionOption[] }> {
    const { options, ...questionData } = input;

    // Create question
    const { data: question, error } = await this.supabase
      .from('questions')
      .insert(questionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create question: ${error.message}`);
    }

    // Create options if provided
    let createdOptions: QuestionOption[] = [];
    if (options && options.length > 0) {
      const optionsWithQuestionId = options.map((opt, idx) => ({
        ...opt,
        question_id: question.id,
        sequence_order: opt.sequence_order ?? idx,
      }));

      const { data: optionsData, error: optionsError } = await this.supabase
        .from('question_options')
        .insert(optionsWithQuestionId)
        .select();

      if (optionsError) {
        // Rollback question creation
        await this.supabase.from('questions').delete().eq('id', question.id);
        throw new Error(`Failed to create options: ${optionsError.message}`);
      }

      createdOptions = optionsData as QuestionOption[];
    }

    return {
      ...question,
      options: createdOptions,
    } as Question & { options: QuestionOption[] };
  }

  /**
   * Update question
   */
  async update(id: string, input: UpdateQuestionInput): Promise<Question> {
    const { data, error } = await this.supabase
      .from('questions')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update question: ${error.message}`);
    }

    return data as Question;
  }

  /**
   * Delete question
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete question: ${error.message}`);
    }
  }

  /**
   * List questions with filters
   */
  async list(options: QuestionListOptions = {}): Promise<{ questions: Question[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      subjectId,
      topicId,
      questionType,
      difficulty,
      isActive,
      isVerified,
      tags,
      source,
      year,
      search,
    } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('questions')
      .select('*', { count: 'exact' });

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    if (questionType) {
      query = query.eq('question_type', questionType);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (isVerified !== undefined) {
      query = query.eq('is_verified', isVerified);
    }

    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags);
    }

    if (source) {
      query = query.eq('source', source);
    }

    if (year) {
      query = query.eq('year', year);
    }

    if (search) {
      query = query.or(`question_text.ilike.%${search}%,explanation.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list questions: ${error.message}`);
    }

    return {
      questions: data as Question[],
      total: count || 0,
    };
  }

  /**
   * List questions with options
   */
  async listWithOptions(options: QuestionListOptions = {}): Promise<{ questions: (Question & { options: QuestionOption[] })[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      subjectId,
      topicId,
      questionType,
      difficulty,
      isActive = true,
    } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('questions')
      .select(`
        *,
        options:question_options(*)
      `, { count: 'exact' });

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    if (questionType) {
      query = query.eq('question_type', questionType);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list questions: ${error.message}`);
    }

    // Sort options for each question
    const questions = (data || []).map((q) => ({
      ...q,
      options: (q.options || []).sort((a: QuestionOption, b: QuestionOption) => a.sequence_order - b.sequence_order),
    }));

    return {
      questions: questions as (Question & { options: QuestionOption[] })[],
      total: count || 0,
    };
  }

  // ============================================
  // OPTIONS
  // ============================================

  /**
   * Add option to question
   */
  async addOption(questionId: string, input: CreateOptionInput): Promise<QuestionOption> {
    const { data, error } = await this.supabase
      .from('question_options')
      .insert({ ...input, question_id: questionId })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add option: ${error.message}`);
    }

    return data as QuestionOption;
  }

  /**
   * Update option
   */
  async updateOption(optionId: string, input: Partial<CreateOptionInput>): Promise<QuestionOption> {
    const { data, error } = await this.supabase
      .from('question_options')
      .update(input)
      .eq('id', optionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update option: ${error.message}`);
    }

    return data as QuestionOption;
  }

  /**
   * Delete option
   */
  async deleteOption(optionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('question_options')
      .delete()
      .eq('id', optionId);

    if (error) {
      throw new Error(`Failed to delete option: ${error.message}`);
    }
  }

  /**
   * Get options for question
   */
  async getOptions(questionId: string): Promise<QuestionOption[]> {
    const { data, error } = await this.supabase
      .from('question_options')
      .select('*')
      .eq('question_id', questionId)
      .order('sequence_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get options: ${error.message}`);
    }

    return data as QuestionOption[];
  }

  /**
   * Replace all options for a question
   */
  async replaceOptions(questionId: string, options: CreateOptionInput[]): Promise<QuestionOption[]> {
    // Delete existing options
    await this.supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionId);

    // Insert new options
    const optionsWithQuestionId = options.map((opt, idx) => ({
      ...opt,
      question_id: questionId,
      sequence_order: opt.sequence_order ?? idx,
    }));

    const { data, error } = await this.supabase
      .from('question_options')
      .insert(optionsWithQuestionId)
      .select();

    if (error) {
      throw new Error(`Failed to replace options: ${error.message}`);
    }

    return data as QuestionOption[];
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Bulk create questions (for import)
   */
  async bulkCreate(questions: CreateQuestionInput[]): Promise<{ created: number; failed: number; errors: string[] }> {
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const q of questions) {
      try {
        await this.create(q);
        created++;
      } catch (err) {
        failed++;
        errors.push(`Question "${q.question_text.substring(0, 50)}...": ${(err as Error).message}`);
      }
    }

    return { created, failed, errors };
  }

  /**
   * Verify question (admin only)
   */
  async verify(id: string, verified: boolean, userId?: string): Promise<Question> {
    return this.update(id, {
      is_verified: verified,
      updated_by: userId,
    });
  }

  /**
   * Get random questions (for exam generation)
   */
  async getRandom(options: {
    count: number;
    subjectId?: string;
    topicId?: string;
    difficulty?: DifficultyLevel;
    excludeIds?: string[];
  }): Promise<Question[]> {
    const { count, subjectId, topicId, difficulty, excludeIds = [] } = options;

    let query = this.supabase
      .from('questions')
      .select('*')
      .eq('is_active', true);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Get more than needed and shuffle
    const { data, error } = await query.limit(count * 3);

    if (error) {
      throw new Error(`Failed to get random questions: ${error.message}`);
    }

    // Shuffle and take required count
    const shuffled = (data || []).sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count) as Question[];
  }

  /**
   * Get question statistics
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byDifficulty: Record<string, number>;
    verified: number;
    unverified: number;
  }> {
    const { count: total } = await this.supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: byType } = await this.supabase
      .from('questions')
      .select('question_type')
      .eq('is_active', true);

    const { data: byDifficulty } = await this.supabase
      .from('questions')
      .select('difficulty')
      .eq('is_active', true);

    const { count: verified } = await this.supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_verified', true);

    const typeCounts: Record<string, number> = {};
    (byType || []).forEach((q) => {
      typeCounts[q.question_type] = (typeCounts[q.question_type] || 0) + 1;
    });

    const difficultyCounts: Record<string, number> = {};
    (byDifficulty || []).forEach((q) => {
      difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
    });

    return {
      total: total || 0,
      byType: typeCounts,
      byDifficulty: difficultyCounts,
      verified: verified || 0,
      unverified: (total || 0) - (verified || 0),
    };
  }
}

// Export singleton instance
export const questionService = new QuestionService();
