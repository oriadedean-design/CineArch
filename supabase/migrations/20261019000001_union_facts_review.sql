-- Union facts review, checked online on 2026-10-19 against each union's own
-- pages (sources on every row). Corrects targets, dues and fees that didn't
-- match, adds the routes that were missing, and stores the whole counting rule
-- for each step instead of a single number.
--
-- New on union_tiers:
--   counts_work          'union' = only days on that union's productions;
--                        'any'   = relevant work anywhere (permit steps)
--   requires_department  (existing) now means: only work in the department,
--                        category or position you're going for counts
--   min_productions      at least this many different productions
--   short_day_hours      a day this short counts as half a day
--   short_day_inclusive  true = "this many hours or less", false = "under"
--   exclude_role_ids     work in these roles never counts (background
--                        permits toward ACTRA/UBCP credits)
--   source_url, checked_on, confirmed
--                        a step with no published source is shown as
--                        unconfirmed, never as a firm goal
--
-- New on pay_rules:
--   overtime_base        'rate' = your hourly rate; 'daily_fee' = the daily
--                        fee divided by 8 (ACTRA IPA)

alter table public.union_tiers
  add column counts_work         text not null default 'union' check (counts_work in ('union', 'any')),
  add column min_productions     int check (min_productions is null or min_productions > 1),
  add column short_day_hours     numeric(4,2) check (short_day_hours is null or short_day_hours > 0),
  add column short_day_inclusive boolean not null default false,
  add column exclude_role_ids    text[] not null default '{}',
  add column source_url          text,
  add column checked_on          date,
  add column confirmed           boolean not null default false;

alter table public.pay_rules
  add column overtime_base text not null default 'rate' check (overtime_base in ('rate', 'daily_fee'));

-- ------------------------------------------------------------------
-- ACTRA (national, Toronto)
-- ------------------------------------------------------------------
update public.unions set
  application_fee_notes = '$75 Apprentice administration fee, paid yearly. Full membership has a one-time $1,600 initiation fee; permit fees and the first $75 Apprentice fee come off it.',
  source_urls = array['https://www.actra.ca/join', 'https://actratoronto.com/actra-additional-background-performer-aabp/',
                      'https://actratoronto.com/apprentice-program/', 'https://actratoronto.com/pay-your-dues'],
  last_verified = '2026-10-19'
where id = 'u-actra';

update public.union_tiers set
  description = '15 days as a background performer on union productions in the 12 months before you apply. $30 to join and $30 a year. AABP members pledge to work union productions only.',
  source_url = 'https://actratoronto.com/actra-additional-background-performer-aabp/', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-actra' and name = 'Additional Background Performer (AABP)';

update public.union_tiers set
  source_url = 'https://actratoronto.com/actra-additional-background-performer-aabp/', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-actra' and name = 'Apprentice credit (background route)';

update public.union_tiers set
  description = 'One qualifying work permit (a principal, acting or stunt role; one permit is one credit, however many days it covers), or a recognized acting program in the past year. Background permits don''t count, except the one credit earned through the background route.',
  exclude_role_ids = '{background-performer}',
  source_url = 'https://www.actra.ca/join', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-actra' and name = 'Apprentice';

update public.union_tiers set
  description = 'Three qualifying work permits or credits. Background permits don''t count. After your third qualifying permit you must join as a Full member.',
  exclude_role_ids = '{background-performer}',
  source_url = 'https://www.actra.ca/join/work-permit-cap/', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-actra' and name = 'Full Member';

-- ------------------------------------------------------------------
-- UBCP/ACTRA: dues were 2.5% (wrong), the $100 fee isn't published,
-- and the background route was missing.
-- ------------------------------------------------------------------
update public.unions set
  dues_rate = 0.0225,
  dues_notes = 'Working dues are 2.25% of gross, capped at $4,000 a year. Annual dues are due March 31, with a 10% late fee from April 1.',
  application_fee = null,
  application_fee_notes = 'The initiation fee isn''t posted. Reinstatement costs $1,600, and CAEA members get $475 off the initiation fee.',
  needs_verification = array['initiation fee'],
  source_urls = array['https://ubcpactra.ca/how-to-join/', 'https://ubcpactra.ca/dues/', 'https://ubcpactra.ca/faqs/'],
  last_verified = '2026-10-19'
