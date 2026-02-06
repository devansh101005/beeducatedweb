// Student Service
// Handles student CRUD operations with Supabase

import { getSupabase } from '../config/supabase.js';

// Types
export type StudentType = 'coaching_online' | 'coaching_offline' | 'test_series' | 'home_tuition';
export type SubscriptionStatus = 'active' | 'inactive' | 'pending' | 'expired' | 'cancelled';

export interface Student {
  id: string;
  user_id: string;
  student_id: string;
  student_type: StudentType;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  class_grade: string | null;
  school_name: string | null;
  board: string | null;
  target_exam: string | null;
  target_year: number | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  subscription_status: SubscriptionStatus;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  is_active: boolean;
  joined_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentInput {
  user_id: string;
  student_id?: string; // Optional - admin can provide manually
  student_type: StudentType;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  class_grade?: string;
  school_name?: string;
  board?: string;
  target_exam?: string;
  target_year?: number;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  subscription_status?: SubscriptionStatus;
}

export interface UpdateStudentInput {
  student_type?: StudentType;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  class_grade?: string;
  school_name?: string;
  board?: string;
  target_exam?: string;
  target_year?: number;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  subscription_status?: SubscriptionStatus;
  subscription_start_date?: string;
  subscription_end_date?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

class StudentService {
  private supabase = getSupabase();

  /**
   * Generate a suggested student ID (helper for admins)
   */
  async generateSuggestedStudentId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `BEE-${year}-`;

    // Get the highest existing student ID for this year
    const { data } = await this.supabase
      .from('students')
      .select('student_id')
      .like('student_id', `${prefix}%`)
      .order('student_id', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastId = data[0].student_id;
      const lastNum = parseInt(lastId.replace(prefix, ''), 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  }

  /**
   * Check if student ID is available
   */
  async isStudentIdAvailable(studentId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('students')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    return !data; // Available if no data found
  }

  /**
   * Get student by ID
   */
  async getById(id: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Student;
  }

  /**
   * Get student by user ID
   */
  async getByUserId(userId: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Student;
  }

  /**
   * Get student by student ID (BEE-2024-0001)
   */
  async getByStudentId(studentId: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Student;
  }

  /**
   * Create a new student with manual or auto-generated student ID
   */
  async create(input: CreateStudentInput): Promise<Student> {
    // Validate required fields
    if (!input.student_id) {
      throw new Error('Student ID is required. Admin must assign a student ID manually.');
    }

    if (!input.user_id) {
      throw new Error('User ID is required to create a student profile.');
    }

    // Validate student_type enum
    const validStudentTypes: StudentType[] = ['coaching_online', 'coaching_offline', 'test_series', 'home_tuition'];
    if (!input.student_type || !validStudentTypes.includes(input.student_type)) {
      throw new Error(`Invalid student type: ${input.student_type}. Must be one of: ${validStudentTypes.join(', ')}`);
    }

    // Check if student ID already exists
    const isAvailable = await this.isStudentIdAvailable(input.student_id);
    if (!isAvailable) {
      throw new Error(`Student ID ${input.student_id} is already taken.`);
    }

    // Check if user already has a student profile
    const existingStudent = await this.getByUserId(input.user_id);
    if (existingStudent) {
      throw new Error('This user already has a student profile.');
    }

    const insertData = {
      user_id: input.user_id,
      student_id: input.student_id,
      student_type: input.student_type,
      date_of_birth: input.date_of_birth || null,
      gender: input.gender || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
      class_grade: input.class_grade || null,
      school_name: input.school_name || null,
      board: input.board || null,
      target_exam: input.target_exam || null,
      target_year: input.target_year || null,
      parent_name: input.parent_name || null,
      parent_phone: input.parent_phone || null,
      parent_email: input.parent_email || null,
      subscription_status: input.subscription_status || 'pending',
    };

    console.log('Inserting student with data:', { ...insertData, user_id: '[REDACTED]' });

    const { data, error } = await this.supabase
      .from('students')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase student insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}`);
    }

    return data as Student;
  }

  /**
   * Update a student
   */
  async update(id: string, input: UpdateStudentInput): Promise<Student> {
    const { data, error } = await this.supabase
      .from('students')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Student;
  }

  /**
   * Update student by user ID
   */
  async updateByUserId(userId: string, input: UpdateStudentInput): Promise<Student> {
    const { data, error } = await this.supabase
      .from('students')
      .update(input)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Student;
  }

  /**
   * Deactivate student
   */
  async deactivate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('students')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * List students with pagination and filters
   */
  async list(options: {
    page?: number;
    limit?: number;
    studentType?: string;
    isActive?: boolean;
    search?: string;
    targetExam?: string;
    subscriptionStatus?: SubscriptionStatus;
  } = {}): Promise<{ students: any[]; total: number }> {
    const { page = 1, limit = 20, studentType, isActive, search, targetExam, subscriptionStatus } = options;
    const offset = (page - 1) * limit;

    // Include users relation for display
    // Using 'users' as alias to match frontend expectations
    let query = this.supabase
      .from('students')
      .select(`
        *,
        users:users (
          first_name,
          last_name,
          email,
          phone
        )
      `, { count: 'exact' });

    if (studentType) {
      query = query.eq('student_type', studentType);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (targetExam) {
      query = query.eq('target_exam', targetExam);
    }

    if (subscriptionStatus) {
      query = query.eq('subscription_status', subscriptionStatus);
    }

    if (search) {
      query = query.or(
        `student_id.ilike.%${search}%,parent_name.ilike.%${search}%,parent_email.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error listing students:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log(`Found ${count} students, returning ${data?.length || 0} records`);

    return {
      students: data || [],
      total: count || 0,
    };
  }

