-- ============================================================
-- LOCK PRIVILEGED PROFILE COLUMNS
-- The "own update" policy limits which ROW a user can update,
-- not which columns. Without this, any user could set
-- is_premium / plan / stripe ids / account_type on themselves.
-- Billing columns must only be written server-side (service
-- role, e.g. a Stripe webhook); agency links only via the RPCs
-- in the agency_links migration.
-- ============================================================

revoke update on public.profiles from anon, authenticated;

grant update (
  name, phone, country, language, role, province, region,
  is_onboarded, member_status, career_focus, department,
  selected_roles, goals, has_agent_fee, agent_fee_pct,
  entity_type, organization_name, business_structure,
  primary_industry, cohort_year, program_name
) on public.profiles to authenticated;

-- Profiles are created only by the auth trigger.
revoke insert, delete on public.profiles from anon, authenticated;