where id = 'u-ubcp';

update public.union_tiers set sort_order = sort_order + 2 where union_id = 'u-ubcp';

insert into public.union_tiers (union_id, sort_order, name, target_type, target_value, description, province, role_ids,
                                window_months, source_url, checked_on, confirmed) values
  ('u-ubcp', 0, 'Background Member', 'DAYS', 15,
   '15 days as a background performer on UBCP/ACTRA productions in the 12 months before you apply.',
   'British Columbia', '{background-performer}', 12, 'https://ubcpactra.ca/how-to-join/', '2026-10-19', true),
  ('u-ubcp', 1, 'Apprentice credit (background route)', 'HOURS', 1600,
   '1,600 hours or 200 days of background work earns your first credit.',
   'British Columbia', '{background-performer}', null, 'https://ubcpactra.ca/how-to-join/', '2026-10-19', true);

update public.union_tiers set
  description = 'One qualifying work permit (one permit is one credit), an eligible acting program within the past year, or a reciprocal agreement. Background permits don''t count, except the one credit earned through the background route.',
  exclude_role_ids = '{background-performer}',
  source_url = 'https://ubcpactra.ca/how-to-join/', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-ubcp' and name = 'Apprentice';

update public.union_tiers set
  description = 'Three qualifying credits. Credits after the first must be acting credits; background permits don''t count.',
  exclude_role_ids = '{background-performer}',
  source_url = 'https://ubcpactra.ca/how-to-join/', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-ubcp' and name = 'Full Member';

-- ------------------------------------------------------------------
-- IATSE 873: about 120 days in the department (was 90). Dues and
-- initiation fee aren't posted (were 4.5% and $200).
-- ------------------------------------------------------------------
update public.unions set
  dues_rate = null,
  dues_notes = 'Permittees pay no dues; a 6% administration fee comes off every cheque. Member dues aren''t posted.',
  application_fee = null, application_fee_notes = 'The initiation fee isn''t posted.',
  needs_verification = array['dues rate', 'initiation fee'],
  source_urls = array['https://www.iatse873.com/faq', 'https://iatse873.com/apply-iatse-873'],
  last_verified = '2026-10-19'
where id = 'u-873';

update public.union_tiers set
  target_value = 120, requires_department = true,
  description = 'Approximately 120 days in the craft or department you apply to, plus letters from three 873 members. Department committees review applications twice a year. As of October 2026, 873 says it is not accepting permit applications.',
  source_url = 'https://www.iatse873.com/faq', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-873' and name = 'Member';

insert into public.union_requirements (union_id, kind, sort_order, text) values
  ('u-873', 'requirement', 20, 'About 120 days in the craft or department you apply to'),
  ('u-873', 'requirement', 21, 'Letters of recommendation from three IATSE 873 members'),
  ('u-873', 'application_step', 20, 'Department committees review applications twice a year'),
  ('u-873', 'application_step', 21, 'As of October 2026, 873 is not accepting permit applications');

-- ------------------------------------------------------------------
-- IATSE 411: each caucus has its own policy. The 120-day target had no
-- source; replaced with the published Craft Service policy.
-- ------------------------------------------------------------------
update public.unions set
  dues_rate = null,
  dues_notes = 'Base dues are $500 a year. Working dues aren''t posted.',
  application_fee = 150,
  application_fee_notes = '$150 to apply as a permittee, then $100 initiation.',
  needs_verification = array['working dues rate', 'policies for caucuses other than Craft Service'],
  source_urls = array['https://iatse411.ca/_files/ugd/d71670_2819d195528d44d19ce3f3f1ce16b3f6.pdf'],
  last_verified = '2026-10-19'
where id = 'u-411';

update public.union_tracking set tier_label = 'Member (Craft Service)'
where union_type_id = 'u-411' and tier_label = 'Member';

