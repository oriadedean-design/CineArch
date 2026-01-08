import { createClient } from '@supabase/supabase-js';

/**
 * CINEARCH DATABASE CONNECTION
 * Accesses environment variables via Vite's import.meta.env.
 * This ensures the frontend connects securely to the Supabase backend in production.
 */

// Use type assertion to bypass TypeScript limitations on import.meta in some environments
const env = (import.meta as any).env;

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Validation for production environment configuration
  console.error('CineArch Security Warning: Missing Supabase Environment Variables! Check Vercel Environment Settings.');
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);