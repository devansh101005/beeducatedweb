import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Fake credentials so config/service modules can be imported without a
    // real environment. No test in this suite performs network or DB I/O.
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      CASHFREE_WEBHOOK_SECRET: 'test-webhook-secret',
    },
  },
});
