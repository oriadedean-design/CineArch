import { supabase } from './supabase';
import { setEngineSnapshot, setRateLineLoader, type EngineSnapshot, type RateLine } from './union_engine';

// The app's connection between the engine (services/engine.ts) and Supabase.
// Loads the union engine snapshot. It is cached in
// localStorage and only re-downloaded when union_engine_version() changes,
// so a normal app start costs one tiny request.

// v2: snapshot carries pay rules; rate lines load separately.
const CACHE_KEY = 'cinearch_union_engine_v2';

const readCache = (): EngineSnapshot | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) as EngineSnapshot : null;
  } catch {
    return null;
  }
};

const writeCache = (snapshot: EngineSnapshot) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage full or blocked: the engine still works for this session.
  }
};

async function refresh(cached: EngineSnapshot | null): Promise<void> {
  const { data: version, error } = await supabase.rpc('union_engine_version');
  if (error) throw error;
  if (cached && cached.version === version) return;

  const { data, error: snapError } = await supabase.rpc('union_engine_snapshot');
  if (snapError) throw snapError;
  const snapshot = data as unknown as EngineSnapshot;
  setEngineSnapshot(snapshot);
  writeCache(snapshot);
}

// Resolves once the engine has data. With a cached copy that's immediate and
// the version check runs in the background (changes apply on next start).
export async function loadUnionEngine(): Promise<void> {
  const cached = readCache();
  if (cached) {
    setEngineSnapshot(cached);
    refresh(cached).catch(err => console.error('Union engine refresh failed:', err));
    return;
  }
  try {
    await refresh(null);
  } catch (err) {
    console.error('Union engine failed to load:', err);
  }
}

// Rate lines come from rate_schedule_lines() when a job needs them.
setRateLineLoader(async (scheduleIds) => {
  const { data, error } = await supabase.rpc('rate_schedule_lines', { p_schedule_ids: scheduleIds });
  if (error) throw error;
  return data as unknown as Record<string, RateLine[]>;
});
