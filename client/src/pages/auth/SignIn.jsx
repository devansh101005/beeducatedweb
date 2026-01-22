// Sign In Page - Uses Clerk for authentication
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
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
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="flex justify-center">
          <ClerkSignIn
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
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
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

export default SignIn;
