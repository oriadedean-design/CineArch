-- ============================================================
-- FINANCE TRANSACTIONS
-- Income, expenses, GST tracking per user.
-- ============================================================

create table public.finance_transactions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  job_id               uuid references public.jobs(id) on delete set null,
  type                 text not null check (type in ('INCOME','EXPENSE','ASSET_PURCHASE','DRAW','LOAN','TAX_PAYMENT','REIMBURSEMENT')),
  date_incurred        date not null,
  date_paid            date,
  description          text not null,
  category             text not null,
  amount_before_tax    numeric(12,2) not null default 0,
  tax_amount           numeric(12,2) not null default 0,
  total_amount         numeric(12,2) not null default 0,
  business_use_percent numeric(5,2) not null default 100,
  deductible_amount    numeric(12,2),
  add_back_amount      numeric(12,2),
  rule_tags            text[],
  -- Offline sync fields
  client_id            text unique,
  synced_at            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_finance_user_id on public.finance_transactions(user_id);
create index idx_finance_date on public.finance_transactions(user_id, date_incurred desc);

create trigger trg_finance_updated_at
  before update on public.finance_transactions
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.finance_transactions enable row level security;

create policy "finance: own all"
  on public.finance_transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
