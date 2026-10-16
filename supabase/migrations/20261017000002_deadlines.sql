-- Dates people plan around (Your Wrap > Coming up): tax and, later, union
-- dues and renewals. Every row cites the page it came from; rows are edited
-- in the dashboard, never invented. Repeats every year on month/day.
--
-- applies_to says who sees it:
--   self_employed   everyone logging film work
--   instalments     only if they pay tax by instalments
--   gst_registered  only if they're registered for GST/HST
--   union_member    members of union_id (dues, renewals)

create table public.deadlines (
  id          text primary key,
  title       text not null,
  month       int  not null check (month between 1 and 12),
  day         int  not null check (day between 1 and 31),
  applies_to  text not null check (applies_to in ('self_employed', 'instalments', 'gst_registered', 'union_member')),
  province    text check (province is null or public.is_canadian_province(province)),
  union_id    text references public.unions(id) on update cascade on delete cascade,
  detail      text,
  source_url  text not null,
  checked_on  date not null,
  updated_at  timestamptz not null default now()
);

create trigger deadlines_bump_version after insert or update or delete or truncate on public.deadlines
  for each statement execute function public.bump_union_engine_version();
create trigger deadlines_touch before update on public.deadlines
  for each row execute function public.touch_updated_at();
alter table public.deadlines enable row level security;
create policy "engine: public read" on public.deadlines for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.deadlines from anon, authenticated;

-- CRA, checked 2026-10-17 on the pages cited. Weekend and holiday shifts are
-- not applied (the pages opened don't state the rule).
insert into public.deadlines (id, title, month, day, applies_to, detail, source_url, checked_on) values
  ('cra-balance-owing', 'Pay any income tax you owe', 4, 30, 'self_employed',
   'Your balance owing for last year is due by April 30, even though self-employed people file by June 15.',
   'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/important-dates-individuals.html', '2026-10-17'),
  ('cra-file-self-employed', 'File your tax return (self-employed)', 6, 15, 'self_employed',
   'Deadline to file if you or your spouse or common-law partner are self-employed.',
   'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/important-dates-individuals.html', '2026-10-17'),
  ('cra-instalment-mar', 'Tax instalment', 3, 15, 'instalments',
   'Only if your net tax owing is more than $3,000 ($1,800 in Quebec) this year and in either of the two years before.',
   'https://www.canada.ca/en/revenue-agency/services/payments/payments-cra/individual-payments/income-tax-instalments.html', '2026-10-17'),
  ('cra-instalment-jun', 'Tax instalment', 6, 15, 'instalments',
   'Only if your net tax owing is more than $3,000 ($1,800 in Quebec) this year and in either of the two years before.',
   'https://www.canada.ca/en/revenue-agency/services/payments/payments-cra/individual-payments/income-tax-instalments.html', '2026-10-17'),
  ('cra-instalment-sep', 'Tax instalment', 9, 15, 'instalments',
   'Only if your net tax owing is more than $3,000 ($1,800 in Quebec) this year and in either of the two years before.',
   'https://www.canada.ca/en/revenue-agency/services/payments/payments-cra/individual-payments/income-tax-instalments.html', '2026-10-17'),
  ('cra-instalment-dec', 'Tax instalment', 12, 15, 'instalments',
   'Only if your net tax owing is more than $3,000 ($1,800 in Quebec) this year and in either of the two years before.',
   'https://www.canada.ca/en/revenue-agency/services/payments/payments-cra/individual-payments/income-tax-instalments.html', '2026-10-17'),
  ('cra-gst-annual-pay', 'Pay your GST/HST (annual filers)', 4, 30, 'gst_registered',
   'Individuals with business income and a December 31 year-end who file GST/HST once a year.',
   'https://www.canada.ca/en/services/taxes/resources-for-small-and-medium-businesses/2026-tax-deadlines-canadian-businesses-self-employed-individuals.html', '2026-10-17'),
  ('cra-gst-annual-file', 'File your GST/HST return (annual filers)', 6, 15, 'gst_registered',
   'Individuals with business income and a December 31 year-end who file GST/HST once a year.',
   'https://www.canada.ca/en/services/taxes/resources-for-small-and-medium-businesses/2026-tax-deadlines-canadian-businesses-self-employed-individuals.html', '2026-10-17');

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