update public.union_tiers set
  name = 'Member (Craft Service)', target_value = 70, requires_department = true,
  description = 'Craft Service caucus (2018 policy): 70 days as a 14-hour key or assistant, plus 5 days as daily background craft. Other caucuses have their own policies.',
  source_url = 'https://iatse411.ca/_files/ugd/d71670_2819d195528d44d19ce3f3f1ce16b3f6.pdf', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-411' and name = 'Member';

-- ------------------------------------------------------------------
-- ICG 669: 100 paid days in the category over 3 years (was 60).
-- ------------------------------------------------------------------
update public.unions set
  dues_rate = 0.02,
  dues_notes = 'Base dues are $500 a year, plus 2% working dues.',
  application_fee = 50,
  application_fee_notes = '$50 to apply. Initiation runs $1,200 to $6,000 by category: $1,800 for a 2nd AC, $2,500 for a 1st AC, $6,000 for a DOP.',
  needs_verification = array['stills day count'],
  source_urls = array['https://icg669.com/wp-content/uploads/2026/08/APPLICATION-PKG-2021-9.pdf', 'https://icg669.com/about-us'],
  last_verified = '2026-10-19'
where id = 'u-669';

update public.union_tiers set
  target_value = 100, window_months = 36, requires_department = true,
  description = '100 paid days in your category over the last 3 years. Only days with permit approval count. Stills has its own count.',
  source_url = 'https://icg669.com/wp-content/uploads/2026/08/APPLICATION-PKG-2021-9.pdf', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-669' and name = 'Member';

-- ------------------------------------------------------------------
-- IATSE 849: 2% dues, $200 to apply. Non-union hours can be accepted.
-- ------------------------------------------------------------------
update public.unions set
  dues_rate = 0.02,
  dues_notes = 'Working dues are 2%. Quarterly dues of $100 are due January 1, April 1, July 1 and October 1.',
  application_fee = 200,
  application_fee_notes = '$100 processing plus $100 first-quarter dues, then $100 a quarter.',
  residency_rule = 'Six months'' residency in a Maritime province.',
  needs_verification = '{}',
  source_urls = array['https://iatse849.com/membership/application', 'https://iatse849.com/membership/resources/dues',
                      'https://iatse849.com/membership/resources/faqs'],
  last_verified = '2026-10-19'
where id = 'u-849';

update public.union_tiers set
  counts_work = 'any', requires_department = true, min_productions = 3,
  description = 'At least 360 paid hours in each department you apply for, over three different productions. Non-union hours can be accepted if the Executive Board approves.',
  source_url = 'https://iatse849.com/membership/application', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-849' and name = 'Member';

-- ------------------------------------------------------------------
-- IATSE 856: 2% members, 7% permittees, $500 a year. One department;
-- a call of 4 hours or less is half a day.
-- ------------------------------------------------------------------
update public.unions set
  dues_rate = 0.02,
  dues_notes = 'Working dues are 2% for members and 7% for permittees. Members also pay $500 a year.',
  needs_verification = '{}',
  source_urls = array['https://iatse856.com/?p=403', 'https://iatse856.com/wp-content/uploads/2023/07/Permittee-Information-Booklet-202260.pdf'],
  last_verified = '2026-10-19'
where id = 'u-856';

update public.union_tiers set
  requires_department = true, min_productions = 2, short_day_hours = 4, short_day_inclusive = true,
  description = '60 days in one department on 2 or more IATSE 856 productions. A call of 4 hours or less counts as half a day.',
  source_url = 'https://iatse856.com/?p=403', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-856' and name = 'Member';

-- ------------------------------------------------------------------
-- AQTIS 514: membership needs no days; days count toward being
-- recognized in a position (90 for a camera assistant).
-- ------------------------------------------------------------------
update public.unions set
  dues_rate = 0.025,
  dues_notes = 'Members pay 2.5%. Permittees pay 2.5% plus a 7.5% permit fee, or 12.5% on U.S. productions.',
  application_fee_notes = 'First year: $450 AQTIS 514 IATSE file opening and $100 IATSE file opening (both once), plus $300 annual dues.',
  needs_verification = array['days required for each position'],
  source_urls = array['https://aqtis514iatse.com/en/faq/', 'https://aqtis514iatse.com/en/become-member/',
                      'https://aqtis514iatse.com/en/departments/light-video/'],
  last_verified = '2026-10-19'
