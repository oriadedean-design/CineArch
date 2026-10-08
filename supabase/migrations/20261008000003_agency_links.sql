-- ============================================================
-- AGENCY LINKS
-- Agents invite personnel by email; the person accepts from
-- their own account. Only then can the agent read/write their
-- jobs and union tracking. Finance and documents stay private.
-- ============================================================

-- True when the caller is the agency managing p_client.
-- Security definer so it can be used inside RLS policies on
-- other tables without recursing through profiles RLS.
create or replace function public.is_agent_of(p_client uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = p_client and managed_by_agency_id = auth.uid()
  );
$$;

create or replace function public.is_agent()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and account_type = 'AGENT'
  );
$$;

-- ── Invites ─────────────────────────────────────────────────

create table public.agency_invites (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid not null references public.profiles(id) on delete cascade,
  email        text not null check (email = lower(email)),
  name         text,
  province     text,
  status       text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','DECLINED')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  unique (agency_id, email)
);

create index idx_agency_invites_email on public.agency_invites(email) where status = 'PENDING';

alter table public.agency_invites enable row level security;

create policy "invites: agency manages own"
  on public.agency_invites for all
  using (agency_id = (select auth.uid()))
  with check (agency_id = (select auth.uid()) and (select public.is_agent()));

create policy "invites: invitee reads own"
  on public.agency_invites for select
  using (email = lower((select auth.jwt()) ->> 'email'));

-- Invitees respond through respond_to_agency_invite(), never directly.
revoke update on public.agency_invites from anon, authenticated;
grant update (name, province) on public.agency_invites to authenticated;

-- ── RPCs ────────────────────────────────────────────────────

create or replace function public.respond_to_agency_invite(p_invite_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_invite public.agency_invites;
begin
  select * into v_invite from public.agency_invites
  where id = p_invite_id
    and status = 'PENDING'
    and email = lower(auth.jwt() ->> 'email');

  if not found then
    raise exception 'Invite not found or already answered' using errcode = 'P0002';
  end if;

  update public.agency_invites
  set status = case when p_accept then 'ACCEPTED' else 'DECLINED' end,
      responded_at = now()
  where id = p_invite_id;

  if p_accept then
    update public.profiles
    set managed_by_agency_id = v_invite.agency_id
    where id = auth.uid();
  end if;
end;
$$;

-- Individual disconnects from their agency.
create or replace function public.leave_agency()
returns void language sql security definer set search_path = public as $$
  update public.profiles set managed_by_agency_id = null where id = auth.uid();
$$;

-- Agency releases one of its clients.
create or replace function public.release_client(p_client uuid)
returns void language sql security definer set search_path = public as $$
  update public.profiles set managed_by_agency_id = null
  where id = p_client and managed_by_agency_id = auth.uid();
$$;

-- The caller's agency, which profiles RLS would otherwise hide.
create or replace function public.my_agency()
returns table (id uuid, name text, organization_name text)
language sql stable security definer set search_path = public as $$
  select a.id, a.name, a.organization_name
  from public.profiles me
  join public.profiles a on a.id = me.managed_by_agency_id
  where me.id = auth.uid();
$$;

-- Pending invites addressed to the caller, with the inviting agency's name.
create or replace function public.my_pending_invites()
returns table (id uuid, agency_id uuid, agency_name text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select i.id, i.agency_id, coalesce(a.organization_name, a.name), i.created_at
  from public.agency_invites i
  join public.profiles a on a.id = i.agency_id
  where i.status = 'PENDING'
    and i.email = lower(auth.jwt() ->> 'email')
  order by i.created_at desc;
$$;

revoke all on function public.my_pending_invites() from public, anon;
grant execute on function public.my_pending_invites() to authenticated;
revoke all on function public.respond_to_agency_invite(uuid, boolean) from public, anon;
revoke all on function public.leave_agency() from public, anon;
revoke all on function public.release_client(uuid) from public, anon;
revoke all on function public.my_agency() from public, anon;
grant execute on function public.respond_to_agency_invite(uuid, boolean) to authenticated;
grant execute on function public.leave_agency() to authenticated;
grant execute on function public.release_client(uuid) to authenticated;
grant execute on function public.my_agency() to authenticated;

-- ── Agent access to roster data ─────────────────────────────

drop policy "jobs: agent read roster" on public.jobs;

create policy "jobs: agent manages roster"
  on public.jobs for all
  using (public.is_agent_of(user_id))
  with check (public.is_agent_of(user_id));

create policy "union_tracking: agent manages roster"
  on public.union_tracking for all
  using (public.is_agent_of(user_id))
  with check (public.is_agent_of(user_id));
