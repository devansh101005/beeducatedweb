import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ApiSetup } from "./components/ApiSetup.tsx";
import { DevTools } from "./components/DevTools.tsx";

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Render app - conditionally wrap with ClerkProvider only if key exists
const AppWithProviders = () => {
  if (!CLERK_PUBLISHABLE_KEY) {
    console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY - Running without Clerk auth");
    return (
      <AuthProvider>
        <App />
      </AuthProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {/* ApiSetup initializes the API client with Clerk token */}
      <ApiSetup>
        {/* Keep legacy AuthProvider during migration */}
        <AuthProvider>
          <App />
          {/* Dev Tools - Role Switcher (only shows in dev mode) */}
          <DevTools />
        </AuthProvider>
      </ApiSetup>
    </ClerkProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
);
