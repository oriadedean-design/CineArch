-- ============================================================
-- PROFILES
-- Extends auth.users with CineArch-specific fields.
-- One row per user, created automatically on signup via trigger.
-- ============================================================

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  name            text,
  phone           text,
  country         text default 'CA',
  language        text default 'en',
  role            text,
  province        text,
  region          text,
  account_type    text not null default 'INDIVIDUAL' check (account_type in ('INDIVIDUAL', 'AGENT')),
  is_onboarded    boolean not null default false,
  is_premium      boolean not null default false,
  plan            text not null default 'free' check (plan in ('free', 'pro', 'agency')),
  member_status   text check (member_status in ('ASPIRING', 'MEMBER')),
  career_focus    text,
  department      text,
  selected_roles  text[],
  goals           text[],
  has_agent_fee   boolean default false,
  agent_fee_pct   numeric(5,2) default 0,
  entity_type     text check (entity_type in ('AGENCY', 'ARTS_ORG', 'TRAINING_INST')),
  organization_name text,
  business_structure text check (business_structure in ('INCORPORATED','SOLE_PROPRIETORSHIP','EMPLOYEE','ORGANIZATION')),
  primary_industry  text,
  managed_by_agency_id uuid references public.profiles(id) on delete set null,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;

-- Users read/update their own profile
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Agents can read profiles of their managed individuals
create policy "profiles: agent reads roster"
  on public.profiles for select
  using (
    managed_by_agency_id = auth.uid()
  );

-- No public insert — the trigger handles it
-- No delete policy — users cannot self-delete via API
