import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so the user stays logged in across tabs/refreshes
    persistSession: true,
    // Auto-refresh the JWT before it expires
    autoRefreshToken: true,
    // Detect session from URL hash (needed for OAuth redirects and magic links)
    detectSessionInUrl: true,
    // Storage key scoped to this app
    storageKey: 'cinearch-auth',
  },
  // Realtime: only subscribe to channels the user explicitly joins
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  // Global request headers
  global: {
    headers: { 'x-app-version': '0.5.1' },
  },
});

export type SupabaseClient = typeof supabase;
