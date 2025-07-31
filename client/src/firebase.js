import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyADXXjiYpFbvtspXSVulxpkHCcGPr8dyus",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "beeducated-d7e9f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "beeducated-d7e9f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "beeducated-d7e9f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "72078596796",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:72078596796:web:aeed7cdbda5a2c438eceb9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Remove the problematic line - appVerificationDisabledForTesting is not available in Firebase v12
// if (import.meta.env.DEV) {
//   auth.settings.appVerificationDisabledForTesting = true;
// }

export { auth };