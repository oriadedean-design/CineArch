
import { createClient } from '@supabase/supabase-js';

// Robust environment variable access
// 1. Try import.meta.env (Vite/Modern bundlers)
// 2. Fallback to empty object to safely check properties
let env: any = {};
try {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    env = (import.meta as any).env;
  }
} catch (e) {
  // Ignore errors if import.meta access fails in non-module environments
  console.warn('Could not access import.meta.env');
}

// Hardcoded Fallbacks (Public Anon Key is safe to expose in client-side apps)
const FALLBACK_URL = 'https://bkgrlrcthesyfjxwcdtd.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZ3JscmN0aGVzeWZqeHdjZHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDkzMTYsImV4cCI6MjA4MTQ4NTMxNn0.owvKLNXEUO1Ocyq5G5fRyGdQcAfAPkYozw0c32wEj5o';

// Use Env Var if present, otherwise fallback
const supabaseUrl = env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Critical: Supabase credentials missing.');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
);
