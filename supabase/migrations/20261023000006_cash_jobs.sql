-- Cash jobs: on an ACTRA or UBCP/ACTRA production, a non-member background
-- performer can be hired "cash", at the production's non-union rate, once the
-- production has its minimum count of union-rate background performers
-- (ACTRA Toronto, "ACTRA at a glance"). Those days count toward the
-- background categories (AABP, UBCP Background Member) because the production
-- is union; vouchers from non-union productions don't (Dean, 2026-10-23,
-- reading ACTRA Toronto's AABP page). Crew non-members work on a permit.
--
-- jobs.hired_as records how the person was hired on a union production,
-- as they tell us:  union | cash   (unions.allows_cash: ACTRA, UBCP/ACTRA)
--                   member | permit (every other union)
-- A cash day is paid at the person's own rate: no union minimum or overtime.

alter table public.unions add column allows_cash boolean not null default false;
update public.unions set allows_cash = true where id in ('u-actra', 'u-ubcp');

alter table public.jobs add column hired_as text
  check (hired_as is null or hired_as in ('union', 'cash', 'member', 'permit'));
comment on column public.jobs.hired_as is
  'How the person was hired on a union production, as they told us: union or cash (ACTRA, UBCP/ACTRA), member or permit (other unions). Null on non-union productions.';
alter table public.jobs add constraint jobs_hired_as_union check (hired_as is null or is_union) not valid;

-- The engine snapshot carries allowsCash so the apps know when to offer Cash.
create or replace function public.union_engine_snapshot()
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'version', (select version from union_engine_meta where id),
    'unions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id, 'name', u.name, 'scope', u.scope, 'allowsCash', u.allows_cash, 'description', u.description,
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
                   'startLabel', t.start_label, 'countsWork', t.counts_work, 'minProductions', t.min_productions,
                   'shortDayHours', t.short_day_hours, 'shortDayInclusive', t.short_day_inclusive,
                   'excludeRoleIds', t.exclude_role_ids, 'sourceUrl', t.source_url, 'checkedOn', t.checked_on,
                   'confirmed', t.confirmed)
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
    'deadlines', coalesce((
      select jsonb_agg(jsonb_build_object('id', d.id, 'title', d.title, 'month', d.month, 'day', d.day,
               'appliesTo', d.applies_to, 'province', d.province, 'unionId', d.union_id, 'detail', d.detail,
               'sourceUrl', d.source_url, 'checkedOn', d.checked_on) order by d.month, d.day, d.id)
      from deadlines d), '[]'::jsonb),
    'rateSchedules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'unionId', s.union_id, 'title', s.title, 'productionType', s.production_type,
        'effectiveFrom', s.effective_from, 'effectiveTo', s.effective_to, 'columns', s.columns,
        'hourlyColumn', s.hourly_column, 'dailyColumn', s.daily_column,
        'rateUnit', s.rate_unit, 'sourceUrl', s.source_url, 'notes', s.notes,
        'roleIds', coalesce((select jsonb_agg(distinct l.role_id) from rate_lines l
                             where l.schedule_id = s.id and l.role_id is not null), '[]'::jsonb)
      ) order by s.union_id, s.effective_from desc, s.production_type nulls first, s.id)
      from rate_schedules s join unions u on u.id = s.union_id and u.is_active), '[]'::jsonb),
    'payRules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'unionId', p.union_id, 'title', p.title, 'departmentId', p.department_id,
        'minimumCallHours', p.minimum_call_hours, 'overtimeAfter', p.overtime_after,
        'overtimeMultipliers', p.overtime_multipliers, 'incrementMinutes', p.increment_minutes,
        'overtimeBase', p.overtime_base, 'sixthDay', p.sixth_day, 'seventhDay', p.seventh_day,
        'vacationPayRate', p.vacation_pay_rate,
        'mealBreakNotes', p.meal_break_notes, 'notes', p.notes,
        'needsVerification', p.needs_verification, 'sourceUrl', p.source_url
      ) order by p.union_id, p.department_id nulls first, p.sort_order)
      from pay_rules p join unions u on u.id = p.union_id and u.is_active), '[]'::jsonb),
    'tax', jsonb_build_object(
      'jurisdictions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'year', t.year, 'code', t.code, 'province', t.province, 'brackets', t.brackets,
          'basicAmount', t.basic_amount, 'basicAmountPhaseout', t.basic_amount_phaseout, 'surtax', t.surtax,
          'healthPremium', t.health_premium, 'taxReductionBase', t.tax_reduction_base,
          'federalAbatement', t.federal_abatement, 'sourceUrl', t.source_url, 'checkedOn', t.checked_on,
          'notes', t.notes, 'needsVerification', t.needs_verification) order by t.year, t.code)
        from tax_jurisdictions t), '[]'::jsonb),
      'pensionPlans', coalesce((
        select jsonb_agg(jsonb_build_object(
          'year', p.year, 'code', p.code, 'exemption', p.exemption, 'ympe', p.ympe, 'yampe', p.yampe,
          'baseRate', p.base_rate, 'firstAdditionalRate', p.first_additional_rate, 'secondRate', p.second_rate,
          'sourceUrl', p.source_url, 'checkedOn', p.checked_on) order by p.year, p.code)
        from pension_plans p), '[]'::jsonb),
      'salesTax', coalesce((
        select jsonb_agg(jsonb_build_object(
          'year', s.year, 'province', s.province, 'gstHstRate', s.gst_hst_rate, 'quickServiceRate', s.quick_service_rate,
          'quickCreditRate', s.quick_credit_rate, 'quickCreditLimit', s.quick_credit_limit,
          'sourceUrl', s.source_url, 'checkedOn', s.checked_on, 'notes', s.notes) order by s.year, s.province)
        from sales_tax s), '[]'::jsonb)
    )
  );
$$;
