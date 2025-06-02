/**
 * Supabase Admin Client Configuration - Static Site Version
 *
 * This file provides a mock Supabase admin client for static site generation.
 * It simulates admin functionality without requiring actual backend connections.
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
      eq: () => ({ 
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      order: () => Promise.resolve({ data: [], error: null }),
      limit: () => ({ 
        order: () => Promise.resolve({ data: [], error: null }) 
      }),
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
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
      createSignedUrl: () => Promise.resolve({ data: { signedUrl: '' }, error: null }),
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