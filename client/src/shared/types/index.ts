// Shared frontend types
// Created in Phase 0

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  id: string;
  clerkId: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  accessStatus: AccessStatus;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'student' | 'parent' | 'teacher' | 'batch_manager';

export type StudentType = 'coaching_online' | 'coaching_offline' | 'test_series' | 'home_tuition';

export type AccessStatus = 'active' | 'blocked_fee_pending' | 'blocked_manual' | 'suspended';

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  studentType: StudentType;
  classId?: string;
  batchId?: string;
  enrollmentDate: string;
  validUntil?: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Batch {
  id: string;
  classId: string;
  name: string;
  timing?: string;
  batchManagerId?: string;
  maxStudents: number;
  currentStudents: number;
  academicYear: string;
  isActive: boolean;
}

export type FeeType =
  | 'registration'
  | 'coaching_installment_1'
  | 'coaching_installment_2'
  | 'test_series_full'
  | 'home_tuition_monthly';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentMode =
  | 'online'
  | 'offline_cash'
  | 'offline_cheque'
  | 'offline_upi'
  | 'offline_bank_transfer';
