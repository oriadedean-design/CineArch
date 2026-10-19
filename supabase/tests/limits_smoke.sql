-- ============================================================
-- LIMITS SMOKE TEST
-- A-List Pro makes at most 3 PDF reports a month; free accounts make none;
-- only admins can verify facts or set themselves as admin; amounts outside
-- sane ranges are refused.
-- Ends by raising an exception so the test data is rolled back.
--   PASS → error message starts with LIMITS_TESTS_PASSED
--
-- Run: supabase db query --linked -f supabase/tests/limits_smoke.sql
-- ============================================================

do $$
declare
  v_pro  uuid := gen_random_uuid();
  v_free uuid := gen_random_uuid();
  v_left int;
  v_checks int := 0;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
    (v_pro,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pro.limits@cinearch.test', '{"full_name":"Pro Limits"}', now(), now()),
    (v_free, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'free.limits@cinearch.test', '{"full_name":"Free Limits"}', now(), now());
  update public.profiles set is_premium = true where id = v_pro;

  -- Pro: three reports, then refused.
  perform set_config('request.jwt.claims', json_build_object('sub', v_pro, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  v_left := public.start_report('tax');   if v_left <> 2 then raise exception 'FAIL: first report should leave 2 (got %)', v_left; end if;
  v_left := public.start_report('union'); if v_left <> 1 then raise exception 'FAIL: second report should leave 1'; end if;
  v_left := public.start_report('overview'); if v_left <> 0 then raise exception 'FAIL: third report should leave 0'; end if;
  begin
    perform public.start_report('tax');
    raise exception 'FAIL: a fourth report this month was allowed';
  exception when raise_exception then
    if sqlerrm not like 'REPORT_LIMIT%' then raise; end if;
    v_checks := v_checks + 1;
  end;
  if (select used from public.my_report_usage()) <> 3 then raise exception 'FAIL: usage should read 3'; end if;
  v_checks := v_checks + 4;

  begin
    insert into public.report_runs (user_id, kind) values (v_pro, 'tax');
    raise exception 'FAIL: a user could write report_runs directly';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;

  -- Not an admin: can't verify facts or make themselves one.
  begin
    perform public.check_fact('union', 'u-873', 'verified');
    raise exception 'FAIL: a non-admin verified a fact';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;
  begin
    update public.profiles set is_admin = true where id = v_pro;
    raise exception 'FAIL: a user set is_admin on themselves';
  exception when insufficient_privilege then v_checks := v_checks + 1;
  end;

  -- Amounts out of range are refused.
  begin
    insert into public.finance_transactions (user_id, type, category, amount_before_tax, tax_amount, total_amount, description, date_incurred)
    values (v_pro, 'EXPENSE', 'OFFICE_SUPPLIES', 10, 50, 60, 'Too much tax', current_date);
    raise exception 'FAIL: tax larger than the amount was saved';
  exception when check_violation then v_checks := v_checks + 1;
  end;
  begin
    insert into public.finance_transactions (user_id, type, category, amount_before_tax, tax_amount, total_amount, description, date_incurred)
    values (v_pro, 'EXPENSE', 'OFFICE_SUPPLIES', -5, 0, -5, 'Negative', current_date);
    raise exception 'FAIL: a negative amount was saved';
  exception when check_violation then v_checks := v_checks + 1;
  end;

  -- Free: no reports.
  perform set_config('request.jwt.claims', json_build_object('sub', v_free, 'role', 'authenticated')::text, true);
  begin
    perform public.start_report('tax');
    raise exception 'FAIL: a free account made a report';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
    v_checks := v_checks + 1;
  end;

  execute 'reset role';
  raise exception 'LIMITS_TESTS_PASSED: % checks (all test data rolled back)', v_checks;
end $$;
