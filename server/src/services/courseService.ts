// Course Service - CRUD operations for courses and subjects
// Phase 2: Course and subject management

import { getSupabase } from '../config/supabase.js';

// Types
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseType = 'coaching_online' | 'coaching_offline' | 'test_series' | 'home_tuition';

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  target_exams?: string[];
  icon?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  subject_id?: string;
  target_exam?: string;
  class_grade?: string;
  level: CourseLevel;
  duration_weeks?: number;
  total_lectures?: number;
  total_hours?: number;
  price?: number;
  discount_price?: number;
  course_type?: CourseType;
  status: CourseStatus;
  is_active: boolean;
  primary_teacher_id?: string;
  thumbnail_url?: string;
  preview_video_url?: string;
  slug?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  course_id: string;
  name: string;
  description?: string;
  sequence_number: number;
  estimated_hours?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseCreateInput {
  name: string;
  description?: string;
  subject_id?: string;
  target_exam?: string;
  class_grade?: string;
  level?: CourseLevel;
  duration_weeks?: number;
  total_lectures?: number;
  total_hours?: number;
  price?: number;
  discount_price?: number;
  course_type?: CourseType;
  primary_teacher_id?: string;
  thumbnail_url?: string;
  preview_video_url?: string;
  metadata?: Record<string, unknown>;
}

export interface CourseUpdateInput {
  name?: string;
  description?: string;
  subject_id?: string;
  target_exam?: string;
  class_grade?: string;
  level?: CourseLevel;
  duration_weeks?: number;
  total_lectures?: number;
  total_hours?: number;
  price?: number;
  discount_price?: number;
  course_type?: CourseType;
  status?: CourseStatus;
  is_active?: boolean;
  primary_teacher_id?: string;
  thumbnail_url?: string;
  preview_video_url?: string;
  metadata?: Record<string, unknown>;
}

export interface CourseListOptions {
  page?: number;
  limit?: number;
  status?: CourseStatus;
  isActive?: boolean;
  subjectId?: string;
  targetExam?: string;
  classGrade?: string;
  courseType?: CourseType;
  teacherId?: string;
  search?: string;
}

export interface StudentCourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  expires_at?: string;
  progress_percent: number;
  last_accessed_at?: string;
  completed_at?: string;
  status: string;
  payment_id?: string;
  created_at: string;
  updated_at: string;
}

class CourseService {
  // ==========================================
  // SUBJECTS
  // ==========================================

