// Sign Up Page - Uses Clerk for registration
// Note: In BeEducated, new accounts are typically created by admin
// This page is for self-registration if enabled

import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-amber-600 mb-2">
            🐝 BeEducated
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-gray-600">
            Join our learning community
          </p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="flex justify-center">
          <ClerkSignUp
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-amber-500 hover:bg-amber-600 text-white font-semibold",
                card: "shadow-xl border border-amber-200",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border-gray-300 hover:bg-gray-50",
                formFieldInput:
                  "border-gray-300 focus:ring-amber-500 focus:border-amber-500",
                footerActionLink: "text-amber-600 hover:text-amber-700",
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> After signing up, an administrator will
            assign your role (student, teacher, or parent) and you'll gain
            access to the appropriate dashboard.
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-amber-600 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
