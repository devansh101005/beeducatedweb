// Announcement Service
// Handles announcement CRUD operations with Supabase

import { getSupabase } from '../config/supabase.js';
import { storageService, BUCKETS } from './storageService.js';

// Types
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AnnouncementTarget = 'all' | 'batch' | 'course' | 'role';
export type UserRole = 'admin' | 'student' | 'parent' | 'teacher' | 'batch_manager';

export interface Attachment {
  name: string;
  path: string;
  size: number;
  type: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  target_type: AnnouncementTarget;
  target_batch_id: string | null;
  target_course_id: string | null;
  target_roles: UserRole[] | null;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  attachments: Attachment[];
  publish_at: string | null;
  expires_at: string | null;
  is_published: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementRead {
  id: string;
  announcement_id: string;
  user_id: string;
  read_at: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  target_type?: AnnouncementTarget;
  target_batch_id?: string;
  target_course_id?: string;
  target_roles?: UserRole[];
  priority?: AnnouncementPriority;
  is_pinned?: boolean;
  attachments?: Attachment[];
  publish_at?: string;
  expires_at?: string;
  is_published?: boolean;
  created_by?: string;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  target_type?: AnnouncementTarget;
  target_batch_id?: string | null;
  target_course_id?: string | null;
  target_roles?: UserRole[] | null;
  priority?: AnnouncementPriority;
  is_pinned?: boolean;
  attachments?: Attachment[];
  publish_at?: string | null;
  expires_at?: string | null;
  is_published?: boolean;
  updated_by?: string;
}

export interface AnnouncementListOptions {
  page?: number;
  limit?: number;
  targetType?: AnnouncementTarget;
  batchId?: string;
  courseId?: string;
  priority?: AnnouncementPriority;
  isPublished?: boolean;
  isPinned?: boolean;
  userId?: string; // For filtering by user access
  userRole?: UserRole;
  excludeExpired?: boolean;
  search?: string;
}

class AnnouncementService {
  private supabase = getSupabase();

  /**
   * Get announcement by ID
   */
  async getById(id: string): Promise<Announcement | null> {
    const { data, error } = await this.supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get announcement: ${error.message}`);
    }

    return data as Announcement;
  }

  /**
   * Create new announcement
   */
  async create(input: CreateAnnouncementInput): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('announcements')
      .insert({
        ...input,
        publish_at: input.publish_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create announcement: ${error.message}`);
    }

