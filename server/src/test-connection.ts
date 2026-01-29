// Test script for Supabase connection
// Run with: npx tsx src/test-connection.ts

import { config } from 'dotenv';
config(); // Load .env file

import { getSupabase, isSupabaseConfigured } from './config/supabase.js';

async function testConnection() {
  console.log('\n🔍 Testing Supabase Connection...\n');

  // Check if configured
  if (!isSupabaseConfigured()) {
    console.log(' Supabase is NOT configured.');
    console.log(' Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file');
    process.exit(1);
  }

  console.log(' Supabase environment variables found');
  console.log(`   URL: ${process.env.SUPABASE_URL}`);
  console.log(`   Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20)}...`);

  try {
    const supabase = getSupabase();

    // Try a simple query to test connection
    const { data, error } = await supabase.from('_test').select('*').limit(1);

    if (error) {
      // These errors are expected if the table doesn't exist - means connection works!
      const tableNotFoundCodes = ['42P01', 'PGRST205', 'PGRST204'];
      const tableNotFoundMessages = ['does not exist', 'Could not find', 'not found'];

      const isTableNotFound = tableNotFoundCodes.includes(error.code) ||
        tableNotFoundMessages.some(msg => error.message?.includes(msg));

      if (isTableNotFound) {
        console.log('\n Supabase connection successful!');
        console.log('   (No tables exist yet - that\'s expected)');
      } else {
        throw error;
      }
    } else {
      console.log('\n Supabase connection successful!');
      console.log(`   Query returned ${data?.length || 0} rows`);
    }

    // Test auth API
    const { error: authError } = await supabase.auth.getSession();
    if (!authError) {
      console.log(' Supabase Auth API accessible');
    }

    console.log('\n All connection tests passed!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n Supabase connection failed:');
    console.error(err);
    process.exit(1);
  }
}

testConnection();
