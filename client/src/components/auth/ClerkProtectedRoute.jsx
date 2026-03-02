// Protected Route using Clerk authentication
import { useAuth, useUser, RedirectToSignIn } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

// Use relative URL to go through Vite's proxy in development
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Simple in-memory cache for user role (persists across route navigations)
let cachedRole = null;
let cacheUserId = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * ClerkProtectedRoute - Protects routes using Clerk authentication
 * Also fetches user role from backend for role-based access control
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render when authorized
 * @param {string[]} props.allowedRoles - Optional array of roles that can access this route
 * @param {string} props.redirectTo - Where to redirect if unauthorized (default: /unauthorized)
 */
const ClerkProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectTo = "/unauthorized"
}) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const retryCount = useRef(0);

  // Fetch user role from backend
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isSignedIn || !clerkUser) {
        setLoading(false);
        return;
      }

      // Use cached role if same user and cache is fresh
      if (cachedRole && cacheUserId === clerkUser.id && (Date.now() - cacheTimestamp) < CACHE_TTL) {
        setUserRole(cachedRole);
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/v2/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const role = data.data?.user?.role || null;
          setUserRole(role);
          // Cache the role with timestamp
          cachedRole = role;
          cacheUserId = clerkUser.id;
          cacheTimestamp = Date.now();
          retryCount.current = 0;
        } else if (response.status === 404 && retryCount.current < 3) {
          // User not yet in database (webhook might be processing)
          // Retry up to 3 times with delay
          retryCount.current += 1;
          setTimeout(() => fetchUserRole(), 2000);
          return;
        } else if (response.status === 429) {
          // Rate limited - use cached role if available, otherwise wait and retry once
          if (cachedRole && cacheUserId === clerkUser.id) {
            setUserRole(cachedRole);
          } else if (retryCount.current < 2) {
            retryCount.current += 1;
            setTimeout(() => fetchUserRole(), 5000);
            return;
          } else {
            setError("Too many requests. Please wait a moment and try again.");
          }
        } else {
          setError("Failed to fetch user info");
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchUserRole();
    }
  }, [isLoaded, isSignedIn, clerkUser?.id, getToken]);

  // Show loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in - redirect to sign in
  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={location.pathname} />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              cachedRole = null;
              cacheUserId = null;
              cacheTimestamp = 0;
              retryCount.current = 0;
              window.location.reload();
            }}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && userRole) {
    // Map legacy role names to new ones
    const roleMap = {
      ADMIN: "admin",
      STUDENT: "student",
      TUTOR: "teacher",
      TEACHER: "teacher",
      PARENT: "parent",
      BATCH_MANAGER: "batch_manager",
    };

    const normalizedAllowedRoles = allowedRoles.map(
      (role) => roleMap[role] || role.toLowerCase()
    );

    if (!normalizedAllowedRoles.includes(userRole)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Authorized - render children
  return children;
};

export default ClerkProtectedRoute;
