-- ============================================================
-- PROOF ON JOBS (Dean, 2026-10-17)
-- A job on the Slate can be backed with its pay stub, like a
-- Wallet entry; with proof it is Green Lit. Files go in
-- documents/<user id>/proof/ (Pro, 1 MB each, 5 GB per account).
-- ============================================================

alter table public.jobs add column proof_path text
  check (proof_path is null or proof_path like '%/proof/%');
