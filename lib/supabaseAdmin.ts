/**
 * Supabase Admin Client Configuration
 *
 * This file initializes and exports a Supabase client for use in backend API routes
 * that require service_role privileges (e.g., admin operations, direct user manipulation).
 * It uses environment variables for the Supabase URL and Service Role Key.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Ensure these are set in your environment variables (e.g., in .env.local or Vercel dashboard)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Can use the public URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is not set in environment variables for admin client.");
}

if (!supabaseServiceKey) {
  throw new Error("Supabase Service Key (SUPABASE_SERVICE_KEY) is not set in environment variables for admin client.");
}

// Create and export the Supabase Admin client
// Note: We are explicitly typing this as SupabaseClient<any, "public", any>
// to align with common usage, but it will have service role privileges.
const supabaseAdmin: SupabaseClient<any, "public", any> = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // It's generally recommended to disable auto-refresh and session persistence for server-side admin clients
    // as they operate stateless based on the service key.
    autoRefreshToken: false,
    persistSession: false,
    // detectSessionInUrl: false, // Only if you were using this on client-side, usually not for admin
  },
});

export default supabaseAdmin;
