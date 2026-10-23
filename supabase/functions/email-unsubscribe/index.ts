// Stops onboarding emails for one person.
//   POST ?u=<id>&t=<token>  unsubscribes: email apps' one-click button
//                           (List-Unsubscribe-Post) and the website's
//                           /#/unsubscribe page both send this
//   GET                     goes to that page, which asks first, so link
//                           scanners that open every link don't unsubscribe anyone
// The token is an HMAC of the person's id, so links can't be guessed. Their
// Resend contact is marked unsubscribed on the next email-lifecycle run.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { unsubscribeToken } from '../_shared/resend.ts';

Deno.serve(async (req) => {
  const site = Deno.env.get('SITE_URL') ?? '';
  const cors = { 'Access-Control-Allow-Origin': site, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const user = url.searchParams.get('u') ?? '', token = url.searchParams.get('t') ?? '';
  if (req.method === 'GET') {
    return Response.redirect(`${site}/#/unsubscribe?u=${encodeURIComponent(user)}&t=${encodeURIComponent(token)}`, 302);
  }
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: cors });

  const secret = Deno.env.get('UNSUBSCRIBE_SECRET') ?? '';
  const valid = /^[0-9a-f-]{36}$/.test(user) && secret !== '' && token === await unsubscribeToken(user, secret);
  if (!valid) return new Response(null, { status: 400, headers: cors });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { error } = await db.rpc('email_unsubscribe', { p_user: user });
  return new Response(null, { status: error ? 500 : 200, headers: cors });
});
