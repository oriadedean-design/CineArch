// Runs every 15 minutes (pg_cron, migration 20261023000004). In order:
//   1. removes deleted accounts from Resend,
//   2. syncs changed contacts: properties and segments, for segmentation,
//   3. sends the onboarding emails that are due (email_due in the database).
// Called with the x-cron-secret header; not reachable by the apps.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { Resend, unsubscribeToken } from '../_shared/resend.ts';
import { render, type Kind } from '../_shared/templates.ts';

const env = (k: string) => { const v = Deno.env.get(k); if (!v) throw new Error(`Missing secret ${k}`); return v; };

// Segments CineArch keeps up to date. Province segments are added as people arrive.
const PLAN = { indie: 'Indie Log', pro: 'A-List Pro' } as const;
const STATUS = { ASPIRING: 'Working toward a card', MEMBER: 'Union members' } as const;
const STAGE = { no: 'Scene not set', yes: 'Scene set' } as const;
const AGENT = 'Has an agent';
const PROPERTIES = ['plan', 'member_status', 'province', 'department', 'role', 'onboarded', 'pay_type', 'has_agent', 'signed_up'];
const MAX_EMAILS = 20;     // per run (the rest go next run, 15 minutes later)
const MAX_CONTACTS = 20;   // per run; each takes a few Resend calls

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== env('CRON_SECRET')) return new Response('Not allowed', { status: 401 });

  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const resend = new Resend(env('RESEND_API_KEY'));
  const from = env('EMAIL_FROM'), site = env('SITE_URL'), secret = env('UNSUBSCRIBE_SECRET');
  const summary = { forgotten: 0, synced: 0, sent: 0, errors: [] as string[] };

  // 1. Deleted accounts.
  const { data: forget } = await db.from('email_forget').select('email').limit(100);
  for (const { email } of forget ?? []) {
    try { await resend.deleteContact(email); await db.rpc('email_forgotten', { p_email: email }); summary.forgotten++; }
    catch (e) { summary.errors.push(String(e)); }
  }

  // 2. Contacts whose details changed.
  const { data: due } = await db.rpc('email_contacts_due', { p_limit: MAX_CONTACTS });
  if (due?.length) {
    try {
      await resend.ensureProperties(PROPERTIES);
      // Resend's free plan allows 3 segments: the three that matter most while
      // people get started. Everything else is a contact property. On a paid
      // plan, set RESEND_SEGMENTS=full for every segment, provinces included.
      const full = Deno.env.get('RESEND_SEGMENTS') === 'full';
      const provinces = full ? [...new Set(due.map((c: any) => c.props.province).filter(Boolean))].map(p => `Province · ${p}`) : [];
      const fixed = full ? [...Object.values(PLAN), ...Object.values(STATUS), ...Object.values(STAGE), AGENT]
                         : [PLAN.pro, STATUS.ASPIRING, STAGE.no];
      const ids = await resend.ensureSegments([...fixed, ...provinces]);
      const managed = new Set([...ids.entries()].filter(([n]) => fixed.includes(n) || n.startsWith('Province · ')).map(([, id]) => id));
      for (const c of due) {
        try {
          const p = c.props as Record<string, string>;
          await resend.upsertContact({ email: c.email, firstName: c.first_name, unsubscribed: c.unsubscribed, properties: p });
          const want = new Set([
            ids.get(PLAN[p.plan as keyof typeof PLAN]), ids.get(STATUS[p.member_status as keyof typeof STATUS]),
            ids.get(STAGE[p.onboarded as keyof typeof STAGE]), p.has_agent === 'yes' ? ids.get(AGENT) : undefined,
            p.province ? ids.get(`Province · ${p.province}`) : undefined,
          ].filter((x): x is string => !!x));
          await resend.setSegments(c.email, want, managed);
          await db.rpc('email_contact_synced', { p_user: c.user_id, p_hash: c.props_hash });
          summary.synced++;
        } catch (e) { summary.errors.push(String(e)); }
      }
    } catch (e) { summary.errors.push(String(e)); }
  }

  // 3. Onboarding emails due now.
  const { data: emails } = await db.rpc('email_due');
  for (const d of (emails ?? []).slice(0, MAX_EMAILS)) {
    try {
      const token = await unsubscribeToken(d.user_id, secret);
      const q = `u=${d.user_id}&t=${token}`;
      // The link in the email asks first (website); the header is email apps' one-click button.
      const page = `${site}/#/unsubscribe?${q}`;
      const oneClick = `${env('SUPABASE_URL')}/functions/v1/email-unsubscribe?${q}`;
      const e = render(d.kind as Kind, { firstName: d.first_name, memberStatus: d.member_status, province: d.province }, { site, unsubscribe: page });
      const id = await resend.send({ from, to: d.email, subject: e.subject, html: e.html, text: e.text, unsubscribe: oneClick,
                                     tag: d.kind, idempotencyKey: `${d.user_id}-${d.kind}` });
      await db.rpc('email_sent', { p_user: d.user_id, p_kind: d.kind, p_resend_id: id });
      summary.sent++;
    } catch (e) { summary.errors.push(String(e)); }
  }

  return Response.json(summary);
});
