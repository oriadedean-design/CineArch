-- ============================================================
-- SYNC ONLINE IS A-LIST PRO
-- Free (Indie) accounts keep their jobs and union tracking on
-- their phone; only Pro accounts save them online (for the
-- website, iPad and other phones). Reading and deleting stay
-- open so a free account can bring its old rows down to the
-- phone and delete its account. Agents' roster policies are
-- unchanged.
-- ============================================================

drop policy "jobs: own all" on public.jobs;
create policy "jobs: own read" on public.jobs for select
  using ((select auth.uid()) = user_id);
create policy "jobs: own delete" on public.jobs for delete
  using ((select auth.uid()) = user_id);
create policy "jobs: pro insert" on public.jobs for insert
  with check ((select auth.uid()) = user_id and (select public.has_pro()));
create policy "jobs: pro update" on public.jobs for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.has_pro()));

drop policy "union_tracking: own all" on public.union_tracking;
create policy "union_tracking: own read" on public.union_tracking for select
  using ((select auth.uid()) = user_id);
create policy "union_tracking: own delete" on public.union_tracking for delete
  using ((select auth.uid()) = user_id);
create policy "union_tracking: pro insert" on public.union_tracking for insert
  with check ((select auth.uid()) = user_id and (select public.has_pro()));
create policy "union_tracking: pro update" on public.union_tracking for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.has_pro()));
