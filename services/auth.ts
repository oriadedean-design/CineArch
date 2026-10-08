import { supabase } from './supabase';

// ── Session Cap ─────────────────────────────────────────────
// Each device's Supabase session is recorded in user_sessions via the
// register_user_session RPC. The database trigger keeps the newest 3
// rows per user; a device whose row was evicted signs itself out the
// next time verifySession() runs (app start / sign-in).
//
// Rows are keyed by a hash of the JWT `session_id` claim, which stays
// stable across hourly token refreshes (the access token itself doesn't).

const sessionKey = async (accessToken: string): Promise<string | null> => {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.session_id) return null;
    return sha256(payload.session_id);
  } catch {
    return null;
  }
};

export async function registerSession(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const key = await sessionKey(session.access_token);
  if (!key) return;

  const { error } = await supabase.rpc('register_user_session', {
    p_session_token: key,
    p_device_label: getDeviceLabel(),
  });
  if (error) console.error('Session registration failed:', error);
}

// Returns false (and signs out) if this device was evicted by the cap.
export async function verifySession(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const key = await sessionKey(session.access_token);
  if (!key) return true;

  const { data, error } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('session_token', key)
    .maybeSingle();

  // Don't sign people out because of a network blip.
  if (error) return true;

  if (!data) {
    // Never registered (e.g. signed in before this feature, or via OAuth) → register now.
    // Registered but missing → evicted by a newer login elsewhere.
    const evicted = localStorage.getItem('cinearch_session_registered') === key;
    if (evicted) {
      localStorage.removeItem('cinearch_session_registered');
      await supabase.auth.signOut({ scope: 'local' });
      return false;
    }
    await registerSession();
  }
  localStorage.setItem('cinearch_session_registered', key);
  return true;
}

// Remove this device's row before signing out.
export async function clearSession(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const key = await sessionKey(session.access_token);
  if (key) await supabase.from('user_sessions').delete().eq('session_token', key);
  localStorage.removeItem('cinearch_session_registered');
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
  const browser = ua.includes('Edg/') ? 'Edge'
    : ua.includes('Chrome') ? 'Chrome'
    : ua.includes('Firefox') ? 'Firefox'
    : ua.includes('Safari') ? 'Safari'
    : 'Browser';
  const os = ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
    : ua.includes('Android') ? 'Android'
    : ua.includes('Mac') ? 'macOS'
    : ua.includes('Win') ? 'Windows'
    : ua.includes('Linux') ? 'Linux'
    : 'Unknown OS';
  return `${browser} on ${os}`;
}

async function sha256(value: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
