-- ============================================================
-- RPC: register_user_session
-- Called client-side after login to record the session.
-- Security definer so it can write to user_sessions without
-- exposing an insert policy to the authenticated role.
-- ============================================================

create or replace function public.register_user_session(
  p_session_token text,
  p_device_label  text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_sessions (user_id, session_token, device_label, ip_address)
  values (
    auth.uid(),
    p_session_token,
    p_device_label,
    null  -- IP available via Supabase Edge Functions if needed later
  )
  on conflict (session_token) do update
    set last_active = now(),
        device_label = excluded.device_label;
end;
$$;

-- Only authenticated users can call this
revoke all on function public.register_user_session from anon;
grant execute on function public.register_user_session to authenticated;