where id = 'u-aqtis';

update public.union_tracking set tier_label = 'Recognized in a position'
where union_type_id = 'u-aqtis' and tier_label = 'Permittee';

update public.union_tiers set
  name = 'Recognized in a position', requires_department = true, min_productions = 2, short_day_hours = 5,
  description = 'Membership itself needs no days. Days count toward being recognized in a position: 90 for a camera assistant, other positions differ (120 for an ENG DOP), on 2 or more productions. A day under 5 hours is half a credit.',
  source_url = 'https://aqtis514iatse.com/en/faq/', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-aqtis' and name = 'Permittee';

insert into public.union_requirements (union_id, kind, sort_order, text) values
  ('u-aqtis', 'requirement', 1, 'Membership needs no days of work: take the Initiation to Community Life course and pay the fees');

-- ------------------------------------------------------------------
-- NABET 700-M: permittees pay 7%. The member step was missing.
-- ------------------------------------------------------------------
update public.unions set
  dues_rate = null,
  dues_notes = 'Permittees pay 7% of gross pay. Member dues aren''t posted.',
  application_fee = null, application_fee_notes = null,
  needs_verification = array['member dues', 'application fee'],
  source_urls = array['https://nabet700.com/permittees.html', 'https://nabet700.com/permittee-status.html'],
  last_verified = '2026-10-19'
where id = 'u-nabet';

update public.union_tiers set
  counts_work = 'any', requires_department = true,
  source_url = 'https://nabet700.com/permittee-status.html', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-nabet' and name = 'Permittee';

insert into public.union_tiers (union_id, sort_order, name, target_type, target_value, description, requires_department,
                                source_url, checked_on, confirmed) values
  ('u-nabet', 1, 'Member', 'EARNINGS', 28571.43,
   'Once you''ve paid $2,000 in permittee fees in one department, the union reviews your file. At 7%, that''s about $28,571 of gross pay on NABET productions.',
   true, 'https://nabet700.com/permittees.html', '2026-10-19', true);

-- ------------------------------------------------------------------
-- DGC: each district council sets its own rules. Ontario: experience
-- over 150 days on at least 3 productions (the 300 "national" had no source).
-- ------------------------------------------------------------------
update public.unions set
  dues_rate = null,
  dues_notes = 'Ontario annual dues: $750 Full, $450 Associate. Working dues aren''t posted.',
  application_fee = null,
  application_fee_notes = 'Ontario: Associate membership costs $500 plus $112.50; Full costs $1,500 plus $187.50.',
  needs_verification = array['working dues rate', 'membership rules outside Ontario and BC'],
  source_urls = array['https://voting.dgc.ca/en/ontario/becoming-a-member/join-as-a-full-member/joining-as-a-new-applicant',
                      'https://voting.dgc.ca/en/ontario/becoming-a-member/member-resources',
                      'https://www.dgc.ca/en/british-columbia/membership-info/permittee-logbook-holder-program'],
  last_verified = '2026-10-19'
where id = 'u-dgc';

update public.union_tiers set
  target_value = 150, province = 'Ontario', counts_work = 'any', min_productions = 3, requires_department = true,
  description = 'DGC Ontario looks at experience of more than 150 days on at least 3 productions. Each district council sets its own rules.',
  source_url = 'https://voting.dgc.ca/en/ontario/becoming-a-member/join-as-a-full-member/joining-as-a-new-applicant',
  checked_on = '2026-10-19', confirmed = true
where union_id = 'u-dgc' and name = 'Member';

