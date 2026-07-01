import { supabase } from './supabase';

export type SocialProvider = 'google' | 'apple' | 'github';

// Redirect URL must match what's registered in Supabase Auth dashboard
const REDIRECT_URL = `${window.location.origin}/#/auth/callback`;

// ── Email / Password ────────────────────────────────────────

export async function signUpWithEmail(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: REDIRECT_URL,
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await registerSession();
  return data;
}

// ── Social Login ────────────────────────────────────────────

export async function signInWithSocial(provider: SocialProvider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: REDIRECT_URL,
      // Request minimal scopes
      scopes: provider === 'google' ? 'openid email profile' : undefined,
    },
  });
  if (error) throw error;
  return data;
}

// ── Session Registration (Cap Enforcement) ──────────────────
// Called after every successful sign-in. The database trigger
// automatically evicts the oldest session when cap (3) is exceeded.

export async function registerSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const deviceLabel = getDeviceLabel();

  // We store a hash of the access token as the session token
  const tokenHash = await hashToken(session.access_token);

  // Service role is not available client-side, so we use a Supabase
  // RPC function (security definer) to insert into user_sessions.
  await supabase.rpc('register_user_session', {
    p_session_token: tokenHash,
    p_device_label: deviceLabel,
  });
}

export async function signOut() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const tokenHash = await hashToken(session.access_token);
    // Remove this session from the cap table
    await supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', tokenHash);
  }
  await supabase.auth.signOut();
}

export async function getActiveSessions() {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function revokeSession(sessionId: string) {
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('id', sessionId);
  if (error) throw error;
}

// ── Helpers ─────────────────────────────────────────────────

function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  const browser = ua.includes('Chrome') ? 'Chrome'
    : ua.includes('Firefox') ? 'Firefox'
    : ua.includes('Safari') ? 'Safari'
    : ua.includes('Edge') ? 'Edge'
    : 'Browser';
  const os = ua.includes('Mac') ? 'macOS'
    : ua.includes('Win') ? 'Windows'
    : ua.includes('Linux') ? 'Linux'
    : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
    : ua.includes('Android') ? 'Android'
    : 'Unknown OS';
  return `${browser} on ${os}`;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token.slice(-64)); // hash last 64 chars (unique per session)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
