-- ============================================================
-- PROOF ON EVERY WALLET ENTRY ("GREEN LIT")
-- Each Wrap Wallet entry can be backed with proof: a receipt,
-- pay stub or invoice in the documents bucket under
-- <user id>/proof/. An entry with proof is Green Lit.
-- Uploading needs Pro (documents: upload own folder).
-- ============================================================

alter table public.finance_transactions add column proof_path text
  check (proof_path is null or proof_path like '%/proof/%');
