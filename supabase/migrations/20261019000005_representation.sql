-- Industry representation: the agents and managers someone works with, and
-- the commission each takes. An account setting (like the earning goal), so it
-- is stored online for every signed-in account, free or Pro.
--
--   applies_to  'booked' = only jobs this person booked (most agents)
--               'all'    = every job (e.g. a manager on commission)
--
-- A job names who booked it with jobs.representative_id.

create table public.representatives (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  name           text not null check (length(trim(name)) between 1 and 120),
  agency         text check (agency is null or length(agency) <= 120),
  kind           text not null default 'agent' check (kind in ('agent', 'manager', 'other')),
  commission_pct numeric(5,2) not null check (commission_pct between 0 and 50),
  applies_to     text not null default 'booked' check (applies_to in ('booked', 'all')),
  agency_id      uuid references public.profiles(id) on delete set null,   -- when it's the agency linked in Agency Mode
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_representatives_user on public.representatives (user_id);
create trigger trg_representatives_updated_at before update on public.representatives
  for each row execute procedure public.set_updated_at();

alter table public.representatives enable row level security;
create policy "representatives: own all" on public.representatives for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- At most 20 per account.
create or replace function public.representatives_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.representatives where user_id = new.user_id) >= 20 then
    raise exception 'You can add up to 20 representatives.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger trg_representatives_limit before insert on public.representatives
  for each row execute function public.representatives_limit();

alter table public.jobs add column representative_id uuid references public.representatives(id) on delete set null;

-- The agent fee from Setting the Scene becomes a representative (on every job,
-- since we don't know which jobs they booked).
insert into public.representatives (user_id, name, kind, commission_pct, applies_to, agency_id)
select p.id, 'Your agent', 'agent', least(p.agent_fee_pct, 50), 'all', p.managed_by_agency_id
from public.profiles p
where p.has_agent_fee and coalesce(p.agent_fee_pct, 0) > 0;
