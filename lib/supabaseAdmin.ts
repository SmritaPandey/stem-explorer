/**
 * Supabase Admin Client Configuration
 *
 * This file initializes and exports a Supabase client for use in backend API routes
 * that require service_role privileges (e.g., admin operations, direct user manipulation).
 * It uses environment variables for the Supabase URL and Service Role Key.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Ensure these are set in your environment variables (e.g., in .env.local or Vercel dashboard)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''; // Can use the public URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Check for missing environment variables, but don't throw errors (to prevent build failures)
if (!supabaseUrl) {
  console.warn("Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is not set in environment variables for admin client.");
}

if (!supabaseServiceKey) {
  console.warn("Supabase Service Key (SUPABASE_SERVICE_KEY) is not set in environment variables for admin client.");
}

// Create a dummy admin client for development if credentials are missing
const dummyAdminClient = {
  from: () => ({
    select: () => ({
      eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    admin: {
      updateUserById: () => Promise.resolve({ data: null, error: null }),
    },
  },
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: () => Promise.resolve({ error: null }),
      createSignedUrl: () => Promise.resolve({ data: null, error: null }),
    }),
  },
};

// Create and export the Supabase Admin client if credentials are available
const supabaseAdmin: SupabaseClient<any, "public", any> = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : dummyAdminClient as any; // Use dummy client if env vars are missing

export default supabaseAdmin;