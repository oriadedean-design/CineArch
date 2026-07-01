-- ============================================================
-- SESSION CAP
-- Tracks active sessions per user. Enforces max 3 concurrent
-- logins. Oldest session is revoked when the cap is exceeded.
-- ============================================================

create table public.user_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  session_token text not null unique,   -- hashed JWT jti claim
  device_label  text,                   -- e.g. "Chrome on macOS"
  ip_address    inet,
  last_active   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index idx_sessions_user_id on public.user_sessions(user_id, created_at desc);

alter table public.user_sessions enable row level security;

-- Users can only see and delete their own sessions
create policy "sessions: own read"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "sessions: own delete"
  on public.user_sessions for delete
  using (auth.uid() = user_id);

-- Only server-side (service role) may insert/update sessions
-- No insert/update policy = blocked for anon and authenticated roles

-- ============================================================
-- ENFORCE SESSION CAP (max 3 per user)
-- Runs after a new session row is inserted by the server.
-- Deletes the oldest sessions beyond the cap.
-- ============================================================

create or replace function public.enforce_session_cap()
returns trigger language plpgsql security definer as $$
declare
  max_sessions constant int := 3;
  session_count int;
begin
  select count(*) into session_count
  from public.user_sessions
  where user_id = new.user_id;

  if session_count > max_sessions then
    delete from public.user_sessions
    where id in (
      select id from public.user_sessions
      where user_id = new.user_id
      order by created_at asc
      limit (session_count - max_sessions)
    );
  end if;

  return new;
end;
$$;

create trigger trg_enforce_session_cap
  after insert on public.user_sessions
  for each row execute procedure public.enforce_session_cap();

-- ============================================================
-- OFFLINE SYNC QUEUE
-- Client writes pending changes here when offline.
-- A sync function drains the queue when connectivity returns.
-- ============================================================

create table public.sync_queue (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  table_name   text not null check (table_name in ('jobs','finance_transactions','union_tracking','residency_documents')),
  operation    text not null check (operation in ('INSERT','UPDATE','DELETE')),
  record_id    text not null,      -- client_id of the record
  payload      jsonb not null,
  attempted_at timestamptz,
  error        text,
  created_at   timestamptz not null default now()
);

create index idx_sync_queue_user on public.sync_queue(user_id, created_at asc);

alter table public.sync_queue enable row level security;

create policy "sync_queue: own all"
  on public.sync_queue for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
