// Course Type Service
// Handles course types (coaching_offline, coaching_online, test_series, home_tuition)

import { getSupabase } from '../config/supabase.js';

export interface CourseType {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  long_description: string | null;
  icon: string | null;
  color: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  coming_soon_message: string | null;
  features: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AcademicClass {
  id: string;
  course_type_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  long_description: string | null;
  duration: string | null;
  image_url: string | null;
  display_order: number;
  features: string[] | null;
  syllabus: string[] | null;
  max_students: number | null;
  current_students: number;
  target_board: string | null;
  target_exam: string | null;
  is_active: boolean;
  enrollment_open: boolean;
  session_start_date: string | null;
  session_end_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ClassFeePlan {
  id: string;
  class_id: string;
  name: string;
  description: string | null;
  registration_fee: number;
  tuition_fee: number;
  material_fee: number;
  exam_fee: number;
  discount_amount: number;
  discount_label: string | null;
  discount_valid_until: string | null;
  total_amount: number;
  currency: string;
  validity_months: number;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  highlight_label: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ClassWithFees extends AcademicClass {
  course_type?: CourseType;
  fee_plan?: ClassFeePlan;
  is_enrolled?: boolean;
  enrollment_status?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string | null;
  target_exams: string[] | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  display_order: number;
  is_active: boolean;
  subject?: Subject;
}

class CourseTypeService {
  /**
   * Get all course types
   */
  async getAll(): Promise<CourseType[]> {
    const { data, error } = await getSupabase()
      .from('course_types')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      // Handle case where table doesn't exist (migration not run)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('course_types table does not exist. Please run the migration.');
        return [];
      }
      console.error('Error fetching course types:', error);
      throw new Error('Failed to fetch course types');
    }

    return data || [];
  }

  /**
   * Get course type by slug
   */
  async getBySlug(slug: string): Promise<CourseType | null> {
    const { data, error } = await getSupabase()
      .from('course_types')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      // Handle case where table doesn't exist (migration not run)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('course_types table does not exist. Please run the migration.');
        return null;
      }
      // No rows found is okay
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching course type:', error);
      throw new Error('Failed to fetch course type');
    }