  /**
   * Get all subjects
   */
  async getSubjects(activeOnly: boolean = true): Promise<Subject[]> {
    const supabase = getSupabase();
    let query = supabase.from('subjects').select('*').order('display_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get subjects: ${error.message}`);
    return data || [];
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(id: string): Promise<Subject | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('subjects').select('*').eq('id', id).single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get subject: ${error.message}`);
    }
    return data;
  }

  /**
   * Get subject by code
   */
  async getSubjectByCode(code: string): Promise<Subject | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('subjects').select('*').eq('code', code).single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get subject: ${error.message}`);
    }
    return data;
  }

  /**
   * Create subject
   */
  async createSubject(input: {
    code: string;
    name: string;
    description?: string;
    target_exams?: string[];
    icon?: string;
    color?: string;
    display_order?: number;
  }): Promise<Subject> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description,
        target_exams: input.target_exams,
        icon: input.icon,
        color: input.color,
        display_order: input.display_order || 0,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create subject: ${error.message}`);
    return data;
  }

  /**
   * Update subject
   */
  async updateSubject(id: string, input: Partial<Subject>): Promise<Subject> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('subjects')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update subject: ${error.message}`);
    return data;
  }

  // ==========================================
  // COURSES
  // ==========================================

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Generate course code
   */
  async generateCourseCode(targetExam: string, subjectCode: string, classGrade: string): Promise<string> {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('generate_course_code', {
      p_target_exam: targetExam,
      p_subject_code: subjectCode,
      p_class_grade: classGrade,
    });

    if (error) {
      // Fallback to manual generation
      const examPrefix = targetExam.includes('JEE') ? 'JEE' : targetExam.includes('NEET') ? 'NEET' : 'GEN';
      const gradeStr = classGrade === '11th' ? '11' : classGrade === '12th' ? '12' : 'X';
      return `${examPrefix}-${subjectCode}-${gradeStr}`;
    }

    return data;
  }

  /**
   * Create a new course
   */
  async create(input: CourseCreateInput): Promise<Course> {
    const supabase = getSupabase();

    // Get subject code for course code generation
    let subjectCode = 'GEN';
    if (input.subject_id) {
      const subject = await this.getSubjectById(input.subject_id);
      if (subject) subjectCode = subject.code;
    }

    // Generate course code
    const courseCode = await this.generateCourseCode(
      input.target_exam || 'General',
      subjectCode,
      input.class_grade || 'General'
    );

    // Generate slug
    const slug = this.generateSlug(input.name);

    const { data, error } = await supabase
      .from('courses')
      .insert({
        code: courseCode,
        name: input.name,
        description: input.description,
        subject_id: input.subject_id,
        target_exam: input.target_exam,
        class_grade: input.class_grade,
        level: input.level || 'intermediate',
        duration_weeks: input.duration_weeks,
        total_lectures: input.total_lectures,
        total_hours: input.total_hours,
        price: input.price,
        discount_price: input.discount_price,
        course_type: input.course_type,
        primary_teacher_id: input.primary_teacher_id,
        thumbnail_url: input.thumbnail_url,
        preview_video_url: input.preview_video_url,
        slug,
        status: 'draft',
        metadata: input.metadata,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create course: ${error.message}`);
    return data;
  }

  /**
   * Get course by ID
   */
  async getById(id: string): Promise<Course | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get course: ${error.message}`);
    }
    return data;
  }

  /**
   * Get course by slug
   */
  async getBySlug(slug: string): Promise<Course | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('courses').select('*').eq('slug', slug).single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get course: ${error.message}`);
    }
    return data;
  }

  /**
   * Get course by code
   */
  async getByCode(code: string): Promise<Course | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('courses').select('*').eq('code', code).single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get course: ${error.message}`);
    }
    return data;
  }

  /**
   * Update course
   */
  async update(id: string, input: CourseUpdateInput): Promise<Course> {
    const supabase = getSupabase();

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
      updateData.slug = this.generateSlug(input.name);
    }
    if (input.description !== undefined) updateData.description = input.description;
    if (input.subject_id !== undefined) updateData.subject_id = input.subject_id;
    if (input.target_exam !== undefined) updateData.target_exam = input.target_exam;
    if (input.class_grade !== undefined) updateData.class_grade = input.class_grade;
    if (input.level !== undefined) updateData.level = input.level;
    if (input.duration_weeks !== undefined) updateData.duration_weeks = input.duration_weeks;
    if (input.total_lectures !== undefined) updateData.total_lectures = input.total_lectures;
    if (input.total_hours !== undefined) updateData.total_hours = input.total_hours;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.discount_price !== undefined) updateData.discount_price = input.discount_price;
    if (input.course_type !== undefined) updateData.course_type = input.course_type;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.primary_teacher_id !== undefined) updateData.primary_teacher_id = input.primary_teacher_id;
    if (input.thumbnail_url !== undefined) updateData.thumbnail_url = input.thumbnail_url;
    if (input.preview_video_url !== undefined) updateData.preview_video_url = input.preview_video_url;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update course: ${error.message}`);
    return data;
  }

  /**
   * List courses with pagination and filters
   */
  async list(options: CourseListOptions = {}): Promise<{ courses: Course[]; total: number }> {
    const { page = 1, limit = 20, status, isActive, subjectId, targetExam, classGrade, courseType, teacherId, search } = options;
    const offset = (page - 1) * limit;

    const supabase = getSupabase();
    let query = supabase.from('courses').select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (targetExam) {
      query = query.eq('target_exam', targetExam);
    }
    if (classGrade) {
      query = query.eq('class_grade', classGrade);
    }
    if (courseType) {
      query = query.eq('course_type', courseType);
    }
    if (teacherId) {
      query = query.eq('primary_teacher_id', teacherId);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to list courses: ${error.message}`);
    return { courses: data || [], total: count || 0 };
  }

  /**
   * Publish course
   */
  async publish(id: string): Promise<Course> {
    return this.update(id, { status: 'published' });
  }

  /**
   * Archive course
   */
  async archive(id: string): Promise<Course> {
    return this.update(id, { status: 'archived' });
  }

  /**
   * Get course with subject and teacher details
   */
  async getWithDetails(id: string): Promise<{
    course: Course;
    subject: Subject | null;
    teacher: unknown | null;
    topics: Topic[];
  } | null> {
    const supabase = getSupabase();

    const { data: course, error } = await supabase
      .from('courses')
      .select(
        `
        *,
        subject:subjects(*),
        teacher:teachers(
          *,
          user:users(id, email, first_name, last_name, avatar_url)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get course: ${error.message}`);
    }
    if (!course) return null;

    const topics = await this.getTopics(id);

    return {
      course,
      subject: course.subject,
      teacher: course.teacher,
      topics,
    };
  }

  // ==========================================
  // TOPICS (Course Chapters)
  // ==========================================

  /**
   * Get topics for a course
   */
  async getTopics(courseId: string): Promise<Topic[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('sequence_number', { ascending: true });

    if (error) throw new Error(`Failed to get topics: ${error.message}`);
    return data || [];
  }

  /**
   * Create topic
   */
  async createTopic(input: {
    course_id: string;
    name: string;
    description?: string;
    sequence_number: number;
    estimated_hours?: number;
  }): Promise<Topic> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('topics').insert(input).select().single();

    if (error) throw new Error(`Failed to create topic: ${error.message}`);
    return data;
  }

  /**
   * Update topic
   */
  async updateTopic(id: string, input: Partial<Topic>): Promise<Topic> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('topics').update(input).eq('id', id).select().single();

    if (error) throw new Error(`Failed to update topic: ${error.message}`);
    return data;
  }

  /**
   * Delete topic
   */
  async deleteTopic(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.from('topics').update({ is_active: false }).eq('id', id);

    if (error) throw new Error(`Failed to delete topic: ${error.message}`);
  }

  /**
   * Reorder topics
   */
  async reorderTopics(courseId: string, topicIds: string[]): Promise<void> {
    const supabase = getSupabase();

    const updates = topicIds.map((id, index) =>
      supabase.from('topics').update({ sequence_number: index + 1 }).eq('id', id).eq('course_id', courseId)
    );

    await Promise.all(updates);
  }

  // ==========================================
  // STUDENT ENROLLMENT
  // ==========================================

  /**
   * Enroll student in course
   */
  async enrollStudent(
    studentId: string,
    courseId: string,
    expiresAt?: string,
    paymentId?: string
  ): Promise<StudentCourseEnrollment> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('student_courses')
      .insert({
        student_id: studentId,
        course_id: courseId,
        expires_at: expiresAt,
        payment_id: paymentId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Student is already enrolled in this course');
      }
      throw new Error(`Failed to enroll student: ${error.message}`);
    }

    return data;
  }

  /**
   * Get student's courses
   */
  async getStudentCourses(studentId: string): Promise<{ enrollment: StudentCourseEnrollment; course: Course }[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('student_courses')
      .select(
        `
        *,
        course:courses(*)
      `
      )
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    if (error) throw new Error(`Failed to get student courses: ${error.message}`);
    return data || [];
  }

  /**
   * Get students enrolled in a course
   */
  async getCourseStudents(courseId: string): Promise<{ enrollment: StudentCourseEnrollment; student: unknown }[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('student_courses')
      .select(
        `
        *,
        student:students(
          *,
          user:users(id, email, first_name, last_name, phone, avatar_url)
        )
      `
      )
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false });

    if (error) throw new Error(`Failed to get course students: ${error.message}`);
    return data || [];
  }

  /**
   * Update student course progress
   */
  async updateProgress(
    studentId: string,
    courseId: string,
    updates: {
      progress_percent?: number;
      last_accessed_at?: string;
      completed_at?: string;
      status?: string;
    }
  ): Promise<StudentCourseEnrollment> {
    const supabase = getSupabase();

    const updateData: Record<string, unknown> = {
      last_accessed_at: updates.last_accessed_at || new Date().toISOString(),
    };

    if (updates.progress_percent !== undefined) {
      updateData.progress_percent = updates.progress_percent;
      if (updates.progress_percent >= 100) {
        updateData.completed_at = new Date().toISOString();
        updateData.status = 'completed';
      }
    }

    if (updates.completed_at !== undefined) {
      updateData.completed_at = updates.completed_at;
    }

    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }

    const { data, error } = await supabase
      .from('student_courses')
      .update(updateData)
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update progress: ${error.message}`);
    return data;
  }

  /**
   * Unenroll student from course
   */
  async unenrollStudent(studentId: string, courseId: string): Promise<void> {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('student_courses')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) throw new Error(`Failed to unenroll student: ${error.message}`);
  }

  // ==========================================
  // BATCH-COURSE RELATIONSHIP
  // ==========================================

  /**
   * Add course to batch
   */
  async addCourseToBatch(
    batchId: string,
    courseId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ id: string; batch_id: string; course_id: string }> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('batch_courses')
      .insert({
        batch_id: batchId,
        course_id: courseId,
        start_date: startDate,
        end_date: endDate,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Course is already assigned to this batch');
      }
      throw new Error(`Failed to add course to batch: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove course from batch
   */
  async removeCourseFromBatch(batchId: string, courseId: string): Promise<void> {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('batch_courses')
      .delete()
      .eq('batch_id', batchId)
      .eq('course_id', courseId);

    if (error) throw new Error(`Failed to remove course from batch: ${error.message}`);
  }

  /**
   * Get courses for a batch
   */
  async getBatchCourses(batchId: string): Promise<Course[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('batch_courses')
      .select(
        `
        course:courses(*)
      `
      )
      .eq('batch_id', batchId)
      .eq('is_active', true);

    if (error) throw new Error(`Failed to get batch courses: ${error.message}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((d: any) => d.course as Course);
  }
}

export const courseService = new CourseService();
export default courseService;
