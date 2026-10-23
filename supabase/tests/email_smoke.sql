-- ============================================================
-- EMAIL LIFECYCLE SMOKE TEST
-- Who is due which onboarding email, when; opted-out, unconfirmed and older
-- accounts get none; contacts re-sync only when their details change; clients
-- can't touch any of it; a deleted account's Resend contact is queued for removal.
-- Ends by raising an exception so the test data is rolled back.
--   PASS → error message starts with EMAIL_TESTS_PASSED
--
-- Run: supabase db query --linked -f supabase/tests/email_smoke.sql
-- ============================================================

do $$
declare
  v_new    uuid := gen_random_uuid();   -- signed up 30 h ago, scene not set
  v_member uuid := gen_random_uuid();   -- signed up 30 h ago, set the scene 25 h ago, member
  v_quiet  uuid := gen_random_uuid();   -- opted out of tips
  v_old    uuid := gen_random_uuid();   -- signed up before onboarding emails started
  v_unconf uuid := gen_random_uuid();   -- email not confirmed
  v_stale  uuid := gen_random_uuid();   -- signed up 8 days ago, scene never set
  v_now    timestamptz := now();
  v_checks int := 0;
  kinds    text[];
begin
  update public.email_settings set lifecycle_starts_at = v_now - interval '10 days';

  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at) values
    (v_new,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'new.email@cinearch.test',    '{"full_name":"Nia New"}',      v_now, v_now - interval '30 hours', v_now),
    (v_member, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member.email@cinearch.test', '{"full_name":"Mo Member"}',    v_now, v_now - interval '30 hours', v_now),
    (v_quiet,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'quiet.email@cinearch.test',  '{"full_name":"Quinn Quiet"}',  v_now, v_now - interval '30 hours', v_now),
    (v_old,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'old.email@cinearch.test',    '{"full_name":"Ola Old"}',      v_now, v_now - interval '30 days',  v_now),
    (v_unconf, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'unconf.email@cinearch.test', '{"full_name":"Una Unconf"}',   null,  v_now - interval '30 hours', v_now),
    (v_stale,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'stale.email@cinearch.test',  '{"full_name":"Sol Stale"}',    v_now, v_now - interval '8 days',   v_now);
  update public.profiles set is_onboarded = true, member_status = 'MEMBER', province = 'Ontario' where id = v_member;
  update public.profiles set onboarded_at = v_now - interval '25 hours' where id = v_member;
  update public.profiles set email_tips = false where id = v_quiet;

  -- Onboarding stamps its time.
  if (select onboarded_at from public.profiles where id = v_member) is null then raise exception 'FAIL: onboarded_at not set'; end if;
  v_checks := v_checks + 1;

  -- First pass: everyone confirmed and new gets a welcome; the member is also due first_week.
  select array_agg(kind order by kind) into kinds from public.email_due(v_now) where user_id = v_new;
  if kinds is distinct from array['welcome'] then raise exception 'FAIL: new account should only be due welcome (got %)', kinds; end if;
  select array_agg(kind order by kind) into kinds from public.email_due(v_now) where user_id = v_member;
  if kinds is distinct from array['first_week', 'welcome'] then raise exception 'FAIL: member should be due welcome and first_week (got %)', kinds; end if;
  if exists (select 1 from public.email_due(v_now) where user_id in (v_quiet, v_old, v_unconf)) then
    raise exception 'FAIL: opted-out, older or unconfirmed accounts were due an email';
  end if;
  if (select member_status from public.email_due(v_now) where user_id = v_member limit 1) <> 'MEMBER' then raise exception 'FAIL: member status not passed for the first-week copy'; end if;
  v_checks := v_checks + 4;

  -- After the welcome: the reminder follows for scene-not-set, but not after 7 days.
  perform public.email_sent(v_new, 'welcome', 'test');
  perform public.email_sent(v_stale, 'welcome', 'test');
  perform public.email_sent(v_member, 'welcome', 'test');
  perform public.email_sent(v_member, 'first_week', 'test');
  if not exists (select 1 from public.email_due(v_now) where user_id = v_new and kind = 'scene_reminder') then raise exception 'FAIL: scene reminder not due at 30 h'; end if;
  if exists (select 1 from public.email_due(v_now - interval '10 hours') where user_id = v_new and kind = 'scene_reminder') then raise exception 'FAIL: scene reminder due before 24 h'; end if;
  if exists (select 1 from public.email_due(v_now) where user_id = v_stale) then raise exception 'FAIL: reminder sent to an 8-day-old account'; end if;
  if exists (select 1 from public.email_due(v_now) where user_id = v_member) then raise exception 'FAIL: member still due something after both were sent'; end if;
  v_checks := v_checks + 4;

  -- Sent once only.
  perform public.email_sent(v_new, 'welcome', 'again');
  if (select count(*) from public.email_log where user_id = v_new and kind = 'welcome') <> 1 then raise exception 'FAIL: a second welcome was logged'; end if;
  v_checks := v_checks + 1;

  -- Going Pro stamps pro_since and makes the Pro welcome due.
  update public.profiles set is_premium = true where id = v_new;
  if not exists (select 1 from public.email_due(v_now) where user_id = v_new and kind = 'pro_welcome') then raise exception 'FAIL: pro welcome not due after going Pro'; end if;
  v_checks := v_checks + 1;

  -- Contacts: due until synced, then again only when something changes.
  if not exists (select 1 from public.email_contacts_due() where user_id = v_member) then raise exception 'FAIL: new contact not due for sync'; end if;
  perform public.email_contact_synced(d.user_id, d.props_hash) from public.email_contacts_due() d where d.user_id = v_member;
  if exists (select 1 from public.email_contacts_due() where user_id = v_member) then raise exception 'FAIL: synced contact still due'; end if;
  update public.profiles set province = 'British Columbia' where id = v_member;
  if (select props->>'province' from public.email_contacts_due() where user_id = v_member) <> 'British Columbia' then raise exception 'FAIL: changed province not re-synced'; end if;
  if (select unsubscribed from public.email_contacts_due() where user_id = v_quiet) is not true then raise exception 'FAIL: opted-out contact not marked unsubscribed'; end if;
  if exists (select 1 from public.email_contacts_due() where user_id = v_unconf) then raise exception 'FAIL: unconfirmed email sent to Resend'; end if;
  v_checks := v_checks + 5;

  -- Deleting an account queues its Resend contact for removal.
  delete from auth.users where id = v_member;
  if not exists (select 1 from public.email_forget where email = 'member.email@cinearch.test') then raise exception 'FAIL: deleted account not queued for removal from Resend'; end if;
  v_checks := v_checks + 1;

  -- Clients can't see or run any of it.
  perform set_config('request.jwt.claims', json_build_object('sub', v_new, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.email_due();
    raise exception 'FAIL: a signed-in user ran email_due';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;
  begin
    perform 1 from public.email_log;
    raise exception 'FAIL: a signed-in user read the email log';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;
  begin
    perform public.email_unsubscribe(v_quiet);
    raise exception 'FAIL: a signed-in user unsubscribed someone else';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;
  -- But they can turn their own tips off.
  update public.profiles set email_tips = false where id = v_new;
  execute 'reset role';
  if (select email_tips from public.profiles where id = v_new) then raise exception 'FAIL: a user could not turn their own tips off'; end if;
  v_checks := v_checks + 1;

  raise exception 'EMAIL_TESTS_PASSED: % checks (all test data rolled back)', v_checks;
end $$;
