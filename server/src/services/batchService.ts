// Batch Service - CRUD operations for batches
// Phase 2: Full batch management with enrollment and course assignment

import { getSupabase } from '../config/supabase.js';

// Types
export type BatchType = 'coaching_online' | 'coaching_offline' | 'test_series' | 'home_tuition';
export type EnrollmentStatus = 'active' | 'dropped' | 'completed';

export interface Batch {
  id: string;
  batch_code: string;
  name: string;
  description?: string;
  target_exam?: string;
  target_year?: number;
  batch_type?: BatchType;
  start_date?: string;
  end_date?: string;
  schedule?: Record<string, string[]>;
  max_students: number;
  current_students: number;
  is_active: boolean;
  manager_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BatchCreateInput {
  name: string;
  description?: string;
  target_exam?: string;
  target_year?: number;
  batch_type?: BatchType;
  start_date?: string;
  end_date?: string;
  schedule?: Record<string, string[]>;
  max_students?: number;
  manager_id?: string;
  metadata?: Record<string, unknown>;
}

export interface BatchUpdateInput {
  name?: string;
  description?: string;
  target_exam?: string;
  target_year?: number;
  batch_type?: BatchType;
  start_date?: string;
  end_date?: string;
  schedule?: Record<string, string[]>;
  max_students?: number;
  is_active?: boolean;
  manager_id?: string;
  metadata?: Record<string, unknown>;
}

export interface BatchListOptions {
  page?: number;
  limit?: number;
  isActive?: boolean;
  targetExam?: string;
  targetYear?: number;
  batchType?: BatchType;
  managerId?: string;
  search?: string;
}

export interface BatchEnrollment {
  id: string;
  batch_id: string;
  student_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
}

export interface BatchTeacher {
  id: string;
  batch_id: string;
  teacher_id: string;
  subject?: string;
  is_primary: boolean;
  assigned_at: string;
}

class BatchService {
  /**
   * Generate batch code using database function
   */
  async generateBatchCode(targetExam: string, targetYear: number): Promise<string> {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('generate_batch_code', {
      p_target_exam: targetExam,
      p_target_year: targetYear,
    });

    if (error) {
      // Fallback to manual generation
      const prefix = targetExam.includes('JEE') ? 'JEE' : targetExam.includes('NEET') ? 'NEET' : 'GEN';
      const { count } = await supabase
        .from('batches')
        .select('*', { count: 'exact', head: true })
        .eq('target_exam', targetExam)
        .eq('target_year', targetYear);

      const letter = String.fromCharCode(65 + (count || 0));
      return `${prefix}-${targetYear}-${letter}`;
    }

    return data;
  }

  /**
   * Create a new batch
   */
  async create(input: BatchCreateInput): Promise<Batch> {
    const supabase = getSupabase();

    // Generate batch code
    const batchCode = await this.generateBatchCode(
      input.target_exam || 'General',
      input.target_year || new Date().getFullYear()
    );

    const { data, error } = await supabase
      .from('batches')
      .insert({
        batch_code: batchCode,
        name: input.name,
        description: input.description,
        target_exam: input.target_exam,
        target_year: input.target_year,
        batch_type: input.batch_type,
        start_date: input.start_date,
        end_date: input.end_date,
        schedule: input.schedule,
        max_students: input.max_students || 50,
        manager_id: input.manager_id,
        metadata: input.metadata,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create batch: ${error.message}`);
    return data;
  }

  /**
   * Get batch by ID
   */
  async getById(id: string): Promise<Batch | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('batches').select('*').eq('id', id).single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get batch: ${error.message}`);
    }
    return data;
  }

