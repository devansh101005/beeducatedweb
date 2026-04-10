import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ApiSetup } from "./components/ApiSetup.tsx";
import { DevTools } from "./components/DevTools.tsx";

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Validate Clerk key is present
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    ' Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.\n' +
    'Add it to your .env file(if dev) or deployment environment.\n' +
    ''
  );
}

// Render app - always with ClerkProvider
const AppWithProviders = () => {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));

if (import.meta.env.DEV) {
  root.render(
    <React.StrictMode>
      <AppWithProviders />
    </React.StrictMode>
  );
} else {
  root.render(<AppWithProviders />);
}
