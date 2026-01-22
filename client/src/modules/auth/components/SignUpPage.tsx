// Sign Up Page using Clerk
// Created in Phase 0 - Step 2

import { SignUp } from '@clerk/clerk-react';

/**
 * SignUpPage - Clerk Sign Up component wrapper
 *
 * Note: In production, you may want to disable self-registration
 * and have admins create accounts. This is for testing.
 */
export const SignUpPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">BeEducated</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
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

export default SignUpPage;
