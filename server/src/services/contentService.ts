// Content Service
// Handles course content CRUD operations with Supabase

import { getSupabase } from '../config/supabase.js';
import { storageService, BUCKETS } from './storageService.js';

// Types
export type ContentType = 'video' | 'pdf' | 'document' | 'image' | 'audio' | 'link';
export type MaterialType = 'lecture' | 'notes' | 'dpp' | 'dpp_pdf' | 'dpp_video' | 'quiz';

export interface Content {
  id: string;
  course_id: string | null;
  topic_id: string | null;
  batch_id: string | null;
  // New hierarchy fields
  class_id: string | null;
  subject_id: string | null;
  material_type: MaterialType | null;
  // Basic info
  title: string;
  description: string | null;
  content_type: ContentType;
  file_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  thumbnail_path: string | null;
  sequence_order: number;
  is_free: boolean;
  is_downloadable: boolean;
  is_published: boolean;
  published_at: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentProgress {
  id: string;
  content_id: string;
  student_id: string;
  progress_seconds: number;
  progress_percent: number;
  completed: boolean;
  completed_at: string | null;
  view_count: number;
  last_position_seconds: number;
  last_accessed_at: string;
  notes: Array<{ time: number; note: string }>;
  created_at: string;
  updated_at: string;
}

export interface CreateContentInput {
  course_id?: string;
  topic_id?: string;
  batch_id?: string;
  // New hierarchy fields
  class_id?: string;
  subject_id?: string;
  material_type?: MaterialType;
  // Basic info
  title: string;
  description?: string;
  content_type: ContentType;
  file_path?: string;  // Optional - file uploaded separately
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  thumbnail_path?: string;
  sequence_order?: number;
  is_free?: boolean;
  is_downloadable?: boolean;
  is_published?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_by?: string;
}

export interface UpdateContentInput {
  title?: string;
  description?: string;
  // New hierarchy fields
  class_id?: string;
  subject_id?: string;
  material_type?: MaterialType;
  // File info
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  thumbnail_path?: string;
  sequence_order?: number;
  is_free?: boolean;
  is_downloadable?: boolean;
  is_published?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
  updated_by?: string;
}

export interface ContentListOptions {
  page?: number;
  limit?: number;
  courseId?: string;
  topicId?: string;
  batchId?: string;
  // New hierarchy filters
  classId?: string;
  subjectId?: string;
  materialType?: MaterialType;
  // Other filters
  contentType?: ContentType;
  isPublished?: boolean;
  isFree?: boolean;
  search?: string;
}

class ContentService {
  private supabase = getSupabase();

  /**
   * Get content by ID
   */
  async getById(id: string): Promise<Content | null> {
    const { data, error } = await this.supabase
      .from('content')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get content: ${error.message}`);
    }

    return data as Content;
  }

  /**
   * Create new content
   */
  async create(input: CreateContentInput): Promise<Content> {
    const insertData = {
      ...input,
      published_at: input.is_published ? new Date().toISOString() : null,
    };

    const { data, error } = await this.supabase
      .from('content')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create content: ${error.message}`);
    }

