-- Onboarding emails and Resend segmentation.
--
-- The database decides who is due which email (email_due) and whose details
-- changed (email_contacts_due); the email-lifecycle Edge Function sends them
-- through Resend every 15 minutes and records what it sent. Only that function
-- (service role) can call these: no client can read the queue or the log.
--
-- Emails, once each per person, only for accounts made after this launches:
--   welcome         email confirmed
--   scene_reminder  24 h after sign-up, Setting the Scene not done (within 7 days)
--   first_week      24 h after Setting the Scene; copy depends on member status
--   pro_welcome     on going A-List Pro
-- Anyone can stop them: profiles.email_tips (Account / Settings, or the
-- unsubscribe link). Sign-up and password emails are separate (Supabase Auth).

-- When things happened, for the timing above.
alter table public.profiles add column onboarded_at timestamptz;
alter table public.profiles add column pro_since    timestamptz;
alter table public.profiles add column email_tips   boolean not null default true;
update public.profiles set onboarded_at = coalesce(updated_at, created_at) where is_onboarded and onboarded_at is null;
update public.profiles set pro_since    = coalesce(updated_at, created_at) where is_premium  and pro_since    is null;
grant update (email_tips) on public.profiles to authenticated;

create or replace function public.profile_milestones()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_onboarded and (tg_op = 'INSERT' or not old.is_onboarded) and new.onboarded_at is null then new.onboarded_at := now(); end if;
  if new.is_premium   and (tg_op = 'INSERT' or not old.is_premium)   then new.pro_since := now(); end if;
  return new;
end $$;
create trigger trg_profiles_milestones before insert or update of is_onboarded, is_premium on public.profiles
  for each row execute function public.profile_milestones();
revoke execute on function public.profile_milestones() from public, anon, authenticated;

