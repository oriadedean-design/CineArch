# Email (Resend)

Two kinds of email, both sent through Resend:

| Kind | What | Sent by | Can be turned off |
|---|---|---|---|
| Account | Confirm your email, password reset, email change, sign-in link | Supabase Auth over Resend SMTP; templates in `supabase/templates/` (made by `scripts/auth-emails.mjs`) | No |
| Getting started | Welcome · Set the Scene reminder (24 h, if not done) · First week (24 h after Setting the Scene; copy for members and for people working toward a card) · A-List Pro welcome | `email-lifecycle` Edge Function every 15 minutes (`pg_cron`); who is due comes from `email_due()` in the database | Yes: Account (iPhone), Settings (website), or the link in any tip |

Each person gets each tip once, and only accounts made after the tips started
(`email_settings.lifecycle_starts_at`). Copy is in
`supabase/functions/_shared/templates.ts` and only says what the app does
(tested in `tests/emails.test.ts`; who-gets-what in `supabase/tests/email_smoke.sql`).

## Segmentation

Every confirmed account is a Resend contact with properties: `plan`,
`member_status`, `province`, `department`, `role`, `onboarded`, `pay_type`,
`has_agent`, `signed_up`. Only changes are sent (`email_contacts_due()`).
Deleting an account removes its contact (`email_forget`).

Resend's free plan allows 3 segments, so by default CineArch keeps:
**A-List Pro**, **Working toward a card**, **Scene not set**. On a paid plan set
the function secret `RESEND_SEGMENTS=full` to also keep Indie Log, Union
members, Scene set, Has an agent and one segment per province.

## Setup

1. Resend API key (full access) in `~/.cinearch-resend` (`pbpaste > ~/.cinearch-resend`).
2. Verify the sending domain in Resend and add its DNS records.
3. `supabase secrets set RESEND_API_KEY=...` (with CRON_SECRET, UNSUBSCRIBE_SECRET, SITE_URL, EMAIL_FROM).
4. `SUPABASE_ACCESS_TOKEN=... node scripts/auth-emails.mjs --push` (Resend SMTP + account email templates).
5. Apply `supabase/migrations/20261023000004_email_cron.sql` (the schedule).

## Moving to cinearch.ca

Verify cinearch.ca in Resend, then change `EMAIL_FROM` (function secret) and
re-run step 4 with `EMAIL_FROM_ADDRESS=hello@cinearch.ca`. Nothing else changes.

Until then mail comes from `hello@cinearch.deanoriade.ca`.
