// Parent Service
// Handles parent CRUD operations with Supabase

import { getSupabase } from '../config/supabase.js';

export interface Parent {
  id: string;
  user_id: string;
  occupation: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateParentInput {
  user_id: string;
  occupation?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface UpdateParentInput {
  occupation?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  metadata?: Record<string, unknown>;
}

export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  is_primary: boolean;
  created_at: string;
}

class ParentService {
  private supabase = getSupabase();

  /**
   * Get parent by ID
   */
  async getById(id: string): Promise<Parent | null> {
    const { data, error } = await this.supabase
      .from('parents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Parent;
  }

  /**
   * Get parent by user ID
   */
  async getByUserId(userId: string): Promise<Parent | null> {
    const { data, error } = await this.supabase
      .from('parents')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Parent;
  }

  /**
   * Create a new parent
   */
  async create(input: CreateParentInput): Promise<Parent> {
    const { data, error } = await this.supabase
      .from('parents')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data as Parent;
  }

  /**
   * Update a parent
   */
  async update(id: string, input: UpdateParentInput): Promise<Parent> {
    const { data, error } = await this.supabase
      .from('parents')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Parent;
  }

  /**
   * Update parent by user ID
   */
  async updateByUserId(userId: string, input: UpdateParentInput): Promise<Parent> {
    const { data, error } = await this.supabase
      .from('parents')
      .update(input)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Parent;
  }

  /**
   * List parents with pagination
   */
  async list(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{ parents: Parent[]; total: number }> {
    const { page = 1, limit = 20, search } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('parents')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(
        `occupation.ilike.%${search}%,city.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      parents: data as Parent[],
      total: count || 0,
    };
  }

  /**
   * Get parent with user details
   */
  async getWithUser(id: string): Promise<{ parent: Parent; user: any } | null> {
    const { data, error } = await this.supabase
      .from('parents')
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
      parent: data as Parent,
      user: data.user,
    };
  }

  /**
   * Link parent to a child (student)
   */
  async linkChild(
    parentId: string,
    studentId: string,
    relationship = 'parent',
    isPrimary = false
  ): Promise<ParentStudent> {
    // If setting as primary, first unset any existing primary
    if (isPrimary) {
      await this.supabase
        .from('parent_students')
        .update({ is_primary: false })
        .eq('student_id', studentId)
        .eq('is_primary', true);
    }

    const { data, error } = await this.supabase
      .from('parent_students')
      .insert({
        parent_id: parentId,
        student_id: studentId,
        relationship,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ParentStudent;
  }

  /**
   * Unlink parent from child
   */
  async unlinkChild(parentId: string, studentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('parent_students')
      .delete()
      .eq('parent_id', parentId)
      .eq('student_id', studentId);

    if (error) throw error;
  }

  /**
   * Get children (students) of a parent
   */
  async getChildren(parentId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('parent_students')
      .select(`
        relationship,
        is_primary,
        student:students(
          *,
          user:users(first_name, last_name, email, avatar_url)
        )
      `)
      .eq('parent_id', parentId);

    if (error) throw error;

    return data.map((d: any) => ({
      ...d.student,
      relationship: d.relationship,
      is_primary_contact: d.is_primary,
    }));
  }

  /**
   * Get parents of a student
   */
  async getParentsOfStudent(studentId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('parent_students')
      .select(`
        relationship,
        is_primary,
        parent:parents(
          *,
          user:users(first_name, last_name, email, phone, avatar_url)
        )
      `)
      .eq('student_id', studentId);

    if (error) throw error;

    return data.map((d: any) => ({
      ...d.parent,
      relationship: d.relationship,
      is_primary_contact: d.is_primary,
    }));
  }

  /**
   * Set primary contact for a student
   */
  async setPrimaryContact(parentId: string, studentId: string): Promise<void> {
    // Unset existing primary
    await this.supabase
      .from('parent_students')
      .update({ is_primary: false })
      .eq('student_id', studentId);

    // Set new primary
    const { error } = await this.supabase
      .from('parent_students')
      .update({ is_primary: true })
      .eq('parent_id', parentId)
      .eq('student_id', studentId);

    if (error) throw error;
  }
}

// Export singleton instance
export const parentService = new ParentService();
