-- ============================================================
-- ACCOUNT DELETION SMOKE TEST
-- A user deletes their account; their login, profile and data are
-- gone, another user's data is untouched, and an anonymous caller
-- can't use the function. Rolled back at the end.
--   PASS → error message starts with DELETE_ACCOUNT_TESTS_PASSED
-- Run: supabase db query --linked -f supabase/tests/delete_account_smoke.sql
-- ============================================================

do $$
declare
  v_dana uuid := gen_random_uuid();
  v_eli  uuid := gen_random_uuid();
  v_n    int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
    (v_dana, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dana.smoke@cinearch.test', '{"full_name":"Dana Smoke"}', now(), now()),
    (v_eli,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eli.smoke@cinearch.test',  '{"full_name":"Eli Smoke","account_type":"AGENT"}', now(), now());
  insert into public.jobs (user_id, production_name, company_name, role, start_date) values
    (v_dana, 'Dana Show', 'Co', 'Grip', current_date),
    (v_eli,  'Eli Show',  'Co', 'Grip', current_date);
  insert into public.agency_invites (agency_id, email) values (v_eli, 'dana.smoke@cinearch.test');

  -- Anonymous: refused
  perform set_config('role', 'anon', true);
  begin
    perform public.delete_my_account();
    raise exception 'FAIL: anonymous caller ran delete_my_account';
  exception when insufficient_privilege then null;
  end;

  -- Dana deletes her account
  perform set_config('request.jwt.claims', json_build_object('sub', v_dana, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.delete_my_account();
  perform set_config('role', 'postgres', true);

  select count(*) into v_n from auth.users where id = v_dana;
  if v_n <> 0 then raise exception 'FAIL: login still exists after deletion'; end if;
  select count(*) into v_n from public.profiles where id = v_dana;
  if v_n <> 0 then raise exception 'FAIL: profile still exists after deletion'; end if;
  select count(*) into v_n from public.jobs where user_id = v_dana;
  if v_n <> 0 then raise exception 'FAIL: % jobs left after deletion', v_n; end if;
  select count(*) into v_n from public.agency_invites where email = 'dana.smoke@cinearch.test';
  if v_n <> 0 then raise exception 'FAIL: invite to deleted user left behind'; end if;

  -- Eli untouched
  select count(*) into v_n from public.jobs where user_id = v_eli;
  if v_n <> 1 then raise exception 'FAIL: another user''s jobs were affected'; end if;

  raise exception 'DELETE_ACCOUNT_TESTS_PASSED';
end $$;
