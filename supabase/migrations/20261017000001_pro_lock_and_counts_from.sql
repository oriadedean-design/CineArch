-- 1. A-List Pro unlocks Wrap Wallet, the Vault and Ledger reports.
--    Anyone can still read, export and delete what they already saved;
--    adding or changing ledger entries and Vault files needs Pro (or Agency).
--    is_premium and plan are set server-side only (lock_profile_privileges).
-- 2. "AABP since": a tier can ask when you started counting (start_label),
--    and a tracked union stores that date (counts_from). Only work on or
--    after it counts. ACTRA's background route uses it for AABP initiation.

create or replace function public.has_pro()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_premium or p.plan in ('pro', 'agency') from public.profiles p where p.id = (select auth.uid())), false);
$$;
revoke all on function public.has_pro() from public, anon;
grant execute on function public.has_pro() to authenticated;

-- Wrap Wallet
drop policy "finance: own all" on public.finance_transactions;
create policy "finance: own read" on public.finance_transactions for select
  using ((select auth.uid()) = user_id);
create policy "finance: own delete" on public.finance_transactions for delete
  using ((select auth.uid()) = user_id);
create policy "finance: pro insert" on public.finance_transactions for insert
  with check ((select auth.uid()) = user_id and (select public.has_pro()));
create policy "finance: pro update" on public.finance_transactions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.has_pro()));

-- The Vault (document records and files)
drop policy "documents: own all" on public.residency_documents;
create policy "documents: own read" on public.residency_documents for select
  using ((select auth.uid()) = user_id);
create policy "documents: own delete" on public.residency_documents for delete
  using ((select auth.uid()) = user_id);
create policy "documents: pro insert" on public.residency_documents for insert
  with check ((select auth.uid()) = user_id and (select public.has_pro()));
create policy "documents: pro update" on public.residency_documents for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.has_pro()));

drop policy "documents: upload own folder" on storage.objects;
create policy "documents: upload own folder" on storage.objects for insert
  with check (bucket_id = 'documents' and (select auth.uid())::text = (storage.foldername(name))[1] and (select public.has_pro()));

-- AABP since
alter table public.union_tiers add column start_label text;
alter table public.union_tracking add column counts_from date;

update public.union_tiers set start_label = 'AABP since'
 where union_id = 'u-actra' and name = 'Apprentice credit (background route)';

create or replace function public.union_engine_snapshot()
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'version', (select version from union_engine_meta where id),
    'unions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id, 'name', u.name, 'scope', u.scope, 'description', u.description,
        'website', u.website, 'contactEmail', u.contact_email, 'contactPhone', u.contact_phone,
        'applicationFee', u.application_fee, 'applicationFeeNotes', u.application_fee_notes,
        'duesRate', u.dues_rate, 'duesNotes', u.dues_notes, 'residencyRule', u.residency_rule,
        'jurisdictionalNotes', u.jurisdictional_notes, 'memberBenefits', u.member_benefits,
        'needsVerification', u.needs_verification, 'sourceUrls', u.source_urls, 'lastVerified', u.last_verified,
        'jurisdictions', coalesce((
          select jsonb_agg(jsonb_build_object('province', j.province, 'region', j.region,
                   'contactEmail', j.contact_email, 'contactPhone', j.contact_phone,
                   'notes', j.notes, 'needsVerification', j.needs_verification) order by j.province, j.region nulls first)
          from union_jurisdictions j where j.union_id = u.id), '[]'::jsonb),
        'tiers', coalesce((
          select jsonb_agg(jsonb_build_object('name', t.name, 'targetType', t.target_type, 'targetValue', t.target_value,
                   'description', t.description, 'requiresDepartment', t.requires_department,
                   'province', t.province, 'roleIds', t.role_ids, 'windowMonths', t.window_months, 'hoursRule', t.hours_rule,
                   'startLabel', t.start_label)
                   order by t.sort_order, t.id)
          from union_tiers t where t.union_id = u.id), '[]'::jsonb),
        'requirements', coalesce((
          select jsonb_agg(jsonb_build_object('kind', q.kind, 'province', q.province, 'caucus', q.caucus, 'text', q.text)
                   order by q.kind, q.province nulls first, q.caucus nulls first, q.sort_order, q.id)
          from union_requirements q where q.union_id = u.id), '[]'::jsonb),
        'departments', coalesce((
          select jsonb_agg(d.name order by d.sort_order, d.id) from union_departments d where d.union_id = u.id), '[]'::jsonb)
      ) order by u.sort_order, u.name)
      from unions u where u.is_active), '[]'::jsonb),
    'departments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'name', d.name, 'code', d.code, 'description', d.description,
        'roles', coalesce((
          select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'code', r.code, 'description', r.description,
                   'requirements', r.requirements, 'aliases', r.aliases, 'isTrainee', r.is_trainee) order by r.sort_order, r.name)
          from roles r where r.department_id = d.id), '[]'::jsonb)
      ) order by d.sort_order, d.name)
      from departments d), '[]'::jsonb),
    'roleCoverage', coalesce((
      select jsonb_agg(jsonb_build_array(c.role_id, c.province, c.region, c.union_id, c.relationship, c.notes)
               order by c.role_id, c.province, c.region nulls first, c.sort_order, c.id)
      from role_coverage c join unions u on u.id = c.union_id and u.is_active), '[]'::jsonb),
    'departmentCoverage', coalesce((
      select jsonb_agg(jsonb_build_array(c.department_id, c.province, c.region, c.union_id, c.relationship, c.notes)
               order by c.department_id, c.province, c.region nulls first, c.sort_order, c.id)
      from department_coverage c join unions u on u.id = c.union_id and u.is_active), '[]'::jsonb),
    'rateSchedules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'unionId', s.union_id, 'title', s.title, 'productionType', s.production_type,
        'effectiveFrom', s.effective_from, 'effectiveTo', s.effective_to, 'columns', s.columns,
        'hourlyColumn', s.hourly_column, 'dailyColumn', s.daily_column,
        'rateUnit', s.rate_unit, 'sourceUrl', s.source_url, 'notes', s.notes,
        -- role ids with a minimum in this schedule, so the app knows which schedules to load lines for
        'roleIds', coalesce((select jsonb_agg(distinct l.role_id) from rate_lines l
                             where l.schedule_id = s.id and l.role_id is not null), '[]'::jsonb)
      ) order by s.union_id, s.effective_from desc, s.production_type nulls first, s.id)
      from rate_schedules s join unions u on u.id = s.union_id and u.is_active), '[]'::jsonb),
    'payRules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'unionId', p.union_id, 'title', p.title, 'departmentId', p.department_id,
        'minimumCallHours', p.minimum_call_hours, 'overtimeAfter', p.overtime_after,
        'overtimeMultipliers', p.overtime_multipliers, 'incrementMinutes', p.increment_minutes,
        'mealBreakNotes', p.meal_break_notes, 'notes', p.notes,
        'needsVerification', p.needs_verification, 'sourceUrl', p.source_url
      ) order by p.union_id, p.department_id nulls first, p.sort_order)
      from pay_rules p join unions u on u.id = p.union_id and u.is_active), '[]'::jsonb)
  );
$$;
