-- ============================================================
-- ACCOUNT DELETION
-- A signed-in user can permanently delete their own account:
-- the login (auth.users) and, by cascade, their profile, jobs,
-- union tracking, documents, finance records, sessions and the
-- invites their agency sent. Invites addressed to them are
-- removed too. Required by App Store Guideline 5.1.1(v), and the
-- same call is used by the website.
--
-- Files in Storage are removed by the client first (the delete
-- policies already allow a user to remove their own folder);
-- Storage rows can't be deleted from SQL.
-- ============================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is not null then
    delete from public.agency_invites where email = v_email;
  end if;

  -- Cascades to profiles and everything that references them.
  delete from auth.users where id = v_uid;
end;
$$;

comment on function public.delete_my_account() is
  'Permanently deletes the calling user''s account and all their data. Cannot be undone.';

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
