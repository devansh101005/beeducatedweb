// User Profile Page - Uses Clerk UserProfile component
import { UserProfile as ClerkUserProfile } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600">Manage your profile and security settings</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            ← Back
          </button>
        </div>

        {/* Clerk User Profile Component */}
        <div className="flex justify-center">
          <ClerkUserProfile
            appearance={{
              elements: {
                card: "shadow-lg border border-gray-200",
                navbar: "bg-gray-50",
                navbarButton: "text-gray-700 hover:text-amber-600",
                navbarButtonActive: "text-amber-600 border-amber-600",
                formButtonPrimary:
                  "bg-amber-500 hover:bg-amber-600 text-white",
                formFieldInput:
                  "border-gray-300 focus:ring-amber-500 focus:border-amber-500",
              },
            }}
            routing="path"
            path="/profile"
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