-- One row: when the onboarding emails start (earlier accounts don't get them).
create table public.email_settings (
  id                  boolean primary key default true check (id),
  lifecycle_starts_at timestamptz not null default now()
);
insert into public.email_settings default values;

-- What was sent to whom; one of each kind per person.
create table public.email_log (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  kind      text not null check (kind in ('welcome', 'scene_reminder', 'first_week', 'pro_welcome')),
  sent_at   timestamptz not null default now(),
  resend_id text,
  primary key (user_id, kind)
);

-- The details last sent to Resend for each person, so only changes are synced.
create table public.email_contacts (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  props_hash text not null,
  synced_at  timestamptz not null default now()
);

-- Deleted accounts whose Resend contact still has to be removed.
create table public.email_forget (
  email        text primary key,
  requested_at timestamptz not null default now()
);

alter table public.email_settings enable row level security;
alter table public.email_log      enable row level security;
alter table public.email_contacts enable row level security;
alter table public.email_forget   enable row level security;
revoke all on public.email_settings, public.email_log, public.email_contacts, public.email_forget from anon, authenticated;

create or replace function public.profile_forget_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.email is not null and exists (select 1 from public.email_contacts c where c.user_id = old.id) then
    insert into public.email_forget (email) values (lower(old.email)) on conflict do nothing;
  end if;
  return old;
end $$;
create trigger trg_profiles_forget_email before delete on public.profiles
  for each row execute function public.profile_forget_email();
revoke execute on function public.profile_forget_email() from public, anon, authenticated;

-- What Resend knows about each person, for segments and personalising.
create or replace view public.email_contact_details with (security_invoker = true) as
select p.id as user_id, lower(u.email) as email,
       nullif(split_part(trim(coalesce(p.name, '')), ' ', 1), '') as first_name,
       jsonb_build_object(
         'plan',          case when p.is_premium then 'pro' else 'indie' end,
         'member_status', coalesce(p.member_status, 'ASPIRING'),
         'province',      coalesce(p.province, ''),
         'department',    coalesce(p.department, ''),
         'role',          coalesce(p.selected_roles[1], p.role, ''),
         'onboarded',     case when p.is_onboarded then 'yes' else 'no' end,
         'pay_type',      coalesce(p.pay_type, ''),
         'has_agent',     case when exists (select 1 from public.representatives r where r.user_id = p.id) then 'yes' else 'no' end,
         'signed_up',     to_char(u.created_at at time zone 'America/Toronto', 'YYYY-MM-DD')
       ) as props,
       not p.email_tips as unsubscribed
from public.profiles p
join auth.users u on u.id = p.id
where u.email_confirmed_at is not null and u.email is not null and coalesce(p.account_type, 'INDIVIDUAL') <> 'AGENT';
revoke all on public.email_contact_details from anon, authenticated;

-- People whose details changed since they were last sent to Resend.
create or replace function public.email_contacts_due(p_limit int default 200)
returns table (user_id uuid, email text, first_name text, props jsonb, unsubscribed boolean, props_hash text)
language sql stable security definer set search_path = public, auth as $$
  select d.user_id, d.email, d.first_name, d.props, d.unsubscribed,
         md5(d.props::text || d.unsubscribed::text || coalesce(d.first_name, '') || d.email) as props_hash
  from public.email_contact_details d
  left join public.email_contacts c on c.user_id = d.user_id
  where c.props_hash is distinct from md5(d.props::text || d.unsubscribed::text || coalesce(d.first_name, '') || d.email)
  limit p_limit;
$$;

create or replace function public.email_contact_synced(p_user uuid, p_hash text)
returns void language sql security definer set search_path = public as $$
  insert into public.email_contacts (user_id, props_hash) values (p_user, p_hash)
  on conflict (user_id) do update set props_hash = excluded.props_hash, synced_at = now();
$$;

-- Who is due which onboarding email right now (p_now is for tests).
create or replace function public.email_due(p_now timestamptz default now())
returns table (user_id uuid, email text, first_name text, kind text, member_status text, province text)
language sql stable security definer set search_path = public, auth as $$
  with s as (select lifecycle_starts_at as starts from public.email_settings),
  people as (
    select p.id, lower(u.email) as email, nullif(split_part(trim(coalesce(p.name, '')), ' ', 1), '') as first_name,
           u.created_at, p.is_onboarded, p.onboarded_at, p.is_premium, p.pro_since,
           coalesce(p.member_status, 'ASPIRING') as member_status, p.province
    from public.profiles p join auth.users u on u.id = p.id, s
    where u.email_confirmed_at is not null and u.email is not null and p.email_tips
      and coalesce(p.account_type, 'INDIVIDUAL') <> 'AGENT'
      and u.created_at >= s.starts
  ),
  due as (
    select id, 'welcome' as kind from people
    union all
    select id, 'scene_reminder' from people
      where not is_onboarded and created_at <= p_now - interval '24 hours' and created_at > p_now - interval '7 days'
        and exists (select 1 from public.email_log l where l.user_id = people.id and l.kind = 'welcome')
    union all
    select id, 'first_week' from people
      where is_onboarded and onboarded_at <= p_now - interval '24 hours'
    union all
    select id, 'pro_welcome' from people where is_premium and pro_since is not null
  )
  select p.id, p.email, p.first_name, d.kind, p.member_status, p.province
  from due d join people p on p.id = d.id
  where not exists (select 1 from public.email_log l where l.user_id = d.id and l.kind = d.kind)
  order by p.id, array_position(array['welcome', 'scene_reminder', 'first_week', 'pro_welcome'], d.kind);
$$;

create or replace function public.email_sent(p_user uuid, p_kind text, p_resend_id text)
returns void language sql security definer set search_path = public as $$
  insert into public.email_log (user_id, kind, resend_id) values (p_user, p_kind, p_resend_id)
  on conflict (user_id, kind) do nothing;
$$;

-- The unsubscribe link: stops onboarding emails for one person.
create or replace function public.email_unsubscribe(p_user uuid)
returns void language sql security definer set search_path = public as $$
  update public.profiles set email_tips = false where id = p_user;
$$;

create or replace function public.email_forgotten(p_email text)
returns void language sql security definer set search_path = public as $$
  delete from public.email_forget where email = lower(p_email);
$$;

do $$
declare f text;
begin
  foreach f in array array['email_contacts_due(int)', 'email_contact_synced(uuid,text)', 'email_due(timestamptz)',
                           'email_sent(uuid,text,text)', 'email_unsubscribe(uuid)', 'email_forgotten(text)'] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
grant select on public.email_forget to service_role;
