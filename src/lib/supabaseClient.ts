import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// This block will run when the module is loaded, typically on server start or first import.
if (typeof window === 'undefined') { // Log only on the server-side
  console.log('-------------------------------------------------------------');
  console.log('[SupabaseClient] Initializing Supabase client on the server...');
  if (!supabaseUrl) {
    console.error('[SupabaseClient] ERROR: NEXT_PUBLIC_SUPABASE_URL is MISSING or undefined.');
  } else {
    console.log('[SupabaseClient] NEXT_PUBLIC_SUPABASE_URL: Loaded (starts with ' + supabaseUrl.substring(0,30) + '...)');
  }
  if (!supabaseAnonKey) {
    console.error('[SupabaseClient] ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is MISSING or undefined.');
  } else {
    // Avoid logging the full key, just confirm its presence or first few chars
    console.log('[SupabaseClient] NEXT_PUBLIC_SUPABASE_ANON_KEY: Loaded (starts with ****)');
  }
  console.log('-------------------------------------------------------------');
}


if (!supabaseUrl) {
  // This error will halt the application if thrown on the server during module load.
  throw new Error("CRITICAL: Missing env.NEXT_PUBLIC_SUPABASE_URL. Check .env.local and ensure the server was restarted.");
}
if (!supabaseAnonKey) {
  throw new Error("CRITICAL: Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local and ensure the server was restarted.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

if (typeof window === 'undefined') {
    console.log('[SupabaseClient] Supabase client instance successfully created on the server.');
}
