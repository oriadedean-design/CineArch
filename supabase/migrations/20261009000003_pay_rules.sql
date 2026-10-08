-- ============================================================
-- PAY RULES
-- How a union day is paid: the minimum call, when overtime starts
-- and at what multiple, and the minimum rate for each position.
-- Part of the union engine: same public-read / dashboard-edit
-- rules, same version bump.
--
-- Jobs gain the fields needed to log work by the hour: days,
-- hours per day, unpaid meal break, overtime hours and the union
-- minimum that applied when the job was logged.
-- ============================================================

-- ── Pay rules ───────────────────────────────────────────────

create table public.pay_rules (
  id                   text primary key check (id ~ '^[a-z0-9-]+$'),
  union_id             text not null references public.unions(id) on update cascade on delete cascade,
  title                text not null,                     -- the agreement, e.g. 'IPA 2025–2027'
  department_id        text references public.departments(id) on update cascade on delete cascade,  -- null = everyone the union covers
  minimum_call_hours   numeric(4,2) check (minimum_call_hours > 0),   -- hours paid even when fewer are worked
  overtime_after       numeric(4,2)[] not null default '{}',          -- hours worked in a day when each overtime rate starts
  overtime_multipliers numeric(4,2)[] not null default '{}',          -- the multiple of the hourly rate from that hour on
  increment_minutes    int check (increment_minutes between 1 and 60), -- worked time is paid in units of this many minutes
  meal_break_notes     text,
  notes                text,
  needs_verification   text[] not null default '{}',
  source_url           text,
  sort_order           int not null default 0,
  updated_at           timestamptz not null default now(),
  check (cardinality(overtime_after) = cardinality(overtime_multipliers)),
  unique nulls not distinct (union_id, department_id)
);

comment on table public.pay_rules is
  'How a union day is paid. overtime_after {8,12} with overtime_multipliers {1.5,2} = 1.5x after 8 hours, 2x after 12. A department row (e.g. Transportation) replaces the union-wide row for that department.';

-- ── Rate schedules: production type, which column is hourly / daily, role links ──

alter table public.rate_schedules
  add column production_type text,   -- e.g. 'Feature Film', 'Low Budget Feature ($3M and below)'; null = all productions
  add column hourly_column   text,   -- the column that holds the minimum hourly rate
  add column daily_column    text,   -- the column that holds the minimum daily fee, if the agreement has one
  add constraint rate_schedules_hourly_column_check check (hourly_column is null or hourly_column = any(columns)),
  add constraint rate_schedules_daily_column_check check (daily_column is null or daily_column = any(columns));

comment on column public.rate_schedules.hourly_column is 'Name of the column in columns[] that is the minimum hourly rate. The app uses it to suggest the rate and flag pay below scale.';

alter table public.rate_lines
  add column role_id text references public.roles(id) on update cascade on delete set null;

comment on column public.rate_lines.role_id is 'The catalog role this position is, so the app can suggest its minimum. Several lines can share a role (e.g. Principal Actor and Actor).';

create index idx_rate_lines_role on public.rate_lines(role_id) where role_id is not null;
create index idx_rate_schedules_union on public.rate_schedules(union_id, effective_from desc);

create trigger pay_rules_bump_version after insert or update or delete or truncate on public.pay_rules
  for each statement execute function public.bump_union_engine_version();
create trigger pay_rules_touch before update on public.pay_rules
  for each row execute function public.touch_updated_at();
alter table public.pay_rules enable row level security;
create policy "engine: public read" on public.pay_rules for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.pay_rules from anon, authenticated;

-- ── Read API ────────────────────────────────────────────────

