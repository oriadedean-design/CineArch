-- ACTRA Toronto Additional Background Performer (AABP) and the background
-- route to an Apprentice credit, from ACTRA Toronto's AABP page (voucher and
-- hours rules revised October 19, 2022).
--
-- Tiers can now say which work counts toward them:
--   province       the branch it applies to (null = everywhere the union is)
--   role_ids       only jobs in these roles count (empty = any role)
--   window_months  only work in the last N months counts
--   hours_rule     how a day's hours are counted ('actra_background': paid
--                  8-hour minimum, an hour off for lunch past 8, quarter hours)

alter table public.union_tiers
  add column province      text check (province is null or public.is_canadian_province(province)),
  add column role_ids      text[] not null default '{}',
  add column window_months int check (window_months is null or window_months > 0),
  add column hours_rule    text check (hours_rule is null or hours_rule in ('actra_background'));

-- Background tiers come first: AABP, then the background Apprentice route,
-- then the principal Apprentice and Full Member tiers already there.
update public.union_tiers set sort_order = sort_order + 2 where union_id = 'u-actra';

insert into public.union_tiers (union_id, sort_order, name, target_type, target_value, description, province, role_ids, window_months, hours_rule) values
  ('u-actra', 0, 'Additional Background Performer (AABP)', 'DAYS', 15,
   '15 days as a background performer on union productions in the 12 months before you apply. $30 initiation fee. AABP members pledge to work union productions only.',
   'Ontario', '{background-performer}', 12, null),
  ('u-actra', 1, 'Apprentice credit (background route)', 'HOURS', 1600,
   '1,600 background hours (200 days) worked as an AABP member earns your first Apprentice credit. Hours count from your AABP initiation date.',
   'Ontario', '{background-performer}', null, 'actra_background');

-- The old one-line background note is replaced by the full ACTRA Toronto rules.
delete from public.union_requirements
 where union_id = 'u-actra' and caucus = 'Background' and text like 'Additional Background Performer: 15 days%';

insert into public.union_requirements (union_id, kind, province, caucus, sort_order, text) values
  ('u-actra', 'requirement', 'Ontario', 'Background', 10, 'AABP: 15 work days as a background performer on union productions in the 12 months immediately before you apply'),
  ('u-actra', 'requirement', 'Ontario', 'Background', 11, 'AABP: proof of Canadian citizenship or permanent resident status (passport or birth certificate)'),
  ('u-actra', 'requirement', 'Ontario', 'Background', 12, 'AABP: $30 initiation fee'),
  ('u-actra', 'requirement', 'Ontario', 'Background', 13, 'AABP members pledge to perform only in union productions and may not be submitted for non-union work'),
  ('u-actra', 'requirement', 'Ontario', 'Background', 14, 'Apprentice credit, background route: 200 days or 1,600 background hours worked as an AABP member'),
  ('u-actra', 'application_step', 'Ontario', 'Background', 10, 'AABP: complete, print and sign the application form and email it to info@actratoronto.com with your 15 vouchers, proof of citizenship or PR status, and the $30 fee'),
  ('u-actra', 'application_step', 'Ontario', 'Background', 11, 'AABP vouchers: exactly 15, from the last 12 months, in date order (oldest first), fully legible, no duplicates and no non-union vouchers'),
  ('u-actra', 'application_step', 'Ontario', 'Background', 12, 'AABP vouchers: wardrobe calls and COVID testing do not count as work days. A lost or damaged voucher can be replaced by a pay stub or payroll report'),
  ('u-actra', 'application_step', 'Ontario', 'Background', 13, 'Apprentice (background route): send a computer-filled spreadsheet of your productions with numbered vouchers in the same order. The first 15 are the vouchers you joined on'),
  ('u-actra', 'application_step', 'Ontario', 'Background', 14, 'Counting hours: claim 8 if you were paid for 8; past 8, take an hour off each voucher for lunch; no travel, lunch or wardrobe time; union work only'),
  ('u-actra', 'application_step', 'Ontario', 'Background', 15, 'Rounding: hours go to the quarter hour (from January 2019, :06 rounds to .00, :12 and :18 to .25, :24, :30 and :36 to .50, :42 and :48 to .75, :54 to the next hour)'),
  ('u-actra', 'application_step', 'Ontario', 'Background', 16, 'ACTRA Toronto replies by email within two to three weeks. Applications short of 1,600 hours are not considered');

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
                   'province', t.province, 'roleIds', t.role_ids, 'windowMonths', t.window_months, 'hoursRule', t.hours_rule)
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
