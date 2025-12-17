
import { createClient } from '@supabase/supabase-js';

// Access environment variables with type assertion to resolve TypeScript errors
// Use a fallback empty object to prevent crashes if import.meta.env is undefined in the current environment
const env = (import.meta as any).env || {};

// Fallback to provided credentials if environment variables are missing
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://bkgrlrcthesyfjxwcdtd.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZ3JscmN0aGVzeWZqeHdjZHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDkzMTYsImV4cCI6MjA4MTQ4NTMxNn0.owvKLNXEUO1Ocyq5G5fRyGdQcAfAPkYozw0c32wEj5o';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase Environment Variables.');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
);