-- The snapshot now carries pay rules and rate schedule headers only.
-- Rate lines (thousands of rows across production types and years) are
-- fetched per schedule with rate_schedule_lines().
create or replace function public.union_engine_snapshot()
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'version', (select version from union_engine_meta where id),
    'unions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id, 'name', u.name, 'scope', u.scope, 'description', u.description,
        'website', u.website, 'contactEmail', u.contact_email, 'contactPhone', u.contact_phone,
        'applicationFee', u.application_fee, 'applicationFeeNotes', u.application_fee_notes,
        'duesRate', u.dues_rate, 'duesNotes', u.dues_notes, 'residencyRule', u.residency_rule,
        'jurisdictionalNotes', u.jurisdictional_notes, 'memberBenefits', u.member_benefits,
        'needsVerification', u.needs_verification, 'sourceUrls', u.source_urls, 'lastVerified', u.last_verified,
        'jurisdictions', coalesce((
          select jsonb_agg(jsonb_build_object('province', j.province, 'region', j.region,
                   'contactEmail', j.contact_email, 'contactPhone', j.contact_phone,
                   'notes', j.notes, 'needsVerification', j.needs_verification) order by j.province, j.region nulls first)
          from union_jurisdictions j where j.union_id = u.id), '[]'::jsonb),
        'tiers', coalesce((
          select jsonb_agg(jsonb_build_object('name', t.name, 'targetType', t.target_type, 'targetValue', t.target_value,
                   'description', t.description, 'requiresDepartment', t.requires_department) order by t.sort_order, t.id)
          from union_tiers t where t.union_id = u.id), '[]'::jsonb),
        'requirements', coalesce((
          select jsonb_agg(jsonb_build_object('kind', q.kind, 'province', q.province, 'caucus', q.caucus, 'text', q.text)
                   order by q.kind, q.province nulls first, q.caucus nulls first, q.sort_order, q.id)
          from union_requirements q where q.union_id = u.id), '[]'::jsonb),
        'departments', coalesce((
          select jsonb_agg(d.name order by d.sort_order, d.id) from union_departments d where d.union_id = u.id), '[]'::jsonb)
      ) order by u.sort_order, u.name)
      from unions u where u.is_active), '[]'::jsonb),
    'departments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'name', d.name, 'code', d.code, 'description', d.description,
        'roles', coalesce((
          select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'code', r.code, 'description', r.description,
                   'requirements', r.requirements, 'aliases', r.aliases, 'isTrainee', r.is_trainee) order by r.sort_order, r.name)
          from roles r where r.department_id = d.id), '[]'::jsonb)
      ) order by d.sort_order, d.name)
      from departments d), '[]'::jsonb),
    'roleCoverage', coalesce((
      select jsonb_agg(jsonb_build_array(c.role_id, c.province, c.region, c.union_id, c.relationship, c.notes)
               order by c.role_id, c.province, c.region nulls first, c.sort_order, c.id)
      from role_coverage c join unions u on u.id = c.union_id and u.is_active), '[]'::jsonb),
    'departmentCoverage', coalesce((
      select jsonb_agg(jsonb_build_array(c.department_id, c.province, c.region, c.union_id, c.relationship, c.notes)
               order by c.department_id, c.province, c.region nulls first, c.sort_order, c.id)
      from department_coverage c join unions u on u.id = c.union_id and u.is_active), '[]'::jsonb),
    'rateSchedules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'unionId', s.union_id, 'title', s.title, 'productionType', s.production_type,
        'effectiveFrom', s.effective_from, 'effectiveTo', s.effective_to, 'columns', s.columns,
        'hourlyColumn', s.hourly_column, 'dailyColumn', s.daily_column,
        'rateUnit', s.rate_unit, 'sourceUrl', s.source_url, 'notes', s.notes,
        -- role ids with a minimum in this schedule, so the app knows which schedules to load lines for
        'roleIds', coalesce((select jsonb_agg(distinct l.role_id) from rate_lines l
                             where l.schedule_id = s.id and l.role_id is not null), '[]'::jsonb)
      ) order by s.union_id, s.effective_from desc, s.production_type nulls first, s.id)
      from rate_schedules s join unions u on u.id = s.union_id and u.is_active), '[]'::jsonb),
    'payRules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'unionId', p.union_id, 'title', p.title, 'departmentId', p.department_id,
        'minimumCallHours', p.minimum_call_hours, 'overtimeAfter', p.overtime_after,
        'overtimeMultipliers', p.overtime_multipliers, 'incrementMinutes', p.increment_minutes,
        'mealBreakNotes', p.meal_break_notes, 'notes', p.notes,
        'needsVerification', p.needs_verification, 'sourceUrl', p.source_url
      ) order by p.union_id, p.department_id nulls first, p.sort_order)
      from pay_rules p join unions u on u.id = p.union_id and u.is_active), '[]'::jsonb)
  );
$$;

-- Lines for the given schedules, as one JSON value (no 1,000-row API limit).
create or replace function public.rate_schedule_lines(p_schedule_ids text[])
returns jsonb language sql stable security invoker set search_path = public as $$
  select coalesce(jsonb_object_agg(s.id, coalesce((
    select jsonb_agg(jsonb_build_object('department', l.department, 'departmentNote', l.department_note,
             'position', l.position, 'rates', l.rates, 'roleId', l.role_id) order by l.sort_order, l.id)
    from rate_lines l where l.schedule_id = s.id), '[]'::jsonb)), '{}'::jsonb)
  from rate_schedules s
  where s.id = any(p_schedule_ids);
$$;

revoke all on function public.rate_schedule_lines(text[]) from public;
grant execute on function public.rate_schedule_lines(text[]) to anon, authenticated;

-- ── Jobs: log work by the hour ──────────────────────────────

alter table public.jobs
  add column days_worked        int not null default 1 check (days_worked between 1 and 366),
  add column hours_per_day      numeric(4,2) check (hours_per_day > 0 and hours_per_day <= 24),  -- call to wrap, per day
  add column meal_break_minutes int not null default 0 check (meal_break_minutes between 0 and 600), -- unpaid, per day
  add column overtime_hours     numeric(8,2) not null default 0 check (overtime_hours >= 0),
  add column union_minimum_rate numeric(10,2) check (union_minimum_rate >= 0),  -- the scale that applied when logged
  add column rate_position      text;                                          -- the rate-sheet position used

comment on column public.jobs.total_hours is 'Hours worked across all days, after unpaid meal breaks. Counts toward union hour requirements.';
comment on column public.jobs.union_minimum_rate is 'Union minimum hourly rate for this position on the job date, saved when logged so later rate changes do not rewrite history.';

-- Fast "my productions / my companies" lists for the job form.
create index idx_jobs_user_production on public.jobs(user_id, production_name);
