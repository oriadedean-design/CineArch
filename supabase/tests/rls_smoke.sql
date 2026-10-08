-- ============================================================
-- CINEARCH DATABASE SMOKE TEST
-- Exercises signup, RLS, column locks, agency invites, finance
-- totals and the session cap as real "authenticated" users.
--
-- Everything runs in one DO block that ends by raising an
-- exception, so every row it creates is rolled back.
--   PASS → error message starts with CINEARCH_TESTS_PASSED
--   FAIL → error message starts with FAIL:
--
-- Run: supabase db query --linked -f supabase/tests/rls_smoke.sql
-- ============================================================

do $$
declare
  v_agent uuid := gen_random_uuid();
  v_bob   uuid := gen_random_uuid();
  v_cara  uuid := gen_random_uuid();
  v_job   uuid;
  v_invite uuid;
  v_n     int;
  v_txt   text;
  v_num   numeric;
  v_checks int := 0;
begin
  -- ── Setup: three users via the real signup trigger ──────────
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values
    (v_agent, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent.smoke@cinearch.test', '{"full_name":"Agent Smoke","account_type":"AGENT"}', now(), now()),
    (v_bob,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bob.smoke@cinearch.test',   '{"full_name":"Bob Smoke"}', now(), now()),
    (v_cara,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cara.smoke@cinearch.test',  '{"full_name":"Cara Smoke"}', now(), now());

  select account_type into v_txt from public.profiles where id = v_agent;
  if v_txt is distinct from 'AGENT' then raise exception 'FAIL: signup trigger did not store account_type AGENT (got %)', v_txt; end if;
  select account_type into v_txt from public.profiles where id = v_bob;
  if v_txt is distinct from 'INDIVIDUAL' then raise exception 'FAIL: signup trigger default account_type (got %)', v_txt; end if;
  v_checks := v_checks + 2;

  -- ── As Bob ──────────────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', v_bob, 'email', 'bob.smoke@cinearch.test', 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  update public.profiles set name = 'Bob S', province = 'Ontario', is_onboarded = true where id = v_bob;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'FAIL: user could not update own allowed profile columns'; end if;
  v_checks := v_checks + 1;

  begin
    update public.profiles set is_premium = true where id = v_bob;
    raise exception 'FAIL: user was able to set is_premium on themselves';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;

  begin
    update public.profiles set plan = 'agency' where id = v_bob;
    raise exception 'FAIL: user was able to change plan';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;

  begin
    update public.profiles set account_type = 'AGENT' where id = v_bob;
    raise exception 'FAIL: user was able to change account_type';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;

  begin
    update public.profiles set managed_by_agency_id = v_agent where id = v_bob;
    raise exception 'FAIL: user was able to link themselves to an agency directly';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;

  -- Job with only the fields the app's form sends (no company_name)
  insert into public.jobs (user_id, production_name, role, start_date, total_hours, gross_earnings, client_id)
  values (v_bob, 'Smoke Feature', 'Camera Trainee', current_date, 12, 900, 'device-1')
  returning id into v_job;
  v_checks := v_checks + 1;

  begin
    insert into public.jobs (user_id, production_name, role, start_date) values (v_cara, 'Forged', 'Grip', current_date);
    raise exception 'FAIL: user inserted a job owned by someone else';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;

  insert into public.finance_transactions (user_id, type, date_incurred, description, category, amount_before_tax, tax_amount, total_amount, deductible_amount)
  values
    (v_bob, 'INCOME',  current_date, 'Smoke pay', 'Wages', 1000, 50, 1050, null),
    (v_bob, 'EXPENSE', current_date, 'Lunch',     'MEALS', 100,  5,  105,  50),
    (v_bob, 'INCOME',  (current_date - interval '1 year')::date, 'Last year', 'Wages', 5000, 250, 5250, null);

  select gross_income into v_num from public.finance_stats(v_bob);
  if v_num <> 1000 then raise exception 'FAIL: finance_stats should only count this year (got %)', v_num; end if;
  select deductible_expenses into v_num from public.finance_stats(v_bob);
  if v_num <> 50 then raise exception 'FAIL: finance_stats deductible expenses (got %)', v_num; end if;
  select gross_income into v_num from public.finance_stats(v_bob, extract(year from current_date)::int - 1);
  if v_num <> 5000 then raise exception 'FAIL: finance_stats for last year (got %)', v_num; end if;
  v_checks := v_checks + 3;

  -- Session cap: 4 devices → 3 kept. (Which one is evicted can't be checked
  -- here: created_at = now() is identical for every row in one transaction.)
  perform public.register_user_session('s1', 'A');
  perform public.register_user_session('s2', 'B');
  perform public.register_user_session('s3', 'C');
  perform public.register_user_session('s4', 'D');
  select count(*) into v_n from public.user_sessions;
  if v_n <> 3 then raise exception 'FAIL: session cap kept % sessions, expected 3', v_n; end if;
  v_checks := v_checks + 1;

  execute 'reset role';

  -- ── As Cara: isolation ──────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', v_cara, 'email', 'cara.smoke@cinearch.test', 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into v_n from public.jobs;
  if v_n <> 0 then raise exception 'FAIL: Cara can see % jobs belonging to others', v_n; end if;
  select count(*) into v_n from public.finance_transactions;
  if v_n <> 0 then raise exception 'FAIL: Cara can see others finance rows'; end if;
  select count(*) into v_n from public.profiles;
  if v_n <> 1 then raise exception 'FAIL: Cara can see % profiles (expected only her own)', v_n; end if;
  v_checks := v_checks + 3;

  -- Same device-generated client_id as Bob is fine (unique per user)
  insert into public.jobs (user_id, production_name, role, start_date, client_id)
  values (v_cara, 'Cara Short', 'Grip', current_date, 'device-1');
  v_checks := v_checks + 1;

  -- Non-agents can't send agency invites
  begin
    insert into public.agency_invites (agency_id, email) values (v_cara, 'bob.smoke@cinearch.test');
    raise exception 'FAIL: an individual was able to create an agency invite';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;

  execute 'reset role';

  -- ── As Agent: before link ───────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', v_agent, 'email', 'agent.smoke@cinearch.test', 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into v_n from public.jobs where user_id = v_bob;
  if v_n <> 0 then raise exception 'FAIL: agent sees Bob jobs before Bob accepted'; end if;
  v_checks := v_checks + 1;

  insert into public.agency_invites (agency_id, email, name) values (v_agent, 'bob.smoke@cinearch.test', 'Bob')
  returning id into v_invite;
  v_checks := v_checks + 1;

  execute 'reset role';

  -- ── As Cara: can't see or accept Bob's invite ───────────────
  perform set_config('request.jwt.claims', json_build_object('sub', v_cara, 'email', 'cara.smoke@cinearch.test', 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into v_n from public.my_pending_invites();
  if v_n <> 0 then raise exception 'FAIL: Cara sees an invite addressed to Bob'; end if;
  begin
    perform public.respond_to_agency_invite(v_invite, true);
    raise exception 'FAIL: Cara accepted an invite addressed to Bob';
  exception when no_data_found then v_checks := v_checks + 2;
  end;

  execute 'reset role';

  -- ── As Bob: accept ──────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', v_bob, 'email', 'bob.smoke@cinearch.test', 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select agency_name into v_txt from public.my_pending_invites();
  if v_txt is null then raise exception 'FAIL: Bob does not see his pending invite with agency name'; end if;
  perform public.respond_to_agency_invite(v_invite, true);
  select name into v_txt from public.my_agency();
  if v_txt is distinct from 'Agent Smoke' then raise exception 'FAIL: my_agency() after accept (got %)', v_txt; end if;
  v_checks := v_checks + 3;

  execute 'reset role';

  -- ── As Agent: after link ────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', v_agent, 'email', 'agent.smoke@cinearch.test', 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into v_n from public.profiles where managed_by_agency_id = v_agent;
  if v_n <> 1 then raise exception 'FAIL: agent roster shows % clients, expected 1', v_n; end if;
  select count(*) into v_n from public.jobs where user_id = v_bob;
  if v_n <> 1 then raise exception 'FAIL: agent cannot read linked client jobs'; end if;
  v_checks := v_checks + 2;

  insert into public.jobs (user_id, production_name, role, start_date) values (v_bob, 'Agent Booked', 'Camera Trainee', current_date);
  insert into public.union_tracking (user_id, union_type_id, union_name, tier_label, target_type, target_value)
  values (v_bob, 'u-667', 'IATSE 667', 'Trainee', 'DAYS', 60);
  v_checks := v_checks + 2;

  select count(*) into v_n from public.finance_transactions where user_id = v_bob;
  if v_n <> 0 then raise exception 'FAIL: agent can see client finances'; end if;
  select count(*) into v_n from public.residency_documents where user_id = v_bob;
  if v_n <> 0 then raise exception 'FAIL: agent can see client documents'; end if;
  v_checks := v_checks + 2;

  update public.profiles set name = 'Hijacked' where id = v_bob;
  get diagnostics v_n = row_count;
  if v_n <> 0 then raise exception 'FAIL: agent edited a client profile'; end if;
  v_checks := v_checks + 1;

  select count(*) into v_n from public.jobs where user_id = v_cara;
  if v_n <> 0 then raise exception 'FAIL: agent sees jobs of a non-client'; end if;
  v_checks := v_checks + 1;

  perform public.release_client(v_bob);
  select count(*) into v_n from public.jobs where user_id = v_bob;
  if v_n <> 0 then raise exception 'FAIL: agent still sees jobs after releasing client'; end if;
  v_checks := v_checks + 1;

  execute 'reset role';

  -- ── Anonymous: sees nothing ─────────────────────────────────
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
  select count(*) into v_n from public.jobs;
  if v_n <> 0 then raise exception 'FAIL: anonymous visitor can read jobs'; end if;
  select count(*) into v_n from public.profiles;
  if v_n <> 0 then raise exception 'FAIL: anonymous visitor can read profiles'; end if;
  v_checks := v_checks + 2;
  execute 'reset role';

  raise exception 'CINEARCH_TESTS_PASSED: % checks (all test data rolled back)', v_checks;
end;
$$;
