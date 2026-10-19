-- Tax figures as data, like the union engine: one row per year and
-- jurisdiction, each with its source and the day it was checked. The app
-- works out what to set aside from these rows, so a new tax year is new
-- rows, not new code. Shipped in the engine snapshot (public read).
--
-- Who someone is paid as decides what they set aside:
--   profiles.pay_type    't4' (employee: tax and CPP come off the cheque),
--                        'self_employed', or 'both'
--   profiles.gst_method  'regular' (GST/HST charged minus paid) or 'quick'
--                        (the Quick Method: a flat share of sales)

-- ------------------------------------------------------------------
-- Income tax: brackets [[from, rate], ...], the basic personal amount
-- (with a phase-out for high incomes where it has one), Ontario's surtax,
-- health premium and tax reduction, and Québec's federal abatement.
-- ------------------------------------------------------------------
create table public.tax_jurisdictions (
  year                  int  not null check (year between 2020 and 2100),
  code                  text not null check (code ~ '^[A-Z]{2,3}$'),
  province              text check (province is null or public.is_canadian_province(province)),
  brackets              jsonb not null,
  basic_amount          numeric(10,2) not null,
  basic_amount_phaseout jsonb,             -- {from, to, min}: shrinks to min between from and to
  surtax                jsonb,             -- [[over, rate], ...] on provincial tax (Ontario)
  health_premium        jsonb,             -- [{over, base, rate, cap}, ...] on taxable income (Ontario)
  tax_reduction_base    numeric(10,2),     -- Ontario tax reduction: 2 x base, less the tax
  federal_abatement     numeric(5,4),      -- share of federal tax taken off (Québec 16.5%)
  source_url            text not null,
  checked_on            date not null,
  notes                 text,
  needs_verification    text[] not null default '{}',
  updated_at            timestamptz not null default now(),
  primary key (year, code),
  check ((code = 'FED') = (province is null))
);

-- ------------------------------------------------------------------
-- CPP / QPP for the self-employed, who pay both halves. Rates are the
-- combined (employee + employer) rates.
-- ------------------------------------------------------------------
create table public.pension_plans (
  year                  int  not null,
  code                  text not null check (code in ('CPP', 'QPP')),
  exemption             numeric(10,2) not null,
  ympe                  numeric(10,2) not null,   -- first ceiling
  yampe                 numeric(10,2) not null,   -- second ceiling (CPP2 / QPP2)
  base_rate             numeric(6,4) not null,
  first_additional_rate numeric(6,4) not null,
  second_rate           numeric(6,4) not null,
  source_url            text not null,
  checked_on            date not null,
  updated_at            timestamptz not null default now(),
  primary key (year, code)
);

-- ------------------------------------------------------------------
-- GST/HST by province, and the Quick Method rate for a service business
-- whose sales are in its own province, with the 1% credit on the first
-- $30,000 of sales (tax included).
-- ------------------------------------------------------------------
create table public.sales_tax (
  year                int  not null,
  province            text not null check (public.is_canadian_province(province)),
  gst_hst_rate        numeric(6,4) not null,
  quick_service_rate  numeric(6,4) not null,
  quick_credit_rate   numeric(6,4) not null default 0.01,
  quick_credit_limit  numeric(10,2) not null default 30000,
  source_url          text not null,
  checked_on          date not null,
  notes               text,
  updated_at          timestamptz not null default now(),
  primary key (year, province)
);