-- ------------------------------------------------------------------
-- ACFC West: permittee experience counts from anywhere; Full membership
-- was missing.
-- ------------------------------------------------------------------
update public.unions set
  dues_notes = 'Annual dues for 2027 are $100, due October 1, 2026.',
  needs_verification = array['departments represented'],
  source_urls = array['https://acfcwest.com/become/', 'https://www.acfcwest.com/?p=244',
                      'https://acfcwest.com/2026/08/31/2027-annual-dues-due-by-october-1-2026/'],
  last_verified = '2026-10-19'
where id = 'u-acfc-west';

update public.union_tiers set
  counts_work = 'any', requires_department = true,
  source_url = 'https://acfcwest.com/become/', checked_on = '2026-10-19', confirmed = true
where union_id = 'u-acfc-west' and name = 'Permittee';

insert into public.union_tiers (union_id, sort_order, name, target_type, target_value, description, requires_department,
                                source_url, checked_on, confirmed) values
  ('u-acfc-west', 1, 'Full Member', 'DAYS', 90,
   '90 days on ACFC West productions in an ACFC West position, plus 3 endorsements.',
   true, 'https://www.acfcwest.com/?p=244', '2026-10-19', true);

insert into public.union_requirements (union_id, kind, caucus, sort_order, text) values
  ('u-acfc-west', 'requirement', 'Full Member', 10, '90 days on ACFC West productions in an ACFC West position'),
  ('u-acfc-west', 'requirement', 'Full Member', 11, 'Three endorsements'),
  ('u-acfc-west', 'application_step', null, 5, 'Transportation applications are closed (October 2026)');

-- ------------------------------------------------------------------
-- WGC: the contract must be from the past two years.
-- ------------------------------------------------------------------
update public.union_tiers set
  window_months = 24,
  source_url = 'https://www.wgc.ca/sites/default/files/2024-06/NEWMemberApplicationFillableMay312024.pdf',
  checked_on = '2026-10-19', confirmed = true
where union_id = 'u-wgc' and name = 'Member';

-- ------------------------------------------------------------------
-- Sourced earlier, couldn't be re-read today (the sites block automated
-- reading). Kept as confirmed from the earlier source, per department.
-- ------------------------------------------------------------------
update public.union_tiers set
  requires_department = true,
  source_url = 'https://www.iatselocal634.com/about/how-to-become-a-permitee', checked_on = '2026-10-09', confirmed = true
where union_id = 'u-634' and name = 'Member';

update public.union_tiers set
  requires_department = true,
  source_url = 'https://www.iatse891.org', checked_on = '2026-10-09', confirmed = true
where union_id = 'u-891' and name = 'Member';

-- ------------------------------------------------------------------
-- No published target: kept so people can still track, shown as
-- unconfirmed until the union confirms it.
-- ------------------------------------------------------------------
update public.union_tiers set
  description = 'Not confirmed. ICG 667''s site couldn''t be checked; ask the union for the current day count.'
where union_id = 'u-667' and name = 'Member';

update public.union_tiers set
  description = 'Not confirmed. IATSE 212 doesn''t post a membership target; ask the local for the current day count.'
where union_id = 'u-212' and name = 'Member';

update public.union_tiers set
  description = 'Not confirmed. Teamsters 155 isn''t accepting applications (October 2026) and doesn''t post a day count.',
  source_url = 'https://www.teamsters155.org/join-155/', checked_on = '2026-10-19'
where union_id = 'u-t155' and name = 'Member';

update public.union_tiers set
  description = 'Not confirmed. Teamsters 362 doesn''t post a day count.'
where union_id = 'u-t362' and name = 'Member';

update public.union_tiers set
  description = 'Not confirmed. Teamsters 938 doesn''t post a day count, and its website lists no film or TV work.',
  source_url = 'https://www.teamsters938.org/industries-we-serve/', checked_on = '2026-10-19'
where union_id = 'u-t938' and name = 'Member';

update public.unions set
  needs_verification = array['whether 938 represents film and TV work', 'membership day count', 'dues rate', 'application fee']
where id = 'u-t938';

update public.union_tiers set
  description = 'Stagiaires pay work permits that convert to credits; 30 credits to become an active member. Not confirmed: how UDA counts a credit.'
