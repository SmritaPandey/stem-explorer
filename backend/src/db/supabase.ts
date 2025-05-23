import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''; // Changed to SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key. Please check your environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY).'); // Updated error message
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey); // Use service key

export default supabase;
