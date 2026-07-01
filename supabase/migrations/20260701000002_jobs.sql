-- ============================================================
-- JOBS
-- Film/TV production job records per user.
-- ============================================================

create table public.jobs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  status           text not null default 'CONFIRMED' check (status in ('CONFIRMED', 'TENTATIVE')),
  production_name  text not null,
  company_name     text not null,
  role             text not null,
  department       text,
  is_union         boolean not null default false,
  union_type_id    text,
  union_name       text,
  credit_type      text check (credit_type in ('PRINCIPAL','ACTOR','STUNT','BACKGROUND','CREW','OTHER')),
  is_upgrade       boolean default false,
  production_tier  text,
  start_date       date not null,
  end_date         date,
  total_hours      numeric(8,2) not null default 0,
  hourly_rate      numeric(10,2),
  gross_earnings   numeric(12,2),
  union_deductions numeric(12,2),
  notes            text,
  document_ids     text[],
  image_url        text,
  genre            text,
  province         text,
  -- Offline sync fields
  client_id        text unique,           -- device-generated id for dedup
  synced_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_jobs_user_id on public.jobs(user_id);
create index idx_jobs_start_date on public.jobs(user_id, start_date desc);

create trigger trg_jobs_updated_at
  before update on public.jobs
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.jobs enable row level security;

create policy "jobs: own all"
  on public.jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Agents can read jobs of their roster
create policy "jobs: agent read roster"
  on public.jobs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = jobs.user_id
        and p.managed_by_agency_id = auth.uid()
    )
  );