    return data as Announcement;
  }

  /**
   * Update announcement
   */
  async update(id: string, input: UpdateAnnouncementInput): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('announcements')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update announcement: ${error.message}`);
    }

    return data as Announcement;
  }

  /**
   * Delete announcement (also deletes attachments)
   */
  async delete(id: string): Promise<void> {
    const announcement = await this.getById(id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Delete attachments from storage
    if (announcement.attachments && announcement.attachments.length > 0) {
      const paths = announcement.attachments.map((a) => a.path);
      try {
        await storageService.deleteMany(BUCKETS.ANNOUNCEMENTS, paths);
      } catch (err) {
        console.error('Failed to delete announcement attachments:', err);
      }
    }

    // Delete from database
    const { error } = await this.supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete announcement: ${error.message}`);
    }
  }

  /**
   * List announcements with filters
   */
  async list(options: AnnouncementListOptions = {}): Promise<{ announcements: Announcement[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      targetType,
      batchId,
      courseId,
      priority,
      isPublished,
      isPinned,
      excludeExpired = true,
      search,
    } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('announcements')
      .select('*', { count: 'exact' });

    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    if (batchId) {
      query = query.eq('target_batch_id', batchId);
    }

    if (courseId) {
      query = query.eq('target_course_id', courseId);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (isPublished !== undefined) {
      query = query.eq('is_published', isPublished);
    }

    if (isPinned !== undefined) {
      query = query.eq('is_pinned', isPinned);
    }

    if (excludeExpired) {
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
    }

    // Order: pinned first, then by priority, then by date
    const { data, error, count } = await query
      .order('is_pinned', { ascending: false })
      .order('priority', { ascending: false })
      .order('publish_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list announcements: ${error.message}`);
    }

    return {
      announcements: data as Announcement[],
      total: count || 0,
    };
  }

  /**
   * Get announcements for a specific user based on their role and enrollments
   */
  async getForUser(
    userId: string,
    userRole: UserRole,
    options: {
      page?: number;
      limit?: number;
      batchIds?: string[];
      courseIds?: string[];
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ announcements: (Announcement & { is_read: boolean })[]; total: number }> {
    const { page = 1, limit = 20, batchIds = [], courseIds = [], unreadOnly = false } = options;
    const offset = (page - 1) * limit;
    const now = new Date().toISOString();

    // Build query for announcements visible to this user
    let query = this.supabase
      .from('announcements')
      .select('*, reads:announcement_reads!left(user_id)', { count: 'exact' })
      .eq('is_published', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    // Filter by target type
    const targetFilters: string[] = [
      'target_type.eq.all', // All users
      `target_roles.cs.{${userRole}}`, // Role-based
    ];

    // Add batch targeting if user is in batches
    if (batchIds.length > 0) {
      targetFilters.push(`target_batch_id.in.(${batchIds.join(',')})`);
    }

    // Add course targeting if user is enrolled in courses
    if (courseIds.length > 0) {
      targetFilters.push(`target_course_id.in.(${courseIds.join(',')})`);
    }

    query = query.or(targetFilters.join(','));

    const { data, error, count } = await query
      .order('is_pinned', { ascending: false })
      .order('priority', { ascending: false })
      .order('publish_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get user announcements: ${error.message}`);
    }

    // Process results to add is_read flag
    const announcements = (data as (Announcement & { reads: { user_id: string }[] })[]).map((a) => {
      const isRead = a.reads?.some((r) => r.user_id === userId) || false;
      const { reads, ...announcement } = a;
      return { ...announcement, is_read: isRead };
    });

    // Filter to unread only if requested
    const filtered = unreadOnly ? announcements.filter((a) => !a.is_read) : announcements;

    return {
      announcements: filtered,
      total: unreadOnly ? filtered.length : (count || 0),
    };
  }

  /**
   * Mark announcement as read
   */
  async markAsRead(announcementId: string, userId: string): Promise<AnnouncementRead> {
    // Check if already read
    const { data: existing } = await this.supabase
      .from('announcement_reads')
      .select('*')
      .eq('announcement_id', announcementId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return existing as AnnouncementRead;
    }

    const { data, error } = await this.supabase
      .from('announcement_reads')
      .insert({
        announcement_id: announcementId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark as read: ${error.message}`);
    }

    return data as AnnouncementRead;
  }

  /**
   * Mark multiple announcements as read
   */
  async markMultipleAsRead(announcementIds: string[], userId: string): Promise<void> {
    const records = announcementIds.map((id) => ({
      announcement_id: id,
      user_id: userId,
    }));

    const { error } = await this.supabase
      .from('announcement_reads')
      .upsert(records, { onConflict: 'announcement_id,user_id' });

    if (error) {
      throw new Error(`Failed to mark as read: ${error.message}`);
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(
    userId: string,
    userRole: UserRole,
    batchIds: string[] = [],
    courseIds: string[] = []
  ): Promise<number> {
    const now = new Date().toISOString();

    // Use a simpler approach - get total targeted and subtract read
    let query = this.supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    // Filter by target type
    const targetFilters: string[] = [
      'target_type.eq.all',
      `target_roles.cs.{${userRole}}`,
    ];

    if (batchIds.length > 0) {
      targetFilters.push(`target_batch_id.in.(${batchIds.join(',')})`);
    }

    if (courseIds.length > 0) {
      targetFilters.push(`target_course_id.in.(${courseIds.join(',')})`);
    }

    query = query.or(targetFilters.join(','));

    const { count: totalCount, error: totalError } = await query;

    if (totalError) {
      throw new Error(`Failed to get announcement count: ${totalError.message}`);
    }

    // Get read count
    const { count: readCount, error: readError } = await this.supabase
      .from('announcement_reads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (readError) {
      throw new Error(`Failed to get read count: ${readError.message}`);
    }

    return Math.max(0, (totalCount || 0) - (readCount || 0));
  }

  /**
   * Get read status for announcements
   */
  async getReadStatus(announcementIds: string[], userId: string): Promise<Record<string, boolean>> {
    const { data, error } = await this.supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('user_id', userId)
      .in('announcement_id', announcementIds);

    if (error) {
      throw new Error(`Failed to get read status: ${error.message}`);
    }

    const readSet = new Set(data.map((r) => r.announcement_id));
    const status: Record<string, boolean> = {};

    for (const id of announcementIds) {
      status[id] = readSet.has(id);
    }

    return status;
  }

  /**
   * Pin/unpin announcement
   */
  async togglePin(id: string, isPinned: boolean): Promise<Announcement> {
    return this.update(id, { is_pinned: isPinned });
  }

  /**
   * Publish announcement
   */
  async publish(id: string): Promise<Announcement> {
    return this.update(id, {
      is_published: true,
      publish_at: new Date().toISOString(),
    });
  }

  /**
   * Unpublish announcement
   */
  async unpublish(id: string): Promise<Announcement> {
    return this.update(id, { is_published: false });
  }

  /**
   * Schedule announcement for future publish
   */
  async schedule(id: string, publishAt: string): Promise<Announcement> {
    return this.update(id, {
      publish_at: publishAt,
      is_published: true, // Will be visible when publish_at is reached
    });
  }

  /**
   * Add attachment to announcement
   */
  async addAttachment(id: string, attachment: Attachment): Promise<Announcement> {
    const announcement = await this.getById(id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    const attachments = [...(announcement.attachments || []), attachment];
    return this.update(id, { attachments });
  }

  /**
   * Remove attachment from announcement
   */
  async removeAttachment(id: string, attachmentPath: string): Promise<Announcement> {
    const announcement = await this.getById(id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Delete from storage
    try {
      await storageService.delete(BUCKETS.ANNOUNCEMENTS, attachmentPath);
    } catch (err) {
      console.error('Failed to delete attachment file:', err);
    }

    // Update announcement
    const attachments = (announcement.attachments || []).filter((a) => a.path !== attachmentPath);
    return this.update(id, { attachments });
  }
}

// Export singleton instance
export const announcementService = new AnnouncementService();
