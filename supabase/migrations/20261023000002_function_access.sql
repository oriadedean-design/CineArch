-- From Supabase's security advisor: signed-out visitors (anon) could call
-- these SECURITY DEFINER functions through /rest/v1/rpc. Trigger functions
-- are never meant to be called directly; the rest are for signed-in users
-- only (signed-out visitors have nothing to read in the tables whose rules
-- use them, the same as has_pro() today).
revoke execute on function public.bump_union_engine_version()       from public, anon, authenticated;
revoke execute on function public.enforce_session_cap()             from public, anon, authenticated;
revoke execute on function public.handle_new_user()                 from public, anon, authenticated;
revoke execute on function public.profile_agent_to_representative() from public, anon, authenticated;

revoke execute on function public.is_admin()                            from public, anon;
revoke execute on function public.is_agent()                            from public, anon;
revoke execute on function public.is_agent_of(uuid)                     from public, anon;
revoke execute on function public.register_user_session(text, text)     from public, anon;
grant  execute on function public.is_admin()                            to authenticated;
grant  execute on function public.is_agent()                            to authenticated;
grant  execute on function public.is_agent_of(uuid)                     to authenticated;
grant  execute on function public.register_user_session(text, text)     to authenticated;

-- Rules that depend on who is signed in now apply to signed-in users only
-- (Supabase recommends naming the role). Signed-out visitors never run them,
-- so they see nothing, as before, instead of a permission error from the
-- functions above. Storage rules are owned by Supabase and left as they are.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
     where schemaname = 'public' and roles = '{public}'
       and coalesce(qual, '') || coalesce(with_check, '') ~ '(is_admin|is_agent|is_agent_of|has_pro|auth\.uid)\('
  loop
    execute format('alter policy %I on %I.%I to authenticated', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;
