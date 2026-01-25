// Protected Route using Clerk authentication
import { useAuth, useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// Use relative URL to go through Vite's proxy in development
const API_URL = import.meta.env.VITE_API_URL || "/api";

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

  // Fetch user role from backend
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isSignedIn || !clerkUser) {
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
          setUserRole(data.data?.user?.role || null);
        } else if (response.status === 404) {
          // User not yet in database (webhook might be processing)
          // Retry after a short delay
          setTimeout(() => fetchUserRole(), 2000);
          return;
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
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

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
            onClick={() => window.location.reload()}
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
