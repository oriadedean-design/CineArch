-- Runs the email-lifecycle Edge Function every 15 minutes (see
-- 20261023000003_email_lifecycle.sql). The shared secret it checks lives in
-- Vault as email_cron_secret, set once when the function is deployed:
--   select vault.create_secret('<secret>', 'email_cron_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('email-lifecycle', '*/15 * * * *', $job$
  select net.http_post(
    url     := 'https://ylneglnslysecrhgjwcw.supabase.co/functions/v1/email-lifecycle',
    headers := jsonb_build_object('Content-Type', 'application/json',
                 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'email_cron_secret')),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000);
$job$);
