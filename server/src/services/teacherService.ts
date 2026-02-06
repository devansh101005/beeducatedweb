// Teacher Service
// Handles teacher CRUD operations with Supabase

import { getSupabase } from '../config/supabase.js';

export interface Teacher {
  id: string;
  user_id: string;
  teacher_id: string;
  specialization: string | null;
  subjects: string[] | null;
  qualification: string | null;
  experience_years: number | null;
  bio: string | null;
  is_active: boolean;
  joined_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateTeacherInput {
  user_id: string;
  specialization?: string;
  subjects?: string[];
  qualification?: string;
  experience_years?: number;
  bio?: string;
}

export interface UpdateTeacherInput {
  specialization?: string;
  subjects?: string[];
  qualification?: string;
  experience_years?: number;
  bio?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

class TeacherService {
  private supabase = getSupabase();

  /**
   * Generate a unique teacher ID
   */
  private async generateTeacherId(): Promise<string> {
    const prefix = 'TCH-';

    // Get the highest existing teacher ID
    const { data } = await this.supabase
      .from('teachers')
      .select('teacher_id')
      .order('teacher_id', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastId = data[0].teacher_id;
      const lastNum = parseInt(lastId.replace(prefix, ''), 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  }

  /**
   * Get teacher by ID
   */
  async getById(id: string): Promise<Teacher | null> {
    const { data, error } = await this.supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Teacher;
  }

  /**
   * Get teacher by user ID
   */
  async getByUserId(userId: string): Promise<Teacher | null> {
    const { data, error } = await this.supabase
      .from('teachers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Teacher;
  }

  /**
   * Get teacher by teacher ID (TCH-0001)
   */
  async getByTeacherId(teacherId: string): Promise<Teacher | null> {
    const { data, error } = await this.supabase
      .from('teachers')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Teacher;
  }

  /**
   * Create a new teacher
   */
  async create(input: CreateTeacherInput): Promise<Teacher> {
    const teacherId = await this.generateTeacherId();

    const { data, error } = await this.supabase
      .from('teachers')
      .insert({
        ...input,
        teacher_id: teacherId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Teacher;
  }

  /**
   * Update a teacher
   */
  async update(id: string, input: UpdateTeacherInput): Promise<Teacher> {
    const { data, error } = await this.supabase
      .from('teachers')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Teacher;
  }

  /**
   * Update teacher by user ID
   */
  async updateByUserId(userId: string, input: UpdateTeacherInput): Promise<Teacher> {
    const { data, error } = await this.supabase
      .from('teachers')
      .update(input)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Teacher;
  }

  /**
   * Deactivate teacher
   */
  async deactivate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('teachers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * List teachers with pagination and filters
   */
  async list(options: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
    subject?: string;
  } = {}): Promise<{ teachers: Teacher[]; total: number }> {
    const { page = 1, limit = 20, isActive, search, subject } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('teachers')
      .select('*, user:users(id, email, first_name, last_name, phone, avatar_url)', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (subject) {
      query = query.contains('subjects', [subject]);
    }

    if (search) {
      query = query.or(
        `teacher_id.ilike.%${search}%,specialization.ilike.%${search}%,bio.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      teachers: data as Teacher[],
      total: count || 0,
    };
  }

  /**
   * Get teacher with user details
   */
  async getWithUser(id: string): Promise<{ teacher: Teacher; user: any } | null> {
    const { data, error } = await this.supabase
      .from('teachers')
      .select(`
        *,
        user:users(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      teacher: data as Teacher,
      user: data.user,
    };
  }

  /**
   * Get teachers by batch
   */
  async getByBatch(batchId: string): Promise<Teacher[]> {
    const { data, error } = await this.supabase
      .from('batch_teachers')
      .select(`
        subject,
        is_primary,
        teacher:teachers(*)
      `)
      .eq('batch_id', batchId);

    if (error) throw error;

    return data.map((d: any) => ({
      ...d.teacher,
      assigned_subject: d.subject,
      is_primary: d.is_primary,
    })) as Teacher[];
  }

  /**
   * Assign teacher to batch
   */
  async assignToBatch(
    teacherId: string,
    batchId: string,
    subject: string,
    isPrimary = false
  ): Promise<void> {
    const { error } = await this.supabase
      .from('batch_teachers')
      .insert({
        teacher_id: teacherId,
        batch_id: batchId,
        subject,
        is_primary: isPrimary,
      });

    if (error) throw error;
  }

  /**
   * Remove teacher from batch
   */
  async removeFromBatch(teacherId: string, batchId: string, subject?: string): Promise<void> {
    let query = this.supabase
      .from('batch_teachers')
      .delete()
      .eq('teacher_id', teacherId)
      .eq('batch_id', batchId);

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { error } = await query;
    if (error) throw error;
  }

  /**
   * Get batches assigned to teacher
   */
  async getBatches(teacherId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('batch_teachers')
      .select(`
        subject,
        is_primary,
        batch:batches(*)
      `)
      .eq('teacher_id', teacherId);

    if (error) throw error;

    return data.map((d: any) => ({
      ...d.batch,
      assigned_subject: d.subject,
      is_primary: d.is_primary,
    }));
  }
}

// Export singleton instance
export const teacherService = new TeacherService();
