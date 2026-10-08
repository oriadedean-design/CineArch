-- ============================================================
-- SCHEMA ALIGNMENT
-- Fills gaps between the app's data model (types.ts) and the
-- schema, and makes signup record the chosen account type.
-- ============================================================

-- The job form has no company field; don't reject jobs without one.
alter table public.jobs alter column company_name set default '';

-- Fields collected by enterprise onboarding (training institutions).
alter table public.profiles
  add column if not exists cohort_year  text,
  add column if not exists program_name text;

-- Signup passes account_type in user metadata; persist it on the profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, account_type, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'account_type' = 'AGENT' then 'AGENT' else 'INDIVIDUAL' end,
    case when new.raw_user_meta_data->>'account_type' = 'AGENT' then 'Agent' else 'Member' end
  );
  return new;
end;
$$;
