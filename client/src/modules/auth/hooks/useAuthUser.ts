// Custom hook for authenticated user data
// Created in Phase 0 - Step 2

import { useUser, useAuth } from '@clerk/clerk-react';
import type { UserRole, StudentType } from '@/shared/types';

interface ClerkPublicMetadata {
  role?: UserRole;
  dbUserId?: string;
  studentId?: string;
  parentId?: string;
  teacherId?: string;
  studentType?: StudentType;
  classId?: string;
  batchId?: string;
}

interface AuthUser {
  // Clerk data
  clerkId: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  avatarUrl: string | null;

  // Custom metadata
  role: UserRole | null;
  dbUserId: string | null;
  studentId: string | null;
  parentId: string | null;
  teacherId: string | null;
  studentType: StudentType | null;
  classId: string | null;
  batchId: string | null;

  // Status
  isLoaded: boolean;
  isSignedIn: boolean;
}

/**
 * useAuthUser - Get current authenticated user with role metadata
 *
 * Usage:
 * ```tsx
 * const { role, isAdmin, isStudent, fullName } = useAuthUser();
 * ```
 */
export const useAuthUser = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const metadata = (user?.publicMetadata || {}) as ClerkPublicMetadata;

  const authUser: AuthUser = {
    // Clerk data
    clerkId: userId || '',
    email: user?.primaryEmailAddress?.emailAddress || null,
    phone: user?.primaryPhoneNumber?.phoneNumber || null,
    firstName: user?.firstName || null,
    lastName: user?.lastName || null,
    fullName: user?.fullName || null,
    avatarUrl: user?.imageUrl || null,

    // Custom metadata
    role: metadata.role || null,
    dbUserId: metadata.dbUserId || null,
    studentId: metadata.studentId || null,
    parentId: metadata.parentId || null,
    teacherId: metadata.teacherId || null,
    studentType: metadata.studentType || null,
    classId: metadata.classId || null,
    batchId: metadata.batchId || null,

    // Status
    isLoaded,
    isSignedIn: isSignedIn || false,
  };

  // Computed role checks
  const isAdmin = metadata.role === 'admin';
  const isStudent = metadata.role === 'student';
  const isParent = metadata.role === 'parent';
  const isTeacher = metadata.role === 'teacher';
  const isBatchManager = metadata.role === 'batch_manager';

  return {
    ...authUser,
    isAdmin,
    isStudent,
    isParent,
    isTeacher,
    isBatchManager,
  };
};

export default useAuthUser;
