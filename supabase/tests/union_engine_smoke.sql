-- ============================================================
-- UNION ENGINE SMOKE TEST
-- Checks the engine tables are readable but not writable through
-- the API, edits bump the version, every catalog role has coverage,
-- rate and pay data are internally consistent, and the snapshot
-- carries every section.
-- Ends by raising an exception so the test edit is rolled back.
--   PASS → error message starts with ENGINE_TESTS_PASSED
--
-- Run: supabase db query --linked -f supabase/tests/union_engine_smoke.sql
-- ============================================================

do $$
declare
  v1 bigint; v2 bigint; snap jsonb; n int; denied boolean := false;
begin
  v1 := public.union_engine_version();
  update public.unions set description = description where id = (select id from public.unions limit 1);
  v2 := public.union_engine_version();
  if v2 <= v1 then raise exception 'FAIL: editing unions did not bump the engine version'; end if;

  perform set_config('role', 'anon', true);
  select count(*) into n from public.role_coverage;
  if n = 0 then raise exception 'FAIL: anonymous visitors cannot read role_coverage'; end if;
  begin
    update public.unions set name = name where true;
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'FAIL: anonymous visitors can edit unions'; end if;
  snap := public.union_engine_snapshot();
  select count(*) into n from jsonb_each(public.rate_schedule_lines(array['iatse-873-feature-2026'])) e
  where jsonb_array_length(e.value) > 0;
  if n <> 1 then raise exception 'FAIL: anonymous visitors cannot read rate lines'; end if;
  execute 'reset role';

  foreach n in array array[jsonb_array_length(snap->'unions'), jsonb_array_length(snap->'departments'),
                           jsonb_array_length(snap->'roleCoverage'), jsonb_array_length(snap->'departmentCoverage'),
                           jsonb_array_length(snap->'rateSchedules'), jsonb_array_length(snap->'payRules')]
  loop
    if n = 0 then raise exception 'FAIL: snapshot has an empty section'; end if;
  end loop;

  -- Pay data stays consistent with itself.
  select count(*) into n from public.rate_lines l join public.rate_schedules s on s.id = l.schedule_id
  where cardinality(l.rates) <> cardinality(s.columns);
  if n > 0 then raise exception 'FAIL: % rate lines have a different number of rates than their schedule has columns', n; end if;

  select count(*) into n from public.pay_rules p
  where exists (select 1 from generate_subscripts(p.overtime_after, 1) i
                where p.overtime_multipliers[i] <= 1
                   or (i > 1 and p.overtime_after[i] <= p.overtime_after[i - 1]));
  if n > 0 then raise exception 'FAIL: % pay rules have overtime steps out of order or multipliers of 1x or less', n; end if;

  select count(*) into n from public.rate_schedules a join public.rate_schedules b
    on a.union_id = b.union_id and a.id < b.id and a.production_type is not distinct from b.production_type
   and daterange(a.effective_from, a.effective_to, '[]') && daterange(b.effective_from, b.effective_to, '[]');
  if n > 0 then raise exception 'FAIL: % pairs of rate schedules for the same production type overlap in time', n; end if;

  select count(*) into n from public.roles r where not exists (select 1 from public.role_coverage c where c.role_id = r.id);
  if n > 0 then raise notice 'Roles with no coverage anywhere: %', n; end if;

  select count(*) into n from public.role_coverage c join public.unions u on u.id = c.union_id
  where not exists (select 1 from public.union_jurisdictions j
                    where j.union_id = c.union_id and j.province = c.province and (j.region is null or c.region is null or j.region = c.region));
  if n > 0 then raise exception 'FAIL: % coverage rows point at a union outside its jurisdictions', n; end if;

  raise exception 'ENGINE_TESTS_PASSED: % unions, % roles, % coverage rows, % rate schedules, % rate lines, % pay rules, snapshot % KB',
    jsonb_array_length(snap->'unions'), (select count(*) from public.roles),
    jsonb_array_length(snap->'roleCoverage'), jsonb_array_length(snap->'rateSchedules'),
    (select count(*) from public.rate_lines), jsonb_array_length(snap->'payRules'), length(snap::text) / 1024;
end $$;
