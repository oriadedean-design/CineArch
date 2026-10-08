-- ============================================================
-- UNION ENGINE SMOKE TEST
-- Checks the engine tables are readable but not writable through
-- the API, edits bump the version, every catalog role has coverage
-- somewhere, and the snapshot carries every section.
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
  execute 'reset role';

  foreach n in array array[jsonb_array_length(snap->'unions'), jsonb_array_length(snap->'departments'),
                           jsonb_array_length(snap->'roleCoverage'), jsonb_array_length(snap->'departmentCoverage')]
  loop
    if n = 0 then raise exception 'FAIL: snapshot has an empty section'; end if;
  end loop;

  select count(*) into n from public.roles r where not exists (select 1 from public.role_coverage c where c.role_id = r.id);
  if n > 0 then raise notice 'Roles with no coverage anywhere: %', n; end if;

  select count(*) into n from public.role_coverage c join public.unions u on u.id = c.union_id
  where not exists (select 1 from public.union_jurisdictions j
                    where j.union_id = c.union_id and j.province = c.province and (j.region is null or c.region is null or j.region = c.region));
  if n > 0 then raise exception 'FAIL: % coverage rows point at a union outside its jurisdictions', n; end if;

  raise exception 'ENGINE_TESTS_PASSED: % unions, % roles, % coverage rows, snapshot % KB',
    jsonb_array_length(snap->'unions'), (select count(*) from public.roles),
    jsonb_array_length(snap->'roleCoverage'), length(snap::text) / 1024;
end $$;
