// Shared backend types
// Created in Phase 0

import { Request } from 'express';

// ============ User Types ============
export type UserRole = 'admin' | 'student' | 'parent' | 'teacher' | 'batch_manager';

export type StudentType = 'coaching_online' | 'coaching_offline' | 'test_series' | 'home_tuition';

export type AccessStatus = 'active' | 'blocked_fee_pending' | 'blocked_manual' | 'suspended';

// ============ Database Entity Types ============
export interface DbUser {
  id: string;
  clerk_id: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  access_status: AccessStatus;
  access_blocked_reason?: string;
  access_blocked_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DbStudent {
  id: string;
  user_id: string;
  student_id: string;
  student_type: StudentType;
  class_id?: string;
  batch_id?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  school_name?: string;
  board?: string;
  enrollment_date: string;
  valid_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DbClass {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbBatch {
  id: string;
  class_id: string;
  name: string;
  description?: string;
  timing?: string;
  batch_manager_id?: string;
  max_students: number;
  current_students: number;
  academic_year: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ Express Extensions ============
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
    role: UserRole;
    dbUserId: string;
    metadata?: Record<string, unknown>;
  };
}

// ============ API Types ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
