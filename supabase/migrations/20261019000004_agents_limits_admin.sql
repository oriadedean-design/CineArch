-- From Dean's notes (October 19, 2026):
--   1. Which agent booked a job
--   2. Numbers that can't break the maths (sane ranges on every amount)
--   3. A-List Pro makes at most 3 PDF reports a month
--   4. An admin page to verify every union, pay and tax fact

-- ------------------------------------------------------------------
-- 1. Agent on a job: the linked agency (Agency Mode) or a typed name.
-- ------------------------------------------------------------------
alter table public.jobs
  add column agent_name text check (agent_name is null or length(agent_name) between 1 and 120),
  add column agency_id  uuid references public.profiles(id) on delete set null;

-- The job form's agent picker uses my_agency() (agency_links migration).

-- ------------------------------------------------------------------
-- 2. Ranges. NOT VALID: new and changed rows are checked; old rows aren't
-- rejected retroactively.
-- ------------------------------------------------------------------
alter table public.jobs
  add constraint jobs_total_hours_range check (total_hours between 0 and 8784) not valid,
  add constraint jobs_hourly_rate_range check (hourly_rate is null or hourly_rate between 0 and 10000) not valid,
  add constraint jobs_gross_range check (gross_earnings is null or gross_earnings between 0 and 10000000) not valid;

alter table public.finance_transactions
  add constraint finance_amount_range check (amount_before_tax between 0 and 10000000) not valid,
  add constraint finance_tax_range check (tax_amount between 0 and 10000000 and tax_amount <= amount_before_tax) not valid,
  add constraint finance_total_range check (total_amount between 0 and 20000000) not valid;

alter table public.union_tracking
  add constraint tracking_starting_range check (starting_value between 0 and 1000000) not valid,
  add constraint tracking_target_range check (target_value > 0 and target_value <= 10000000) not valid;

alter table public.profiles
  add constraint profiles_goal_range check (earning_goal is null or earning_goal <= 100000000) not valid;

-- ------------------------------------------------------------------
-- 3. PDF reports: A-List Pro makes up to 3 a calendar month (Toronto time).
-- The phone asks for one before it builds the PDF.
-- ------------------------------------------------------------------
create table public.report_runs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('union', 'tax', 'overview')),
  created_at timestamptz not null default now()
);
create index idx_report_runs_user_month on public.report_runs (user_id, created_at);
alter table public.report_runs enable row level security;
create policy "report_runs: own read" on public.report_runs for select using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.report_runs from anon, authenticated;

create or replace function public.report_month_start()
returns timestamptz language sql stable as $$
  select date_trunc('month', now() at time zone 'America/Toronto') at time zone 'America/Toronto';
$$;

create or replace function public.my_report_usage()
returns table (used int, report_limit int)
language sql stable security definer set search_path = public as $$
  select count(*)::int, 3 from public.report_runs
  where user_id = (select auth.uid()) and created_at >= public.report_month_start();
$$;
revoke all on function public.my_report_usage() from public, anon;
grant execute on function public.my_report_usage() to authenticated;

-- Records a report and returns how many are left this month, or refuses.
create or replace function public.start_report(p_kind text)
returns int
language plpgsql security definer set search_path = public as $$
declare v_used int;
begin
  if not public.has_pro() then
    raise exception 'Reports come with A-List Pro' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtext('report_runs:' || auth.uid()::text));
  select count(*) into v_used from public.report_runs
  where user_id = auth.uid() and created_at >= public.report_month_start();
  if v_used >= 3 then
    raise exception 'REPORT_LIMIT: You''ve made 3 reports this month. More on the 1st.' using errcode = 'P0001';
  end if;
  insert into public.report_runs (user_id, kind) values (auth.uid(), p_kind);
  return 3 - v_used - 1;
end $$;
revoke all on function public.start_report(text) from public, anon;
grant execute on function public.start_report(text) to authenticated;

-- ------------------------------------------------------------------
-- 4. Verifying facts. Admins (set here only, never by the app) stamp a
-- fact as checked against its source; every check is kept.
-- ------------------------------------------------------------------
alter table public.profiles add column is_admin boolean not null default false;
update public.profiles set is_admin = true where lower(email) = 'oriade.dean@gmail.com';

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false);
$$;
grant execute on function public.is_admin() to authenticated;

alter table public.pay_rules      add column checked_on date;
alter table public.rate_schedules add column checked_on date;

create table public.fact_checks (
  id          uuid primary key default gen_random_uuid(),
  subject     text not null check (subject in ('union', 'tier', 'pay_rule', 'rate_schedule', 'tax', 'pension', 'sales_tax', 'deadline')),
  subject_key text not null,
  outcome     text not null check (outcome in ('verified', 'flagged')),
  note        text,
  checked_by  uuid references public.profiles(id) on delete set null,
  checked_at  timestamptz not null default now()
);
create index idx_fact_checks_subject on public.fact_checks (subject, subject_key, checked_at desc);
alter table public.fact_checks enable row level security;
create policy "fact_checks: admins read" on public.fact_checks for select using ((select public.is_admin()));
revoke insert, update, delete on public.fact_checks from anon, authenticated;

-- Keys: union = id; tier = 'union_id|name'; pay_rule, rate_schedule, deadline = id;
-- tax = 'year|code'; pension = 'year|code'; sales_tax = 'year|province'.
-- 'verified' stamps today's date on the fact (and confirms a tier that has a source);
-- 'flagged' records a note for follow-up without changing the fact.
create or replace function public.check_fact(p_subject text, p_key text, p_outcome text, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare a text; b text; n int := 1;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  a := split_part(p_key, '|', 1); b := split_part(p_key, '|', 2);
  if p_outcome = 'verified' then
    case p_subject
      when 'union' then update unions set last_verified = current_date where id = a;
      when 'tier' then update union_tiers set checked_on = current_date, confirmed = (source_url is not null) where union_id = a and name = b;
      when 'pay_rule' then update pay_rules set checked_on = current_date where id = a;
      when 'rate_schedule' then update rate_schedules set checked_on = current_date where id = a;
      when 'tax' then update tax_jurisdictions set checked_on = current_date where year = a::int and code = b;
      when 'pension' then update pension_plans set checked_on = current_date where year = a::int and code = b;
      when 'sales_tax' then update sales_tax set checked_on = current_date where year = a::int and province = b;
      when 'deadline' then update deadlines set checked_on = current_date where id = a;
      else raise exception 'Unknown subject %', p_subject;
    end case;
    get diagnostics n = row_count;
    if n = 0 then raise exception 'No % with key %', p_subject, p_key using errcode = 'P0002'; end if;
  elsif p_outcome <> 'flagged' then
    raise exception 'Outcome must be verified or flagged';
  end if;
  insert into fact_checks (subject, subject_key, outcome, note, checked_by) values (p_subject, p_key, p_outcome, nullif(trim(p_note), ''), auth.uid());
end $$;
revoke all on function public.check_fact(text, text, text, text) from public, anon;
grant execute on function public.check_fact(text, text, text, text) to authenticated;