  /**
   * Get batch by code
   */
  async getByCode(batchCode: string): Promise<Batch | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('batch_code', batchCode)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get batch: ${error.message}`);
    }
    return data;
  }

  /**
   * Update batch
   */
  async update(id: string, input: BatchUpdateInput): Promise<Batch> {
    const supabase = getSupabase();

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.target_exam !== undefined) updateData.target_exam = input.target_exam;
    if (input.target_year !== undefined) updateData.target_year = input.target_year;
    if (input.batch_type !== undefined) updateData.batch_type = input.batch_type;
    if (input.start_date !== undefined) updateData.start_date = input.start_date;
    if (input.end_date !== undefined) updateData.end_date = input.end_date;
    if (input.schedule !== undefined) updateData.schedule = input.schedule;
    if (input.max_students !== undefined) updateData.max_students = input.max_students;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.manager_id !== undefined) updateData.manager_id = input.manager_id;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const { data, error } = await supabase
      .from('batches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update batch: ${error.message}`);
    return data;
  }

  /**
   * List batches with pagination and filters
   */
  async list(options: BatchListOptions = {}): Promise<{ batches: Batch[]; total: number }> {
    const { page = 1, limit = 20, isActive, targetExam, targetYear, batchType, managerId, search } = options;
    const offset = (page - 1) * limit;

    const supabase = getSupabase();
    let query = supabase.from('batches').select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }
    if (targetExam) {
      query = query.eq('target_exam', targetExam);
    }
    if (targetYear) {
      query = query.eq('target_year', targetYear);
    }
    if (batchType) {
      query = query.eq('batch_type', batchType);
    }
    if (managerId) {
      query = query.eq('manager_id', managerId);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,batch_code.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to list batches: ${error.message}`);
    return { batches: data || [], total: count || 0 };
  }

  /**
   * Deactivate batch (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.from('batches').update({ is_active: false }).eq('id', id);

    if (error) throw new Error(`Failed to deactivate batch: ${error.message}`);
  }

  /**
   * Reactivate batch
   */
  async reactivate(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.from('batches').update({ is_active: true }).eq('id', id);

    if (error) throw new Error(`Failed to reactivate batch: ${error.message}`);
  }

  // ==========================================
  // STUDENT ENROLLMENT
  // ==========================================

  /**
   * Enroll a student in a batch
   */
  async enrollStudent(batchId: string, studentId: string): Promise<BatchEnrollment> {
    const supabase = getSupabase();

    // Check batch capacity
    const batch = await this.getById(batchId);
    if (!batch) throw new Error('Batch not found');
    if (batch.current_students >= batch.max_students) {
      throw new Error('Batch is at full capacity');
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('batch_students')
      .insert({
        batch_id: batchId,
        student_id: studentId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Student is already enrolled in this batch');
      }
      throw new Error(`Failed to enroll student: ${error.message}`);
    }

    // Update batch student count
    await supabase
      .from('batches')
      .update({ current_students: batch.current_students + 1 })
      .eq('id', batchId);

    return data;
  }

  /**
   * Remove student from batch
   */
  async removeStudent(batchId: string, studentId: string): Promise<void> {
    const supabase = getSupabase();

    const { data: enrollment, error: fetchError } = await supabase
      .from('batch_students')
      .select('*')
      .eq('batch_id', batchId)
      .eq('student_id', studentId)
      .single();

    if (fetchError || !enrollment) {
      throw new Error('Enrollment not found');
    }

    const { error } = await supabase
      .from('batch_students')
      .delete()
      .eq('batch_id', batchId)
      .eq('student_id', studentId);

    if (error) throw new Error(`Failed to remove student: ${error.message}`);

    // Update batch student count
    const batch = await this.getById(batchId);
    if (batch && batch.current_students > 0) {
      await supabase
        .from('batches')
        .update({ current_students: batch.current_students - 1 })
        .eq('id', batchId);
    }
  }

  /**
   * Update student enrollment status
   */
  async updateEnrollmentStatus(
    batchId: string,
    studentId: string,
    status: EnrollmentStatus
  ): Promise<BatchEnrollment> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('batch_students')
      .update({ status })
      .eq('batch_id', batchId)
      .eq('student_id', studentId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update enrollment: ${error.message}`);
    return data;
  }

  /**
   * Get students in a batch
   */
  async getStudents(
    batchId: string,
    status?: EnrollmentStatus
  ): Promise<{ enrollment: BatchEnrollment; student: unknown }[]> {
    const supabase = getSupabase();

    let query = supabase
      .from('batch_students')
      .select(
        `
        *,
        student:students(
          *,
          user:users(id, email, first_name, last_name, phone, avatar_url)
        )
      `
      )
      .eq('batch_id', batchId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('enrolled_at', { ascending: true });

    if (error) throw new Error(`Failed to get batch students: ${error.message}`);
    return data || [];
  }

  /**
   * Get batches a student is enrolled in
   */
  async getStudentBatches(studentId: string): Promise<{ enrollment: BatchEnrollment; batch: Batch }[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('batch_students')
      .select(
        `
        *,
        batch:batches(*)
      `
      )
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    if (error) throw new Error(`Failed to get student batches: ${error.message}`);
    return data || [];
  }

  // ==========================================
  // TEACHER ASSIGNMENT
  // ==========================================

  /**
   * Assign teacher to batch
   */
  async assignTeacher(
    batchId: string,
    teacherId: string,
    subject?: string,
    isPrimary: boolean = false
  ): Promise<BatchTeacher> {
    const supabase = getSupabase();

    // If setting as primary, unset other primaries first
    if (isPrimary) {
      await supabase
        .from('batch_teachers')
        .update({ is_primary: false })
        .eq('batch_id', batchId)
        .eq('is_primary', true);
    }

    const { data, error } = await supabase
      .from('batch_teachers')
      .insert({
        batch_id: batchId,
        teacher_id: teacherId,
        subject,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Teacher is already assigned to this batch for this subject');
      }
      throw new Error(`Failed to assign teacher: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove teacher from batch
   */
  async removeTeacher(batchId: string, teacherId: string, subject?: string): Promise<void> {
    const supabase = getSupabase();

    let query = supabase
      .from('batch_teachers')
      .delete()
      .eq('batch_id', batchId)
      .eq('teacher_id', teacherId);

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { error } = await query;

    if (error) throw new Error(`Failed to remove teacher: ${error.message}`);
  }

  /**
   * Get teachers in a batch
   */
  async getTeachers(batchId: string): Promise<{ assignment: BatchTeacher; teacher: unknown }[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('batch_teachers')
      .select(
        `
        *,
        teacher:teachers(
          *,
          user:users(id, email, first_name, last_name, phone, avatar_url)
        )
      `
      )
      .eq('batch_id', batchId)
      .order('is_primary', { ascending: false });

    if (error) throw new Error(`Failed to get batch teachers: ${error.message}`);
    return data || [];
  }

  /**
   * Get batches a teacher is assigned to
   */
  async getTeacherBatches(teacherId: string): Promise<{ assignment: BatchTeacher; batch: Batch }[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('batch_teachers')
      .select(
        `
        *,
        batch:batches(*)
      `
      )
      .eq('teacher_id', teacherId)
      .order('assigned_at', { ascending: false });

    if (error) throw new Error(`Failed to get teacher batches: ${error.message}`);
    return data || [];
  }

  // ==========================================
  // BATCH WITH FULL DETAILS
  // ==========================================

  /**
   * Get batch with students and teachers
   */
  async getWithDetails(id: string): Promise<{
    batch: Batch;
    students: unknown[];
    teachers: unknown[];
  } | null> {
    const batch = await this.getById(id);
    if (!batch) return null;

    const [students, teachers] = await Promise.all([
      this.getStudents(id),
      this.getTeachers(id),
    ]);

    return { batch, students, teachers };
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  /**
   * Get batch statistics
   */
  async getStats(batchId: string): Promise<{
    totalStudents: number;
    activeStudents: number;
    droppedStudents: number;
    completedStudents: number;
    totalTeachers: number;
    capacityUsed: number;
  }> {
    const supabase = getSupabase();

    const batch = await this.getById(batchId);
    if (!batch) throw new Error('Batch not found');

    const { data: enrollments } = await supabase
      .from('batch_students')
      .select('status')
      .eq('batch_id', batchId);

    const { count: teacherCount } = await supabase
      .from('batch_teachers')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', batchId);

    const statusCounts = (enrollments || []).reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalStudents: enrollments?.length || 0,
      activeStudents: statusCounts['active'] || 0,
      droppedStudents: statusCounts['dropped'] || 0,
      completedStudents: statusCounts['completed'] || 0,
      totalTeachers: teacherCount || 0,
      capacityUsed: Math.round((batch.current_students / batch.max_students) * 100),
    };
  }
}

export const batchService = new BatchService();
export default batchService;
