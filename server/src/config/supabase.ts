// Supabase client configuration
// Created in Phase 0

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    supabaseInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseInstance;
};

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
};

// Test Supabase connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - skipping connection test');
    return false;
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('_test_connection').select('*').limit(1);

    // Table doesn't exist is fine - we just want to test the connection
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};

export { supabaseInstance as supabase };
