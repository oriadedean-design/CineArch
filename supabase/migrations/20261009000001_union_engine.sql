-- ============================================================
-- UNION ENGINE
-- The source of truth for unions, their requirements, fees,
-- dues and rates, the role catalog, and which union covers
-- which role in which province / region.
--
-- Edit these tables in the Supabase dashboard (Table Editor).
-- Everyone can read them (the public guide does, without login);
-- nobody can write them through the API.
--
-- The app and guide read everything in one call:
--   select union_engine_snapshot();
-- and re-fetch only when union_engine_version() changes, which
-- every insert / update / delete on these tables bumps.
-- ============================================================

-- ── Shared value lists ──────────────────────────────────────

create or replace function public.is_canadian_province(p text)
returns boolean language sql immutable as $$
  select p in (
    'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan',
    'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador', 'Prince Edward Island',
    'Yukon', 'Northwest Territories', 'Nunavut'
  );
$$;

-- Ontario is the only province split into regions today. null = whole province.
create or replace function public.is_engine_region(r text)
returns boolean language sql immutable as $$
  select r is null or r in ('TORONTO', 'NORTHERN_ON', 'OTTAWA', 'OTHER');
$$;

-- ── Unions ──────────────────────────────────────────────────

create table public.unions (
  id                    text primary key check (id ~ '^u-[a-z0-9-]+$'),
  name                  text not null unique,
  scope                 text check (scope in ('performers','technicians','camera','production_office','directors','writers','transportation','mixed')),
  description           text not null default '',
  website               text,
  contact_email         text,
  contact_phone         text,
  application_fee       numeric(10,2) check (application_fee >= 0),   -- null = not yet added
  application_fee_notes text,                                          -- breakdown / refund policy
  dues_rate             numeric(6,4) check (dues_rate >= 0 and dues_rate < 1), -- working dues, 0.0225 = 2.25%
  dues_notes            text,
  residency_rule        text,
  jurisdictional_notes  text,
  member_benefits       text[] not null default '{}',
  needs_verification    text[] not null default '{}',  -- claims to confirm with the union
  source_urls           text[] not null default '{}',
  last_verified         date,
  is_active             boolean not null default true,
  sort_order            int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.unions is 'Every union / guild / local the engine knows. Edit freely; the app picks changes up on next load.';
comment on column public.unions.needs_verification is 'Facts not yet confirmed with the union (e.g. {"application fee"}). Shown on the guide as awaiting confirmation.';

-- Where a union operates. region null = the whole province.
create table public.union_jurisdictions (
  id                 bigint generated always as identity primary key,
  union_id           text not null references public.unions(id) on update cascade on delete cascade,
  province           text not null check (public.is_canadian_province(province)),
  region             text check (public.is_engine_region(region)),
  contact_email      text,      -- e.g. a district council or branch office
  contact_phone      text,
  notes              text,
  needs_verification boolean not null default false,
  updated_at         timestamptz not null default now(),
  unique nulls not distinct (union_id, province, region)
);

-- Membership tiers, in order (Permittee → Member, Apprentice → Full Member).
create table public.union_tiers (
  id                  bigint generated always as identity primary key,
  union_id            text not null references public.unions(id) on update cascade on delete cascade,
  sort_order          int not null default 0,
  name                text not null,
  target_type         text not null check (target_type in ('HOURS','DAYS','CREDITS','EARNINGS')),
  target_value        numeric not null check (target_value > 0),
  description         text,
  requires_department boolean not null default false,
  updated_at          timestamptz not null default now()
);

-- Requirements, application steps and benefits as list items.
-- province / caucus scope an item (DGC BC permittee rules, 411 Craftservice caucus).
create table public.union_requirements (
  id         bigint generated always as identity primary key,
  union_id   text not null references public.unions(id) on update cascade on delete cascade,
  kind       text not null default 'requirement' check (kind in ('requirement','application_step')),
  province   text check (province is null or public.is_canadian_province(province)),
  caucus     text,
  sort_order int not null default 0,
  text       text not null,
  updated_at timestamptz not null default now()
);

-- Departments as the union itself lists them (shown on the union's page).
create table public.union_departments (
  id         bigint generated always as identity primary key,
  union_id   text not null references public.unions(id) on update cascade on delete cascade,
  sort_order int not null default 0,
  name       text not null,
  updated_at timestamptz not null default now(),
  unique (union_id, name)
);

-- ── Role catalog ────────────────────────────────────────────

create table public.departments (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  name        text not null unique,
  code        text,
  description text,
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now()
);

create table public.roles (
  id            text primary key check (id ~ '^[a-z0-9-]+$'),
  department_id text not null references public.departments(id) on update cascade,
  name          text not null,
  code          text,                          -- guild role code where one exists (1AD, PM, LM…)
  description   text,                          -- null = "Description coming soon"
  requirements  text[] not null default '{}',
  aliases       text[] not null default '{}',  -- other titles that mean this role
  is_trainee    boolean not null default false,
  sort_order    int not null default 0,
  updated_at    timestamptz not null default now(),
  unique (department_id, name)
);

-- ── Coverage: which union covers which role, where ─────────
-- One row per (role, province, region, union). region null = whole
-- province; a region row overrides the province rows for that region.
-- relationship 'shared' = competing / overlapping jurisdiction where
-- the production's agreement decides.

create table public.role_coverage (
  id                 bigint generated always as identity primary key,
  role_id            text not null references public.roles(id) on update cascade on delete cascade,
  province           text not null check (public.is_canadian_province(province)),
  region             text check (public.is_engine_region(region)),
  union_id           text not null references public.unions(id) on update cascade on delete cascade,
  relationship       text not null default 'primary' check (relationship in ('primary','shared')),
  sort_order         int not null default 0,
  notes              text,
  needs_verification boolean not null default false,
  updated_at         timestamptz not null default now(),
  unique nulls not distinct (role_id, province, region, union_id)
);

create index idx_role_coverage_lookup on public.role_coverage(role_id, province);
create index idx_role_coverage_union  on public.role_coverage(union_id);

-- Fallback for job titles that aren't in the catalog: the department decides.
create table public.department_coverage (
  id                 bigint generated always as identity primary key,
  department_id      text not null references public.departments(id) on update cascade on delete cascade,
  province           text not null check (public.is_canadian_province(province)),
  region             text check (public.is_engine_region(region)),
  union_id           text not null references public.unions(id) on update cascade on delete cascade,
  relationship       text not null default 'primary' check (relationship in ('primary','shared')),
  sort_order         int not null default 0,
  notes              text,
  updated_at         timestamptz not null default now(),
  unique nulls not distinct (department_id, province, region, union_id)
);

-- ── Rates ───────────────────────────────────────────────────

create table public.rate_schedules (
  id             text primary key check (id ~ '^[a-z0-9-]+$'),
  union_id       text not null references public.unions(id) on update cascade on delete cascade,
  title          text not null,
  effective_from date not null,
  effective_to   date,
  columns        text[] not null,       -- e.g. {High Budget, Tier A, Tier B, Tier C}
  rate_unit      text not null default 'weekly',
  source_url     text,
  notes          text,
  updated_at     timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

-- rates[i] is the rate for columns[i]; null = negotiable.
create table public.rate_lines (
  id          bigint generated always as identity primary key,
  schedule_id text not null references public.rate_schedules(id) on update cascade on delete cascade,
  department  text not null,
  department_note text,
  position    text not null,
  rates       numeric[] not null,
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now()
);

create index idx_rate_lines_schedule on public.rate_lines(schedule_id, sort_order);

-- ── Readable views for checking in the dashboard ───────────

create view public.union_roles with (security_invoker = true) as
  select u.name as union_name, c.province, c.region, d.name as department, r.name as role,
         c.relationship, c.notes, c.needs_verification, c.id as coverage_id
  from public.role_coverage c
  join public.unions u on u.id = c.union_id
  join public.roles r on r.id = c.role_id
  join public.departments d on d.id = r.department_id
  order by u.name, c.province, c.region nulls first, d.sort_order, r.sort_order;

comment on view public.union_roles is 'Read-only: roles each union covers, by province. Edit role_coverage to change it.';

-- Copies a role's coverage to another role (for adding similar roles quickly).
-- Dashboard / SQL editor only: not exposed to the API.
create or replace function public.copy_role_coverage(p_from_role text, p_to_role text)
returns int language sql as $$
  with ins as (
    insert into public.role_coverage (role_id, province, region, union_id, relationship, sort_order, notes, needs_verification)
    select p_to_role, province, region, union_id, relationship, sort_order, notes, needs_verification
    from public.role_coverage where role_id = p_from_role
    on conflict do nothing
    returning 1
  )
  select count(*)::int from ins;
$$;
revoke all on function public.copy_role_coverage(text, text) from public, anon, authenticated;

-- ── Versioning ──────────────────────────────────────────────

create table public.union_engine_meta (
  id         boolean primary key default true check (id),
  version    bigint not null default 1,
  updated_at timestamptz not null default now()
);
insert into public.union_engine_meta default values;

create or replace function public.bump_union_engine_version()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.union_engine_meta set version = version + 1, updated_at = now() where id;
  return null;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['unions','union_jurisdictions','union_tiers','union_requirements','union_departments',
                           'departments','roles','role_coverage','department_coverage','rate_schedules','rate_lines']
  loop
    execute format('create trigger %I after insert or update or delete or truncate on public.%I
                    for each statement execute function public.bump_union_engine_version()', t || '_bump_version', t);
    execute format('create trigger %I before update on public.%I
                    for each row execute function public.touch_updated_at()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "engine: public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
  end loop;
end $$;

alter table public.union_engine_meta enable row level security;
create policy "engine: public read" on public.union_engine_meta for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.union_engine_meta from anon, authenticated;

-- ── Read API ────────────────────────────────────────────────

create or replace function public.union_engine_version()
returns bigint language sql stable security invoker set search_path = public as $$
  select version from public.union_engine_meta where id;
$$;

-- Everything the resolver and guide need, in one round trip.
-- Coverage is sent as compact arrays: [role_or_dept_id, province, region, union_id, relationship, notes].
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
        'id', s.id, 'unionId', s.union_id, 'title', s.title, 'effectiveFrom', s.effective_from,
        'effectiveTo', s.effective_to, 'columns', s.columns, 'rateUnit', s.rate_unit, 'sourceUrl', s.source_url, 'notes', s.notes,
        'lines', coalesce((
          select jsonb_agg(jsonb_build_object('department', l.department, 'departmentNote', l.department_note,
                   'position', l.position, 'rates', l.rates) order by l.sort_order, l.id)
          from rate_lines l where l.schedule_id = s.id), '[]'::jsonb)
      ) order by s.effective_from desc)
      from rate_schedules s join unions u on u.id = s.union_id and u.is_active), '[]'::jsonb)
  );
$$;

revoke all on function public.union_engine_version() from public;
revoke all on function public.union_engine_snapshot() from public;
grant execute on function public.union_engine_version() to anon, authenticated;
grant execute on function public.union_engine_snapshot() to anon, authenticated;
