// Supabase Auth's emails (sign-up confirmation, password reset, email change,
// sign-in link) in CineArch's look, sent through Resend once SMTP is set.
//
//   node scripts/auth-emails.mjs          writes supabase/templates/*.html to review
//   node scripts/auth-emails.mjs --push   also sends them to the live project, with
//                                         the Resend SMTP settings
// --push needs SUPABASE_ACCESS_TOKEN, and the Resend API key in ~/.cinearch-resend.
// Sender: EMAIL_FROM_ADDRESS (default hello@cinearch.deanoriade.ca until cinearch.ca).
// These are account emails, not tips, so they have no unsubscribe link.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';

const REF = 'ylneglnslysecrhgjwcw';
const INK = '#0b0b0a', SIGNAL = '#facc15', MUTED = '#5d5a50', RULE = '#e4e2da';
const SERIF = "Georgia, 'Times New Roman', serif", SANS = "-apple-system, 'Helvetica Neue', Arial, sans-serif";

const page = ({ kicker, title, lines, button, after }) => `<!doctype html>
<html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f3f2ec">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f3f2ec"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff">
    <tr><td style="background:${INK};padding:18px 28px"><span style="font:italic 26px/1 ${SERIF};color:#ffffff">Ca</span><span style="font:700 11px/1 ${SANS};letter-spacing:4px;color:#ffffff;padding-left:8px">CINEARCH</span></td></tr>
    <tr><td style="height:10px;line-height:10px;font-size:0;background:repeating-linear-gradient(-45deg,${SIGNAL} 0 10px,${INK} 10px 20px);background-color:${SIGNAL}">&nbsp;</td></tr>
    <tr><td style="padding:32px 28px 8px">
      <p style="margin:0 0 10px;font:700 11px/1 ${SANS};letter-spacing:3px;text-transform:uppercase;color:${MUTED}">${kicker}</p>
      <h1 style="margin:0 0 20px;font:italic 400 34px/1.1 ${SERIF};color:${INK}">${title}</h1>
      ${lines.map(l => `<p style="margin:0 0 16px;font:16px/1.55 ${SANS};color:${INK}">${l}</p>`).join('')}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:${SIGNAL}">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 26px;font:700 13px/1 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${INK};text-decoration:none">${button}</a>
      </td></tr></table>
      <p style="margin:0 0 24px;font:13px/1.55 ${SANS};color:${MUTED}">${after}</p>
    </td></tr>
    <tr><td style="padding:18px 28px 26px;border-top:1px solid ${RULE};font:12px/1.6 ${SANS};color:${MUTED}">CineArch, the cast and crew tracker. This email is about your account, so it can't be turned off.</td></tr>
  </table>
</td></tr></table></body></html>`;

const expires = 'The link works once and expires in an hour.';
const templates = {
  confirmation: { subject: 'Confirm your email for CineArch', html: page({
    kicker: 'Confirm your email', title: 'One take to confirm.',
    lines: ['Confirm this is your email address and your CineArch account is ready.'],
    button: 'Confirm my email', after: `${expires} If you didn't sign up for CineArch, ignore this email.` }) },
  recovery: { subject: 'Reset your CineArch password', html: page({
    kicker: 'Password reset', title: 'Reset your password.',
    lines: ['Someone, hopefully you, asked to reset the password for {{ .Email }}.'],
    button: 'Choose a new password', after: `${expires} If you didn't ask, ignore this email and your password stays the same.` }) },
  email_change: { subject: 'Confirm your new email for CineArch', html: page({
    kicker: 'Email change', title: 'Confirm your new email.',
    lines: ['Confirm you want to change your CineArch email from {{ .Email }} to {{ .NewEmail }}.'],
    button: 'Confirm the change', after: `${expires} If you didn't ask for this, ignore this email and nothing changes.` }) },
  magic_link: { subject: 'Your CineArch sign-in link', html: page({
    kicker: 'Sign in', title: 'Your sign-in link.',
    lines: ['Tap below to sign in to CineArch as {{ .Email }}.'],
    button: 'Sign in', after: `${expires} If you didn't ask to sign in, ignore this email.` }) },
};

mkdirSync('supabase/templates', { recursive: true });
for (const [name, t] of Object.entries(templates)) writeFileSync(`supabase/templates/auth-${name.replace('_', '-')}.html`, t.html);
console.log('Wrote supabase/templates/auth-*.html');

if (process.argv.includes('--push')) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('Set SUPABASE_ACCESS_TOKEN');
  const key = readFileSync(`${homedir()}/.cinearch-resend`, 'utf8').trim();
  if (!key.startsWith('re_')) throw new Error('~/.cinearch-resend should hold a Resend API key (starts with re_)');
  const body = {
    smtp_host: 'smtp.resend.com', smtp_port: '465', smtp_user: 'resend', smtp_pass: key,
    smtp_admin_email: process.env.EMAIL_FROM_ADDRESS ?? 'hello@cinearch.deanoriade.ca', smtp_sender_name: 'CineArch',
    rate_limit_email_sent: 30,
  };
  for (const [name, t] of Object.entries(templates)) {
    body[`mailer_subjects_${name}`] = t.subject;
    body[`mailer_templates_${name}_content`] = t.html;
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase: ${res.status} ${await res.text()}`);
  console.log('Pushed SMTP settings and 4 templates to the live project.');
}