do $$
declare t text;
begin
  foreach t in array array['tax_jurisdictions', 'pension_plans', 'sales_tax'] loop
    execute format('create trigger %I after insert or update or delete or truncate on public.%I
                    for each statement execute function public.bump_union_engine_version()', t || '_bump_version', t);
    execute format('create trigger %I before update on public.%I
                    for each row execute function public.touch_updated_at()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "engine: public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- 2026: CRA T4127 Payroll Deductions Formulas (January 2026, Table 8.1 and
-- 8.2), with the July 2026 edition's changes for BC, NL and PEI as annual
-- figures; Québec from TaxTips (Revenu Québec blocks automated reading).
insert into public.tax_jurisdictions (year, code, province, brackets, basic_amount, basic_amount_phaseout, surtax, health_premium,
                                      tax_reduction_base, federal_abatement, source_url, checked_on, notes, needs_verification) values
  (2026, 'FED', null, '[[0, 0.14], [58523, 0.205], [117045, 0.26], [181440, 0.29], [258482, 0.33]]'::jsonb, 16452, '{"from": 181440, "to": 258482, "min": 14829}'::jsonb, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19', null, '{}'),
  (2026, 'AB', 'Alberta', '[[0, 0.08], [61200, 0.1], [154259, 0.12], [185111, 0.13], [246813, 0.14], [370220, 0.15]]'::jsonb, 22769, null, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19', null, '{}'),
  (2026, 'BC', 'British Columbia', '[[0, 0.056], [50363, 0.077], [100728, 0.105], [115648, 0.1229], [140430, 0.147], [190405, 0.168], [265545, 0.205]]'::jsonb, 13216, null, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html', '2026-10-19', 'Lowest rate raised to 5.60% for 2026 (announced February 17, 2026). The BC tax reduction for low incomes is not applied.', '{}'),
  (2026, 'MB', 'Manitoba', '[[0, 0.108], [47000, 0.1275], [100000, 0.174]]'::jsonb, 15780, '{"from": 200000, "to": 400000, "min": 0}'::jsonb, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19', null, '{}'),
  (2026, 'NB', 'New Brunswick', '[[0, 0.094], [52333, 0.14], [104666, 0.16], [193861, 0.195]]'::jsonb, 13664, null, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19', null, '{}'),
  (2026, 'NL', 'Newfoundland and Labrador', '[[0, 0.087], [44678, 0.145], [89354, 0.158], [159528, 0.178], [223340, 0.198], [285319, 0.208], [570638, 0.213], [1141275, 0.218]]'::jsonb, 13094, null, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html', '2026-10-19', 'Basic personal amount raised to $13,094 for 2026 (announced April 29, 2026).', '{}'),
  (2026, 'NS', 'Nova Scotia', '[[0, 0.0879], [30995, 0.1495], [61991, 0.1667], [97417, 0.175], [157124, 0.21]]'::jsonb, 11932, null, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19', null, '{}'),
  (2026, 'NT', 'Northwest Territories', '[[0, 0.059], [53003, 0.086], [106009, 0.122], [172346, 0.1405]]'::jsonb, 18198, null, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19', null, '{}'),
  (2026, 'NU', 'Nunavut', '[[0, 0.04], [55801, 0.07], [111602, 0.09], [181439, 0.115]]'::jsonb, 19659, null, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19', null, '{}'),
  (2026, 'ON', 'Ontario', '[[0, 0.0505], [53891, 0.0915], [107785, 0.1116], [150000, 0.1216], [220000, 0.1316]]'::jsonb, 12989, null, '[[5818, 0.2], [7446, 0.36]]'::jsonb, '[{"over": 20000, "base": 0, "rate": 0.06, "cap": 300}, {"over": 36000, "base": 300, "rate": 0.06, "cap": 450}, {"over": 48000, "base": 450, "rate": 0.25, "cap": 600}, {"over": 72000, "base": 600, "rate": 0.25, "cap": 750}, {"over": 200000, "base": 750, "rate": 0.25, "cap": 900}]'::jsonb, 300, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19', null, '{}'),
  (2026, 'PE', 'Prince Edward Island', '[[0, 0.095], [33928, 0.1347], [65820, 0.166], [106890, 0.1762], [142520, 0.19], [200000, 0.2]]'::jsonb, 15000, null, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html', '2026-10-19', 'New 20% bracket above $200,000 for 2026 (introduced April 14, 2026).', '{}'),
  (2026, 'QC', 'Quebec', '[[0, 0.14], [54345, 0.19], [108680, 0.24], [132245, 0.2575]]'::jsonb, 18952, null, null, null, null, 0.165, 'https://www.taxtips.ca/taxrates/qc.htm', '2026-10-19', 'Québec sets its own income tax; residents get a 16.5% abatement on federal tax. Québec parental insurance (QPIP) is not included.', array['confirm on revenuquebec.ca (the site blocks automated reading)']::text[]),
  (2026, 'SK', 'Saskatchewan', '[[0, 0.105], [54532, 0.125], [155805, 0.145]]'::jsonb, 20381, null, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19', null, '{}'),
  (2026, 'YT', 'Yukon', '[[0, 0.064], [58523, 0.09], [117045, 0.109], [181440, 0.128], [500000, 0.15]]'::jsonb, 16452, '{"from": 181440, "to": 258482, "min": 14829}'::jsonb, null, null, null, null, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19', 'Basic personal amount mirrors the federal one.', '{}');

-- 2026: T4127 Table 8.3 to 8.6 (combined rates: base 2 x 4.95% CPP, 2 x 5.30% QPP).
insert into public.pension_plans (year, code, exemption, ympe, yampe, base_rate, first_additional_rate, second_rate, source_url, checked_on) values
  (2026, 'CPP', 3500, 74600, 85000, 0.0990, 0.0200, 0.0800, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19'),
  (2026, 'QPP', 3500, 74600, 85000, 0.1060, 0.0200, 0.0800, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', '2026-10-19');

-- Rates: CRA GST/HST rate table. Quick Method: CRA RC4058, services, sales
-- in the same province as the business (GST 3.6%, HST 13% 8.8%, 14% 9.4%, 15% 10.0%).
insert into public.sales_tax (year, province, gst_hst_rate, quick_service_rate, source_url, checked_on, notes) values
  (2026, 'Alberta', 0.0500, 0.0360, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'British Columbia', 0.0500, 0.0360, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'Manitoba', 0.0500, 0.0360, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'New Brunswick', 0.1500, 0.1000, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'Newfoundland and Labrador', 0.1500, 0.1000, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'Northwest Territories', 0.0500, 0.0360, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'Nova Scotia', 0.1400, 0.0940, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'Nunavut', 0.0500, 0.0360, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'Ontario', 0.1300, 0.0880, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'Prince Edward Island', 0.1500, 0.1000, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'Quebec', 0.0500, 0.0360, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', 'GST only. Québec sales tax (QST) has its own Quick Method through Revenu Québec, not included.'),
  (2026, 'Saskatchewan', 0.0500, 0.0360, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null),
  (2026, 'Yukon', 0.0500, 0.0360, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4058/quick-method-accounting-gst-hst.html', '2026-10-19', null);

-- ------------------------------------------------------------------
-- How someone is paid, and how they account for GST/HST.
-- ------------------------------------------------------------------
alter table public.profiles
  add column pay_type   text check (pay_type is null or pay_type in ('t4', 'self_employed', 'both')),
  add column gst_method text not null default 'regular' check (gst_method in ('regular', 'quick'));

grant update (pay_type, gst_method) on public.profiles to authenticated;

-- ------------------------------------------------------------------
-- Wallet totals: employment (T4) income separately, since tax and CPP
-- already come off it; GST/HST charged on sales, tax included, for the
-- Quick Method.
-- ------------------------------------------------------------------
drop function public.finance_stats(uuid, int);
create function public.finance_stats(p_user_id uuid, p_year int default null)
returns table (
  gross_income         numeric,
  total_expenses       numeric,
  deductible_expenses  numeric,
  gst_collected        numeric,
  gst_paid             numeric,
  employment_income    numeric
)
language sql stable security invoker set search_path = public as $$
  select
    coalesce(sum(amount_before_tax) filter (where type = 'INCOME'), 0),
    coalesce(sum(amount_before_tax) filter (where type = 'EXPENSE'), 0),
    coalesce(sum(coalesce(deductible_amount, amount_before_tax)) filter (where type = 'EXPENSE'), 0),
    coalesce(sum(tax_amount) filter (where type = 'INCOME'), 0),
    coalesce(sum(case when upper(category) like '%MEAL%' or upper(category) like '%ENTERTAINMENT%'
                      then tax_amount * 0.5 else tax_amount end) filter (where type = 'EXPENSE'), 0),
    coalesce(sum(amount_before_tax) filter (where type = 'INCOME' and category = 'EMPLOYMENT'), 0)
  from public.finance_transactions
  where user_id = p_user_id
    and date_incurred >= make_date(coalesce(p_year, extract(year from current_date)::int), 1, 1)
    and date_incurred <  make_date(coalesce(p_year, extract(year from current_date)::int) + 1, 1, 1);
$$;
revoke all on function public.finance_stats(uuid, int) from public, anon;
grant execute on function public.finance_stats(uuid, int) to authenticated;