where union_id = 'u-uda' and name = 'Membre actif';

insert into public.union_requirements (union_id, kind, sort_order, text) values
  ('u-t155', 'application_step', 1, 'Not accepting applications (October 2026)');

-- ------------------------------------------------------------------
-- IATSE 210 (Edmonton): missing entirely.
-- ------------------------------------------------------------------
insert into public.unions (id, sort_order, name, scope, description, website, application_fee, application_fee_notes,
                           residency_rule, needs_verification, source_urls, last_verified) values
  ('u-210', 85, 'IATSE 210', 'technicians', 'Stage and film technicians in Edmonton.', 'https://iatse210.com', 100,
   '$100 to apply and $200 initiation, then $90 a quarter in dues.',
   '18 months'' residency.',
   array['which work counts toward the 480 hours', 'working dues rate', 'which roles 210 covers alongside IATSE 212'],
   array['https://iatse210.com/wp-content/uploads/2025/04/Membership-Requirements.pdf'], '2026-10-19');

insert into public.union_jurisdictions (union_id, province, notes) values
  ('u-210', 'Alberta', 'Edmonton');

insert into public.union_tiers (union_id, sort_order, name, target_type, target_value, description, source_url, checked_on, confirmed) values
  ('u-210', 0, 'Member', 'HOURS', 480, '480 hours, with 18 months'' residency.',
   'https://iatse210.com/wp-content/uploads/2025/04/Membership-Requirements.pdf', '2026-10-19', true);

-- ------------------------------------------------------------------
-- Pay rules
-- ------------------------------------------------------------------
update public.pay_rules set
  overtime_base = 'daily_fee',
  notes = 'The daily fee is the minimum for a day. Overtime is worked out from the daily fee divided by 8: 150% after 8 hours worked and 200% after 12, in 6-minute units (2026 principal overtime minimum: $182.50). Background performers: 8-hour minimum call (3 hours for non-ACTRA background) and 1.5x overtime.',
  needs_verification = array['When 2x overtime starts for background performers'],
  source_url = 'https://www.actra.ca/wp-content/uploads/2025/01/2025-2027-IPA-Rates_EN_FINAL.pdf'
where id = 'actra-ipa';

update public.pay_rules set
  notes = 'The daily fee is the minimum for a day. 150% after 8 hours worked in a day, 200% after 12, in 0.1-hour units. Rates include 4% vacation pay; Cast & Crew prints it on its own line, so a pay stub''s base rate reads about 4% under the rate sheet.'
where id = 'ubcp-bcmpa';

update public.pay_rules set
  notes = 'Minimum call is 8 hours plus an unpaid meal. 1.5x after 8 hours up to the 12th, 2x from 12 to 15, 3x from the 16th hour, in 0.1-hour units. Not yet calculated here: a 6th day pays the minimum call at 1.5x, then 2x to the 12th hour, then 3x; a 7th day pays 2x, then 3x. The rest period is 10 hours, and meal penalties are paid on a per-tenth-hour scale.'
where id = 'iatse-873';

update public.pay_rules set
  notes = 'Transportation minimum call is 9 hours plus an unpaid meal. 1.5x after 9 hours up to the 12th, 2x from 12 to 15, 3x from the 16th hour. The rest period is 9 hours.'
where id = 'iatse-873-transportation';

update public.rate_schedules set
  notes = 'Ended March 31, 2026. The 2026 Rates and Fringes (April 1, 2026 to March 31, 2027) are posted at https://www.iatse212.com/downloads/agreements/2026RatesandFringesFinal.pdf'
where id = 'iatse-212-2025';

