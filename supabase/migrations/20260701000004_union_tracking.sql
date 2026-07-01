-- ============================================================
-- UNION TRACKING
-- Tracks each user's progress toward union membership tiers.
-- ============================================================

create table public.union_tracking (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  union_type_id  text not null,
  union_name     text not null,
  tier_label     text not null,
  department     text,
  target_type    text not null check (target_type in ('HOURS','DAYS','CREDITS','EARNINGS')),
  target_value   numeric(10,2) not null,
  starting_value numeric(10,2) not null default 0,
  client_id      text unique,
  synced_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, union_type_id)
);

create trigger trg_union_tracking_updated_at
  before update on public.union_tracking
  for each row execute procedure public.set_updated_at();

alter table public.union_tracking enable row level security;

create policy "union_tracking: own all"
  on public.union_tracking for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- RESIDENCY DOCUMENTS
-- Encrypted document vault — file metadata only (blobs in Storage).
-- ============================================================

create table public.residency_documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  file_name   text not null,
  storage_path text not null,
  verified    boolean not null default false,
  client_id   text unique,
  synced_at   timestamptz,
  uploaded_at timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_documents_updated_at
  before update on public.residency_documents
  for each row execute procedure public.set_updated_at();

alter table public.residency_documents enable row level security;

create policy "documents: own all"
  on public.residency_documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
