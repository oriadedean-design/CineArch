-- The walkthrough is remembered per account, not per device: the phone's
-- table read plays once after someone first signs in, the website's dock
-- tour once after Setting the Scene. Either can be replayed from settings.
alter table public.profiles add column walkthrough_seen_at timestamptz;   -- phone
alter table public.profiles add column web_tour_seen_at    timestamptz;   -- website
grant update (walkthrough_seen_at, web_tour_seen_at) on public.profiles to authenticated;
