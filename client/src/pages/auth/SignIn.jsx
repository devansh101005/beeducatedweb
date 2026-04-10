import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const SignIn = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-[#0a1e3d]/85"></div>

      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="no-underline">
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mb-1">
              Be Educated
            </h1>
          </Link>
          <p className="font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-2">
            IIT-JEE & NEET Foundation
          </p>
          <h2 className="font-heading text-xl font-bold text-white/90">
            Welcome Back
          </h2>
          <p className="font-body text-sm text-white/50 mt-1">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Clerk Sign In */}
        <div className="flex justify-center">
          <ClerkSignIn
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-[#05308d] hover:bg-[#1a56db] text-white font-semibold shadow-lg",
                card: "shadow-2xl border border-white/10 rounded-2xl",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border-gray-200 hover:bg-gray-50 font-medium",
                formFieldInput:
                  "border-gray-200 focus:ring-[#05308d] focus:border-[#05308d] rounded-lg",
                footerActionLink: "text-[#05308d] hover:text-[#1a56db] font-semibold",
                identityPreviewEditButton: "text-[#05308d] hover:text-[#1a56db]",
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
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-heading text-sm font-semibold text-white/50 hover:text-white no-underline transition-colors duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