-- ------------------------------------------------------------------
-- Dates: GST/HST instalments and union dues
-- ------------------------------------------------------------------
insert into public.deadlines (id, title, month, day, applies_to, province, union_id, detail, source_url, checked_on) values
  ('cra-gst-instalment-apr', 'GST/HST instalment', 4, 30, 'gst_registered', null, null,
   'Annual GST/HST filers whose net tax was $3,000 or more.',
   'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/pay-instalment/need-to-pay-by-instalments.html', '2026-10-19'),
  ('cra-gst-instalment-jul', 'GST/HST instalment', 7, 31, 'gst_registered', null, null,
   'Annual GST/HST filers whose net tax was $3,000 or more.',
   'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/pay-instalment/need-to-pay-by-instalments.html', '2026-10-19'),
  ('cra-gst-instalment-oct', 'GST/HST instalment', 10, 31, 'gst_registered', null, null,
   'Annual GST/HST filers whose net tax was $3,000 or more.',
   'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/pay-instalment/need-to-pay-by-instalments.html', '2026-10-19'),
  ('cra-gst-instalment-jan', 'GST/HST instalment', 1, 31, 'gst_registered', null, null,
   'Annual GST/HST filers whose net tax was $3,000 or more.',
   'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/pay-instalment/need-to-pay-by-instalments.html', '2026-10-19'),
  ('actra-toronto-dues', 'ACTRA Toronto dues', 5, 31, 'union_member', 'Ontario', 'u-actra',
   'Annual dues are due.', 'https://actratoronto.com/pay-your-dues', '2026-10-19'),
  ('ubcp-dues', 'UBCP/ACTRA dues', 3, 31, 'union_member', 'British Columbia', 'u-ubcp',
   'Annual dues are due. A 10% late fee applies from April 1.', 'https://ubcpactra.ca/dues/', '2026-10-19'),
  ('acfc-west-dues', 'ACFC West dues', 10, 1, 'union_member', 'British Columbia', 'u-acfc-west',
   'Annual dues for the coming year are due ($100 for 2027).',
   'https://acfcwest.com/2026/08/31/2027-annual-dues-due-by-october-1-2026/', '2026-10-19'),
  ('iatse-849-dues-jan', 'IATSE 849 quarterly dues', 1, 1, 'union_member', null, 'u-849',
   '$100 quarterly dues are due.', 'https://iatse849.com/membership/resources/dues', '2026-10-19'),
  ('iatse-849-dues-apr', 'IATSE 849 quarterly dues', 4, 1, 'union_member', null, 'u-849',
   '$100 quarterly dues are due.', 'https://iatse849.com/membership/resources/dues', '2026-10-19'),
  ('iatse-849-dues-jul', 'IATSE 849 quarterly dues', 7, 1, 'union_member', null, 'u-849',
   '$100 quarterly dues are due.', 'https://iatse849.com/membership/resources/dues', '2026-10-19'),
  ('iatse-849-dues-oct', 'IATSE 849 quarterly dues', 10, 1, 'union_member', null, 'u-849',
   '$100 quarterly dues are due.', 'https://iatse849.com/membership/resources/dues', '2026-10-19');

-- ------------------------------------------------------------------
-- Wallet totals: only half the GST/HST paid on meals can be claimed back
-- (CRA, input tax credits on meals and entertainment).
-- ------------------------------------------------------------------
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
    coalesce(sum(case when upper(category) like '%MEAL%' or upper(category) like '%ENTERTAINMENT%'
                      then tax_amount * 0.5 else tax_amount end) filter (where type = 'EXPENSE'), 0)
  from public.finance_transactions
  where user_id = p_user_id
    and date_incurred >= make_date(coalesce(p_year, extract(year from current_date)::int), 1, 1)
    and date_incurred <  make_date(coalesce(p_year, extract(year from current_date)::int) + 1, 1, 1);
$$;

-- ------------------------------------------------------------------
-- Snapshot: the new tier and pay rule fields.
-- ------------------------------------------------------------------
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
        'overtimeBase', p.overtime_base,
        'mealBreakNotes', p.meal_break_notes, 'notes', p.notes,
        'needsVerification', p.needs_verification, 'sourceUrl', p.source_url
      ) order by p.union_id, p.department_id nulls first, p.sort_order)
      from pay_rules p join unions u on u.id = p.union_id and u.is_active), '[]'::jsonb)
  );
$$;
