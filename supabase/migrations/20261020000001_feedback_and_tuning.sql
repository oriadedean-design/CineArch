-- Feedback to the developers, plus housekeeping from an audit of the live
-- database: indexes for every foreign key, a fixed search_path on every
-- function, and the agent answer in Setting the Scene now feeding
-- Industry representation.

-- ── Indexes: every foreign key gets one, so joins and cascading deletes
--    (Delete account) stay fast as the tables grow.
create index if not exists idx_jobs_agency              on public.jobs (agency_id) where agency_id is not null;
create index if not exists idx_jobs_representative      on public.jobs (representative_id) where representative_id is not null;
create index if not exists idx_union_tiers_union        on public.union_tiers (union_id);
create index if not exists idx_union_requirements_union on public.union_requirements (union_id);
create index if not exists idx_department_coverage_union on public.department_coverage (union_id);
create index if not exists idx_pay_rules_department     on public.pay_rules (department_id);
create index if not exists idx_deadlines_union          on public.deadlines (union_id);
create index if not exists idx_fact_checks_checked_by   on public.fact_checks (checked_by);
create index if not exists idx_representatives_agency   on public.representatives (agency_id) where agency_id is not null;

-- ── Functions run with a fixed search_path, so nothing can shadow a table.
alter function public.copy_role_coverage(text, text) set search_path = public;
alter function public.enforce_session_cap()          set search_path = public;
alter function public.is_canadian_province(text)     set search_path = public;
alter function public.is_engine_region(text)         set search_path = public;
alter function public.report_month_start()           set search_path = public;
alter function public.representatives_limit()        set search_path = public;
alter function public.set_updated_at()               set search_path = public;
alter function public.touch_updated_at()             set search_path = public;

-- ── Setting the Scene asks "Do you have an agent?" and their commission.
--    That answer now becomes (or updates) "Your agent" in Industry
--    representation, so the commission shows on jobs straight away. It only
--    adds one when there are no representatives yet; after that, Industry
--    representation is where they're managed.
create or replace function public.profile_agent_to_representative()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not new.has_agent_fee or coalesce(new.agent_fee_pct, 0) <= 0 then return new; end if;
  if tg_op = 'UPDATE' and old.has_agent_fee is not distinct from new.has_agent_fee
     and old.agent_fee_pct is not distinct from new.agent_fee_pct then return new; end if;
  update public.representatives set commission_pct = least(new.agent_fee_pct, 50)
   where user_id = new.id and name = 'Your agent';
  if not found and not exists (select 1 from public.representatives where user_id = new.id) then
    insert into public.representatives (user_id, name, kind, commission_pct, applies_to, agency_id)
    values (new.id, 'Your agent', 'agent', least(new.agent_fee_pct, 50), 'all', new.managed_by_agency_id);
  end if;
  return new;
end $$;
create trigger trg_profiles_agent_to_representative after insert or update of has_agent_fee, agent_fee_pct
  on public.profiles for each row execute function public.profile_agent_to_representative();

-- ── Feedback: anyone signed in can send a note to the developers from
--    Settings. They see their own; admins see all of them and mark them read.
create table public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('problem', 'idea', 'praise')),
  message     text not null check (length(trim(message)) between 1 and 2000),
  screen      text check (screen is null or length(screen) <= 60),          -- where in the app it's about
  platform    text not null check (platform in ('ios', 'web')),
  app_version text check (app_version is null or length(app_version) <= 30),
  status      text not null default 'new' check (status in ('new', 'read', 'done')),
  created_at  timestamptz not null default now()
);
create index idx_feedback_user   on public.feedback (user_id);
create index idx_feedback_status on public.feedback (status, created_at desc);

alter table public.feedback enable row level security;
create policy "feedback: own insert" on public.feedback for insert
  with check ((select auth.uid()) = user_id and status = 'new');
create policy "feedback: own or admin read" on public.feedback for select
  using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy "feedback: admins update" on public.feedback for update
  using ((select public.is_admin())) with check ((select public.is_admin()));
revoke update, delete on public.feedback from anon, authenticated;
grant update (status) on public.feedback to authenticated;

-- At most 10 notes a day per account, so a stuck button can't flood it.
create or replace function public.feedback_limit()
returns trigger language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.feedback
       where user_id = new.user_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'FEEDBACK_LIMIT: You can send up to 10 notes a day.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger trg_feedback_limit before insert on public.feedback
  for each row execute function public.feedback_limit();

-- The admin inbox: each note with who sent it, so a reply can go by email.
create or replace function public.admin_feedback(p_status text default null)
returns table (id uuid, kind text, message text, screen text, platform text, app_version text,
               status text, created_at timestamptz, name text, email text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select f.id, f.kind, f.message, f.screen, f.platform, f.app_version, f.status, f.created_at, p.name, p.email
      from public.feedback f join public.profiles p on p.id = f.user_id
     where p_status is null or f.status = p_status
     order by f.created_at desc limit 200;
end $$;
revoke execute on function public.admin_feedback(text) from public, anon;
grant execute on function public.admin_feedback(text) to authenticated;