    return data as Content;
  }

  /**
   * Update content
   */
  async update(id: string, input: UpdateContentInput): Promise<Content> {
    // If publishing for the first time, set published_at
    if (input.is_published) {
      const existing = await this.getById(id);
      if (existing && !existing.published_at) {
        (input as Record<string, unknown>).published_at = new Date().toISOString();
      }
    }

    const { data, error } = await this.supabase
      .from('content')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update content: ${error.message}`);
    }

    return data as Content;
  }

  /**
   * Delete content (also deletes files from storage)
   */
  async delete(id: string): Promise<void> {
    const content = await this.getById(id);
    if (!content) {
      throw new Error('Content not found');
    }

    // Delete the file from storage
    if (content.file_path) {
      try {
        await storageService.delete(BUCKETS.COURSE_CONTENT, content.file_path);
      } catch (err) {
        console.error('Failed to delete file from storage:', err);
      }
    }

    // Delete thumbnail if exists
    if (content.thumbnail_path) {
      try {
        await storageService.delete(BUCKETS.THUMBNAILS, content.thumbnail_path);
      } catch (err) {
        console.error('Failed to delete thumbnail:', err);
      }
    }

    // Delete from database
    const { error } = await this.supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete content: ${error.message}`);
    }
  }

  /**
   * List content with filters
   */
  async list(options: ContentListOptions = {}): Promise<{ content: Content[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      courseId,
      topicId,
      batchId,
      classId,
      subjectId,
      materialType,
      contentType,
      isPublished,
      isFree,
      search,
    } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('content')
      .select('*', { count: 'exact' });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    if (batchId) {
      query = query.eq('batch_id', batchId);
    }

    // New hierarchy filters
    if (classId) {
      query = query.eq('class_id', classId);
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (materialType) {
      query = query.eq('material_type', materialType);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    if (isPublished !== undefined) {
      query = query.eq('is_published', isPublished);
    }

    if (isFree !== undefined) {
      query = query.eq('is_free', isFree);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('sequence_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list content: ${error.message}`);
    }

    return {
      content: data as Content[],
      total: count || 0,
    };
  }

  /**
   * Get content statistics (for admin dashboard)
   */
  async getStats(options: { courseTypeId?: string; classId?: string } = {}): Promise<{
    total: number;
    published: number;
    draft: number;
    byType: Record<string, number>;
    byMaterialType: Record<string, number>;
  }> {
    const { courseTypeId, classId } = options;

    // Build base query
    let query = this.supabase.from('content').select('id, content_type, material_type, is_published, class_id');

    // Filter by class if specified
    if (classId) {
      query = query.eq('class_id', classId);
    }

    // If courseTypeId is specified, need to filter by classes belonging to that course type
    if (courseTypeId && !classId) {
      // Get classes for this course type first
      const { data: classes } = await this.supabase
        .from('academic_classes')
        .select('id')
        .eq('course_type_id', courseTypeId);

      if (classes && classes.length > 0) {
        const classIds = classes.map(c => c.id);
        query = query.in('class_id', classIds);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get content stats: ${error.message}`);
    }

    const content = data || [];

    // Calculate stats
    const stats = {
      total: content.length,
      published: content.filter(c => c.is_published).length,
      draft: content.filter(c => !c.is_published).length,
      byType: {} as Record<string, number>,
      byMaterialType: {} as Record<string, number>,
    };

    // Count by content type
    content.forEach(c => {
      const type = c.content_type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    // Count by material type
    content.forEach(c => {
      const type = c.material_type || 'unknown';
      stats.byMaterialType[type] = (stats.byMaterialType[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get content by course with topics
   */
  async getByCourse(courseId: string): Promise<Content[]> {
    const { data, error } = await this.supabase
      .from('content')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('sequence_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get course content: ${error.message}`);
    }

    return data as Content[];
  }

  /**
   * Get signed URL for content access
   */
  async getAccessUrl(
    contentId: string,
    studentId?: string,
    download = false
  ): Promise<{ url: string; expiresIn: number }> {
    const content = await this.getById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Update progress if student ID provided
    if (studentId) {
      await this.updateProgress(contentId, studentId, { view_count_increment: true });
    }

    const expiresIn = 3600; // 1 hour
    const url = await storageService.getSignedUrl({
      bucket: BUCKETS.COURSE_CONTENT,
      path: content.file_path,
      expiresIn,
      download: download && content.is_downloadable,
      fileName: content.file_name || undefined,
    });

    return { url, expiresIn };
  }

  /**
   * Update or create content progress
   */
  async updateProgress(
    contentId: string,
    studentId: string,
    updates: {
      progress_seconds?: number;
      progress_percent?: number;
      last_position_seconds?: number;
      completed?: boolean;
      view_count_increment?: boolean;
      note?: { time: number; note: string };
    }
  ): Promise<ContentProgress> {
    const content = await this.getById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Check if progress record exists
    const { data: existing } = await this.supabase
      .from('content_progress')
      .select('*')
      .eq('content_id', contentId)
      .eq('student_id', studentId)
      .single();

    const updateData: Record<string, unknown> = {
      last_accessed_at: new Date().toISOString(),
    };

    if (updates.progress_seconds !== undefined) {
      updateData.progress_seconds = updates.progress_seconds;
    }

    if (updates.progress_percent !== undefined) {
      updateData.progress_percent = updates.progress_percent;
    }

    if (updates.last_position_seconds !== undefined) {
      updateData.last_position_seconds = updates.last_position_seconds;
    }

    if (updates.completed !== undefined) {
      updateData.completed = updates.completed;
      if (updates.completed) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (existing) {
      // Update existing progress
      if (updates.view_count_increment) {
        updateData.view_count = (existing.view_count || 0) + 1;
      }

      if (updates.note) {
        const notes = existing.notes || [];
        notes.push(updates.note);
        updateData.notes = notes;
      }

      const { data, error } = await this.supabase
        .from('content_progress')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update progress: ${error.message}`);
      }

      return data as ContentProgress;
    } else {
      // Create new progress record
      const insertData = {
        content_id: contentId,
        student_id: studentId,
        progress_seconds: updates.progress_seconds || 0,
        progress_percent: updates.progress_percent || 0,
        last_position_seconds: updates.last_position_seconds || 0,
        completed: updates.completed || false,
        view_count: 1,
        notes: updates.note ? [updates.note] : [],
        last_accessed_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('content_progress')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create progress: ${error.message}`);
      }

      return data as ContentProgress;
    }
  }

  /**
   * Get student's progress for a content item
   */
  async getProgress(contentId: string, studentId: string): Promise<ContentProgress | null> {
    const { data, error } = await this.supabase
      .from('content_progress')
      .select('*')
      .eq('content_id', contentId)
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get progress: ${error.message}`);
    }

    return data as ContentProgress;
  }

  /**
   * Get all progress for a student in a course
   */
  async getCourseProgress(
    courseId: string,
    studentId: string
  ): Promise<{ content: Content; progress: ContentProgress | null }[]> {
    const { data, error } = await this.supabase
      .from('content')
      .select(`
        *,
        progress:content_progress(*)
      `)
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('sequence_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get course progress: ${error.message}`);
    }

    return data.map((item: Content & { progress: ContentProgress[] }) => ({
      content: item,
      progress: item.progress?.find((p: ContentProgress) => p.student_id === studentId) || null,
    }));
  }

  /**
   * Reorder content within a course/topic
   */
  async reorder(contentIds: string[]): Promise<void> {
    for (let i = 0; i < contentIds.length; i++) {
      const { error } = await this.supabase
        .from('content')
        .update({ sequence_order: i })
        .eq('id', contentIds[i]);

      if (error) {
        throw new Error(`Failed to reorder content: ${error.message}`);
      }
    }
  }

  /**
   * Publish content
   */
  async publish(id: string): Promise<Content> {
    return this.update(id, {
      is_published: true,
    });
  }

  /**
   * Unpublish content
   */
  async unpublish(id: string): Promise<Content> {
    const { data, error } = await this.supabase
      .from('content')
      .update({ is_published: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to unpublish content: ${error.message}`);
    }

    return data as Content;
  }

  /**
   * Duplicate content
   */
  async duplicate(id: string, newCourseId?: string): Promise<Content> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error('Content not found');
    }

    return this.create({
      course_id: newCourseId || original.course_id || undefined,
      topic_id: original.topic_id || undefined,
      batch_id: original.batch_id || undefined,
      class_id: original.class_id || undefined,
      subject_id: original.subject_id || undefined,
      material_type: original.material_type || undefined,
      title: `${original.title} (Copy)`,
      description: original.description || undefined,
      content_type: original.content_type,
      file_path: original.file_path,
      file_name: original.file_name || undefined,
      file_size: original.file_size || undefined,
      mime_type: original.mime_type || undefined,
      duration_seconds: original.duration_seconds || undefined,
      thumbnail_path: original.thumbnail_path || undefined,
      sequence_order: original.sequence_order,
      is_free: original.is_free,
      is_downloadable: original.is_downloadable,
      is_published: false,
      tags: original.tags || undefined,
      metadata: original.metadata,
      created_by: original.created_by || undefined,
    });
  }

  /**
   * Get content by class ID with optional filters
   */
  async getByClass(
    classId: string,
    options: { subjectId?: string; materialType?: MaterialType; publishedOnly?: boolean } = {}
  ): Promise<Content[]> {
    let query = this.supabase
      .from('content')
      .select('*')
      .eq('class_id', classId);

    if (options.subjectId) {
      query = query.eq('subject_id', options.subjectId);
    }

    if (options.materialType) {
      query = query.eq('material_type', options.materialType);
    }

    if (options.publishedOnly !== false) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query.order('sequence_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get class content: ${error.message}`);
    }

    return data as Content[];
  }

  /**
   * Get content with full hierarchy details (using view)
   */
  async getWithHierarchy(id: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.supabase
      .from('content_with_hierarchy')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get content with hierarchy: ${error.message}`);
    }

    return data;
  }

  /**
   * List content with hierarchy details
   */
  async listWithHierarchy(options: ContentListOptions = {}): Promise<{ content: Record<string, unknown>[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      classId,
      subjectId,
      materialType,
      contentType,
      isPublished,
      search,
    } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('content_with_hierarchy')
      .select('*', { count: 'exact' });

    if (classId) {
      query = query.eq('class_id', classId);
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (materialType) {
      query = query.eq('material_type', materialType);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    if (isPublished !== undefined) {
      query = query.eq('is_published', isPublished);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('sequence_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list content with hierarchy: ${error.message}`);
    }

    return {
      content: data || [],
      total: count || 0,
    };
  }

  /**
   * Get content accessible to a student based on their class enrollment
   * Uses the content_with_hierarchy view to include class and subject info
   * Falls back to using class_grade from student profile if no formal enrollments exist
   */
  async getStudentClassContent(
    studentId: string,
    options: { classId?: string; subjectId?: string; materialType?: MaterialType; classGrade?: string } = {}
  ): Promise<any[]> {
    let enrolledClassIds: string[] = [];

    // First, try to get the student's enrolled classes from class_enrollments
    const { data: enrollments, error: enrollError } = await this.supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError.message);
      // Don't throw - try fallback
    }

    if (enrollments && enrollments.length > 0) {
      enrolledClassIds = enrollments.map(e => e.class_id);
      console.log('[Content] Found formal enrollments:', enrolledClassIds.length);
    }

    // Fallback: If no formal enrollments, try to find class based on class_grade
    if (enrolledClassIds.length === 0 && options.classGrade) {
      console.log('[Content] No formal enrollments, using class_grade fallback:', options.classGrade);

      // Normalize the grade - extract just the number
      // Handles: "10th", "10", "Class 10", "Grade 10", "10th Grade", etc.
      const gradeMatch = options.classGrade.match(/(\d+)/);
      const gradeNumber = gradeMatch ? gradeMatch[1] : options.classGrade;

      console.log('[Content] Normalized grade number:', gradeNumber);

      // Try to find academic class by grade number
      const { data: matchingClasses } = await this.supabase
        .from('academic_classes')
        .select('id, name, slug')
        .or(`name.ilike.%${gradeNumber}%,slug.ilike.%${gradeNumber}%`)
        .eq('is_active', true);

      console.log('[Content] Matching classes query result:', matchingClasses);

      if (matchingClasses && matchingClasses.length > 0) {
        // Filter to exact grade match (e.g., "Class 10" not "Class 100" or "Class 1")
        const exactMatches = matchingClasses.filter(c => {
          const classMatch = c.name?.match(/(\d+)/) || c.slug?.match(/(\d+)/);
          return classMatch && classMatch[1] === gradeNumber;
        });

        if (exactMatches.length > 0) {
          enrolledClassIds = exactMatches.map(c => c.id);
          console.log('[Content] Found classes by grade fallback:', enrolledClassIds, exactMatches.map(c => c.name));
        } else {
          // Fallback to all matches if no exact match
          enrolledClassIds = matchingClasses.map(c => c.id);
          console.log('[Content] Found classes (partial match):', enrolledClassIds);
        }
      }
    }

    if (enrolledClassIds.length === 0) {
      console.log('[Content] No classes found for student');
      return [];
    }

    // Use content_with_hierarchy view to get class and subject names
    let query = this.supabase
      .from('content_with_hierarchy')
      .select('*')
      .in('class_id', enrolledClassIds)
      .eq('is_published', true);

    if (options.classId && enrolledClassIds.includes(options.classId)) {
      query = query.eq('class_id', options.classId);
    }

    if (options.subjectId) {
      query = query.eq('subject_id', options.subjectId);
    }

    if (options.materialType) {
      query = query.eq('material_type', options.materialType);
    }

    const { data, error } = await query.order('sequence_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get student content: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const contentService = new ContentService();
