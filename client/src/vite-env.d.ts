/// <reference types="vite/client" />

declare module '@cashfreepayments/cashfree-js' {
  interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_modal' | '_self' | '_blank' | HTMLElement;
    returnUrl?: string;
  }
  interface CashfreeCheckoutResult {
    error?: { code?: string; message?: string };
    paymentDetails?: Record<string, any>;
    redirect?: boolean;
  }
  interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
  }
  export function load(options: { mode: 'sandbox' | 'production' }): Promise<CashfreeInstance | null>;
}

interface ImportMetaEnv {
  // API
  readonly VITE_API_URL: string;
  readonly VITE_API_BASE_URL: string;

  // Clerk Auth
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;

  // Firebase (Legacy - will be removed after migration)
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;

  // Supabase (optional - if using direct client access)
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
