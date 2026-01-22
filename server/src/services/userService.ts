// User Service
// Handles user CRUD operations with Supabase

import { getSupabase } from '../config/supabase.js';

// Types
export type UserRole = 'admin' | 'student' | 'parent' | 'teacher' | 'batch_manager';

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  clerk_id: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: UserRole;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

class UserService {
  private supabase = getSupabase();

  /**
   * Get user by Clerk ID
   */
  async getByClerkId(clerkId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as User;
  }

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as User;
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as User;
  }

  /**
   * Create a new user
   */
  async create(input: CreateUserInput): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        clerk_id: input.clerk_id,
        email: input.email,
        phone: input.phone || null,
        first_name: input.first_name || null,
        last_name: input.last_name || null,
        avatar_url: input.avatar_url || null,
        role: input.role || 'student',
      })
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  /**
   * Update a user
   */
  async update(id: string, input: UpdateUserInput): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  /**
   * Update user by Clerk ID
   */
  async updateByClerkId(clerkId: string, input: UpdateUserInput): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(input)
      .eq('clerk_id', clerkId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  /**
   * Update user role
   */
  async updateRole(id: string, role: UserRole): Promise<User> {
    return this.update(id, { role });
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Reactivate user
   */
  async reactivate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * List users with pagination
   */
  async list(options: {
    page?: number;
    limit?: number;
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  } = {}): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 20, role, isActive, search } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      users: data as User[],
      total: count || 0,
    };
  }

  /**
   * Get user with their profile (student, teacher, or parent)
   */
  async getWithProfile(clerkId: string): Promise<{
    user: User;
    profile: Record<string, unknown> | null;
  } | null> {
    const user = await this.getByClerkId(clerkId);
    if (!user) return null;

    let profile = null;

    switch (user.role) {
      case 'student': {
        const { data } = await this.supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
        break;
      }
      case 'teacher': {
        const { data } = await this.supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
        break;
      }
      case 'parent': {
        const { data } = await this.supabase
          .from('parents')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
        break;
      }
    }

    return { user, profile };
  }
}

// Export singleton instance
export const userService = new UserService();
