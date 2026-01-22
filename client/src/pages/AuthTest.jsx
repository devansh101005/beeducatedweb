// Auth Test Page - Temporary page to test Clerk integration
// This page can be removed after Phase 1

import { useAuth, useUser, SignInButton, SignOutButton, UserButton, ClerkLoaded, ClerkLoading } from "@clerk/clerk-react";

// Check if Clerk is configured
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Component that uses Clerk hooks (only rendered when ClerkProvider exists)
const ClerkAuthTest = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading auth...</span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Auth Status</h2>

        <div className="space-y-2">
          <p>
            <span className="font-medium">Clerk Configured:</span>{" "}
            <span className="text-green-600">✅ Yes</span>
          </p>
          <p>
            <span className="font-medium">Loaded:</span>{" "}
            <span className={isLoaded ? "text-green-600" : "text-red-600"}>
              {isLoaded ? "✅ Yes" : "❌ No"}
            </span>
          </p>
          <p>
            <span className="font-medium">Signed In:</span>{" "}
            <span className={isSignedIn ? "text-green-600" : "text-yellow-600"}>
              {isSignedIn ? "✅ Yes" : "⚠️ No"}
            </span>
          </p>
          {userId && (
            <p>
              <span className="font-medium">User ID:</span>{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{userId}</code>
            </p>
          )}
        </div>
      </div>

      {isSignedIn ? (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>

          <div className="flex items-center space-x-4 mb-4">
            <UserButton afterSignOutUrl="/auth-test" />
            <div>
              <p className="font-medium">{user?.fullName || "No name"}</p>
              <p className="text-gray-500 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Email:</span> {user?.primaryEmailAddress?.emailAddress || "N/A"}</p>
            <p><span className="font-medium">Phone:</span> {user?.primaryPhoneNumber?.phoneNumber || "N/A"}</p>
            <p><span className="font-medium">Created:</span> {user?.createdAt?.toLocaleDateString() || "N/A"}</p>
          </div>

          <div className="mt-6">
            <SignOutButton>
              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sign In to Test</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to sign in with Clerk and verify the integration is working.
          </p>
          <SignInButton mode="modal">
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium">
              Sign In with Clerk
            </button>
          </SignInButton>
        </div>
      )}
    </>
  );
};

// Fallback when Clerk is not configured
const NoClerkFallback = () => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Clerk Not Configured</h2>
    <p className="text-red-700 mb-4">
      The <code className="bg-red-100 px-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> environment variable is missing.
    </p>
    <div className="bg-white p-4 rounded border text-sm">
      <p className="font-medium mb-2">To fix this:</p>
      <ol className="list-decimal list-inside space-y-1 text-gray-700">
        <li>Add your Clerk publishable key to <code className="bg-gray-100 px-1 rounded">client/.env</code></li>
        <li>Restart the dev server (<code className="bg-gray-100 px-1 rounded">npm run dev</code>)</li>
        <li>Refresh this page</li>
      </ol>
    </div>
  </div>
);

const AuthTest = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Clerk Auth Test</h1>

        {CLERK_KEY ? <ClerkAuthTest /> : <NoClerkFallback />}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Test Instructions</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
            <li>Ensure VITE_CLERK_PUBLISHABLE_KEY is set in client/.env</li>
            <li>Restart the dev server if you just added the key</li>
            <li>Click "Sign In with Clerk" button</li>
            <li>Create a new account or sign in</li>
            <li>Verify your user info appears above</li>
          </ol>
        </div>

        <div className="mt-4 text-center text-gray-500 text-sm">
          <a href="/" className="text-indigo-600 hover:underline">Back to Home</a>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
