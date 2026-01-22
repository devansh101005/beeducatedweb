// Auth Guard component using Clerk
// Created in Phase 0 - Step 2

import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { UserRole } from '@/shared/types';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  fallbackPath?: string;
}

/**
 * AuthGuard - Protects routes requiring authentication
 *
 * Usage:
 * ```tsx
 * <AuthGuard>
 *   <Dashboard />
 * </AuthGuard>
 *
 * <AuthGuard allowedRoles={['admin', 'teacher']}>
 *   <AdminPanel />
 * </AuthGuard>
 * ```
 */
export const AuthGuard = ({
  children,
  allowedRoles,
  fallbackPath = '/sign-in'
}: AuthGuardProps) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  // Still loading auth state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Not signed in - redirect to sign-in
  if (!isSignedIn) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role if required
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.publicMetadata?.role as UserRole | undefined;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default AuthGuard;