    return data;
  }

  /**
   * Get classes for a course type
   */
  async getClassesByCourseType(
    courseTypeSlug: string,
    studentId?: string
  ): Promise<{ courseType: CourseType; classes: ClassWithFees[] }> {
    // Get course type
    const courseType = await this.getBySlug(courseTypeSlug);
    if (!courseType) {
      throw new Error('Course type not found');
    }

    // Get classes with their default fee plans
    const { data: classes, error } = await getSupabase()
      .from('academic_classes')
      .select(`
        *,
        class_fee_plans!inner (*)
      `)
      .eq('course_type_id', courseType.id)
      .eq('is_active', true)
      .eq('class_fee_plans.is_default', true)
      .eq('class_fee_plans.is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      // Handle case where table doesn't exist (migration not run)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('academic_classes or class_fee_plans table does not exist. Please run the migration.');
        return { courseType, classes: [] };
      }
      console.error('Error fetching classes:', error);
      throw new Error('Failed to fetch classes');
    }

    // Get enrollments if student ID provided
    let enrollments: Record<string, string> = {};
    if (studentId) {
      const { data: enrollmentData } = await getSupabase()
        .from('class_enrollments')
        .select('class_id, status')
        .eq('student_id', studentId)
        .in('status', ['pending', 'active']);

      if (enrollmentData) {
        enrollments = enrollmentData.reduce((acc, e) => {
          acc[e.class_id] = e.status;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Transform data
    const classesWithFees: ClassWithFees[] = (classes || []).map((classItem: any) => {
      const feePlan = classItem.class_fee_plans?.[0] || null;
      return {
        ...classItem,
        class_fee_plans: undefined,
        fee_plan: feePlan,
        is_enrolled: !!enrollments[classItem.id],
        enrollment_status: enrollments[classItem.id] || null,
      };
    });

    return {
      courseType,
      classes: classesWithFees,
    };
  }

  /**
   * Get single class with fee plan
   */
  async getClassById(classId: string, studentId?: string): Promise<ClassWithFees | null> {
    const { data, error } = await getSupabase()
      .from('academic_classes')
      .select(`
        *,
        course_types (*),
        class_fee_plans (*)
      `)
      .eq('id', classId)
      .eq('is_active', true)
      .single();

    if (error) {
      // Handle case where table doesn't exist (migration not run)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('academic_classes table does not exist. Please run the migration.');
        return null;
      }
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching class:', error);
      throw new Error('Failed to fetch class');
    }

    if (!data) return null;

    // Get enrollment status if student ID provided
    let enrollmentStatus: string | null = null;
    if (studentId) {
      const { data: enrollment } = await getSupabase()
        .from('class_enrollments')
        .select('status')
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .in('status', ['pending', 'active'])
        .single();

      if (enrollment) {
        enrollmentStatus = enrollment.status;
      }
    }

    // Find default fee plan
    const defaultFeePlan = (data.class_fee_plans as ClassFeePlan[])?.find(
      (fp) => fp.is_default && fp.is_active
    );

    return {
      ...data,
      course_type: data.course_types,
      fee_plan: defaultFeePlan || (data.class_fee_plans as ClassFeePlan[])?.[0],
      class_fee_plans: undefined,
      course_types: undefined,
      is_enrolled: !!enrollmentStatus,
      enrollment_status: enrollmentStatus,
    };
  }

  /**
   * Get fee plan by ID
   */
  async getFeePlanById(feePlanId: string): Promise<ClassFeePlan | null> {
    const { data, error } = await getSupabase()
      .from('class_fee_plans')
      .select('*')
      .eq('id', feePlanId)
      .eq('is_active', true)
      .single();

    if (error) {
      // Handle case where table doesn't exist (migration not run)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('class_fee_plans table does not exist. Please run the migration.');
        return null;
      }
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching fee plan:', error);
      throw new Error('Failed to fetch fee plan');
    }

    return data;
  }

  /**
   * Get all classes with fee plans (for admin enrollment selection)
   * Optionally filter by course type slug
   */
  async getClassesWithFeePlans(courseTypeSlug?: string): Promise<ClassWithFees[]> {
    let query = getSupabase()
      .from('academic_classes')
      .select(`
        *,
        course_types (*),
        class_fee_plans (*)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Filter by course type if provided
    if (courseTypeSlug) {
      const courseType = await this.getBySlug(courseTypeSlug);
      if (courseType) {
        query = query.eq('course_type_id', courseType.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('academic_classes table does not exist. Please run the migration.');
        return [];
      }
      console.error('Error fetching classes with fee plans:', error);
      throw new Error('Failed to fetch classes');
    }

    // Transform data to include course type and default fee plan
    return (data || []).map((classItem: any) => {
      const feePlans = classItem.class_fee_plans as ClassFeePlan[] || [];
      const defaultFeePlan = feePlans.find(fp => fp.is_default && fp.is_active) || feePlans[0];

      return {
        ...classItem,
        course_type: classItem.course_types,
        fee_plan: defaultFeePlan,
        fee_plans: feePlans.filter(fp => fp.is_active), // Include all active fee plans
        class_fee_plans: undefined,
        course_types: undefined,
      };
    });
  }

  /**
   * Get subjects for a class
   */
  async getClassSubjects(classId: string): Promise<ClassSubject[]> {
    const { data, error } = await getSupabase()
      .from('class_subjects')
      .select(`
        *,
        subjects (*)
      `)
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('class_subjects table does not exist. Please run the migration.');
        return [];
      }
      console.error('Error fetching class subjects:', error);
      throw new Error('Failed to fetch class subjects');
    }

    // Transform to include subject info
    return (data || []).map((item: any) => ({
      ...item,
      subject: item.subjects,
      subjects: undefined,
    }));
  }

  /**
   * Get all subjects
   */
  async getAllSubjects(): Promise<Subject[]> {
    const { data, error } = await getSupabase()
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('subjects table does not exist. Please run the migration.');
        return [];
      }
      console.error('Error fetching subjects:', error);
      throw new Error('Failed to fetch subjects');
    }

    return data || [];
  }
}

// Export singleton instance
export const courseTypeService = new CourseTypeService();
