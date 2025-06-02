/**
 * Supabase Client Configuration
 *
 * This file initializes and exports the Supabase client for use throughout the application.
 * It uses environment variables for the Supabase URL and anonymous key.
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase URL or anon key. Please check your environment variables:',
    '\n- NEXT_PUBLIC_SUPABASE_URL',
    '\n- NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Create dummy client if environment variables are missing (for development only)
// This prevents the app from crashing during development if .env.local is not set up
const dummyClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Development mode - no Supabase connection' } }),
    signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Development mode - no Supabase connection' } }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
};

// Create and export the Supabase client if environment variables are available
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : dummyClient as any; // Use the dummy client if env vars are missing

export default supabase;