  /**
   * Get student with user details
   */
  async getWithUser(id: string): Promise<{ student: Student; user: any } | null> {
    const { data, error } = await this.supabase
      .from('students')
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
      student: data as Student,
      user: data.user,
    };
  }

  /**
   * Get students by batch
   */
  async getByBatch(batchId: string): Promise<Student[]> {
    const { data, error } = await this.supabase
      .from('batch_students')
      .select(`
        student:students(*)
      `)
      .eq('batch_id', batchId)
      .eq('status', 'active');

    if (error) throw error;

    return data.map((d: any) => d.student) as Student[];
  }

  /**
   * Enroll student in batch
   */
  async enrollInBatch(studentId: string, batchId: string): Promise<void> {
    const { error } = await this.supabase
      .from('batch_students')
      .insert({
        student_id: studentId,
        batch_id: batchId,
        status: 'active',
      });

    if (error) throw error;

    // Update batch student count
    await this.supabase.rpc('increment_batch_students', { batch_id: batchId });
  }

  /**
   * Remove student from batch
   */
  async removeFromBatch(studentId: string, batchId: string): Promise<void> {
    const { error } = await this.supabase
      .from('batch_students')
      .update({ status: 'dropped' })
      .eq('student_id', studentId)
      .eq('batch_id', batchId);

    if (error) throw error;

    // Update batch student count
    await this.supabase.rpc('decrement_batch_students', { batch_id: batchId });
  }

  /**
   * Update subscription status
   */
  async updateSubscription(
    id: string,
    status: SubscriptionStatus,
    startDate?: string,
    endDate?: string
  ): Promise<Student> {
    const updateData: UpdateStudentInput = {
      subscription_status: status,
    };

    if (startDate) updateData.subscription_start_date = startDate;
    if (endDate) updateData.subscription_end_date = endDate;

    return this.update(id, updateData);
  }

  /**
   * Delete a student profile
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting student:', error);
      throw new Error('Failed to delete student');
    }
  }
}

// Export singleton instance
export const studentService = new StudentService();
