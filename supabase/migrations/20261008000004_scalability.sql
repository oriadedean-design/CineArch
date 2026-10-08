-- ============================================================
-- SCALABILITY
-- 1. RLS: wrap auth.uid() in a subselect so Postgres evaluates
--    it once per query instead of once per row.
-- 2. Missing indexes for RLS lookups and foreign keys.
-- 3. Offline-sync client_id unique per user, not globally.
-- 4. Finance totals computed in the database, filtered by year.
-- ============================================================

-- ── 1. RLS policies ─────────────────────────────────────────

drop policy "profiles: own read" on public.profiles;
create policy "profiles: own read" on public.profiles for select
  using ((select auth.uid()) = id);

drop policy "profiles: own update" on public.profiles;
create policy "profiles: own update" on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy "profiles: agent reads roster" on public.profiles;
create policy "profiles: agent reads roster" on public.profiles for select
  using (managed_by_agency_id = (select auth.uid()));

drop policy "jobs: own all" on public.jobs;
create policy "jobs: own all" on public.jobs for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "finance: own all" on public.finance_transactions;
create policy "finance: own all" on public.finance_transactions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "union_tracking: own all" on public.union_tracking;
create policy "union_tracking: own all" on public.union_tracking for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "documents: own all" on public.residency_documents;
create policy "documents: own all" on public.residency_documents for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "sessions: own read" on public.user_sessions;
create policy "sessions: own read" on public.user_sessions for select
  using ((select auth.uid()) = user_id);

drop policy "sessions: own delete" on public.user_sessions;
create policy "sessions: own delete" on public.user_sessions for delete
  using ((select auth.uid()) = user_id);

drop policy "sync_queue: own all" on public.sync_queue;
create policy "sync_queue: own all" on public.sync_queue for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "documents: upload own folder" on storage.objects;
create policy "documents: upload own folder" on storage.objects for insert
  with check (bucket_id = 'documents' and (select auth.uid())::text = (storage.foldername(name))[1]);

drop policy "documents: read own folder" on storage.objects;
create policy "documents: read own folder" on storage.objects for select
  using (bucket_id = 'documents' and (select auth.uid())::text = (storage.foldername(name))[1]);

drop policy "documents: delete own folder" on storage.objects;
create policy "documents: delete own folder" on storage.objects for delete
  using (bucket_id = 'documents' and (select auth.uid())::text = (storage.foldername(name))[1]);

drop policy "avatars: upload own" on storage.objects;
create policy "avatars: upload own" on storage.objects for insert
  with check (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

drop policy "avatars: delete own" on storage.objects;
create policy "avatars: delete own" on storage.objects for delete
  using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

-- ── 2. Indexes ──────────────────────────────────────────────

create index if not exists idx_profiles_managed_by on public.profiles(managed_by_agency_id)
  where managed_by_agency_id is not null;
create index if not exists idx_finance_job_id on public.finance_transactions(job_id)
  where job_id is not null;
create index if not exists idx_documents_user_id on public.residency_documents(user_id, uploaded_at desc);
create index if not exists idx_agency_invites_agency on public.agency_invites(agency_id);

-- ── 3. client_id unique per user ────────────────────────────

alter table public.jobs drop constraint jobs_client_id_key;
alter table public.jobs add constraint jobs_user_client_id_key unique (user_id, client_id);

alter table public.finance_transactions drop constraint finance_transactions_client_id_key;
alter table public.finance_transactions add constraint finance_user_client_id_key unique (user_id, client_id);

alter table public.union_tracking drop constraint union_tracking_client_id_key;
alter table public.union_tracking add constraint union_tracking_user_client_id_key unique (user_id, client_id);

alter table public.residency_documents drop constraint residency_documents_client_id_key;
alter table public.residency_documents add constraint documents_user_client_id_key unique (user_id, client_id);

-- ── 4. Finance totals ───────────────────────────────────────
-- Security invoker: RLS still applies, so callers only ever
-- aggregate rows they can already read.

create or replace function public.finance_stats(p_user_id uuid, p_year int default null)
returns table (
  gross_income         numeric,
  total_expenses       numeric,
  deductible_expenses  numeric,
  gst_collected        numeric,
  gst_paid             numeric
)
language sql stable security invoker set search_path = public as $$
  select
    coalesce(sum(amount_before_tax) filter (where type = 'INCOME'), 0),
    coalesce(sum(amount_before_tax) filter (where type = 'EXPENSE'), 0),
    coalesce(sum(coalesce(deductible_amount, amount_before_tax)) filter (where type = 'EXPENSE'), 0),
    coalesce(sum(tax_amount) filter (where type = 'INCOME'), 0),
    coalesce(sum(tax_amount) filter (where type = 'EXPENSE'), 0)
  from public.finance_transactions
  where user_id = p_user_id
    and date_incurred >= make_date(coalesce(p_year, extract(year from current_date)::int), 1, 1)
    and date_incurred <  make_date(coalesce(p_year, extract(year from current_date)::int) + 1, 1, 1);
$$;

revoke all on function public.finance_stats(uuid, int) from public, anon;
grant execute on function public.finance_stats(uuid, int) to authenticated;
