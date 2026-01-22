// Sign In Page using Clerk
// Created in Phase 0 - Step 2

import { SignIn } from '@clerk/clerk-react';

/**
 * SignInPage - Clerk Sign In component wrapper
 *
 * This replaces the legacy LoginForm.jsx
 */
export const SignInPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">BeEducated</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignInPage;
