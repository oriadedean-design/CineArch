-- ============================================================
-- EARNING GOAL
-- What someone wants to earn from film work this calendar year
-- (CAD, before tax). Set in Setting the Scene or Account; shown
-- against Income This Year on Your Wrap.
-- ============================================================

alter table public.profiles add column earning_goal numeric(12,2)
  check (earning_goal is null or earning_goal >= 0);

grant update (earning_goal) on public.profiles to authenticated;
