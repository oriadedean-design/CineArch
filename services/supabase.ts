import { createClient } from '@supabase/supabase-js';

/**
 * CINEARCH DATABASE CONNECTION
 * Robust environment variable resolver for CineArch.
 * Detects variables across standard Vite and Node/Vercel process environments.
 */

const getCineEnv = (key: string): string | undefined => {
  // Check Vite's import.meta.env first
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (e) {
    // import.meta.env not available in this context
  }

  // Fallback to process.env (Node/Vercel standard)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // process.env not available in this context
  }

  return undefined;
};

const supabaseUrl = getCineEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getCineEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  // Detailed diagnostic for the production logs
  console.warn(
    'CineArch Configuration Warning: Missing Supabase Credentials.\n' +
    'Targeting: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.\n' +
    'System will use placeholder credentials to prevent build-time crashes.'
  );
}

/**
 * Initialize Supabase Client
 * Uses placeholders if environment variables are missing to avoid "supabaseUrl is required" error.
 * Actual functionality requires valid environment variables to be set in the host (Vercel).
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-instance.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
