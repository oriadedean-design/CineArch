// The onboarding emails. Every claim here is something the app does today
// (same wording as the app and docs/plan-benefits.md); keep it that way.
// Email apps ignore web fonts and most CSS, so: tables, inline styles, and
// Georgia standing in for Instrument Serif.

export type Kind = 'welcome' | 'scene_reminder' | 'first_week' | 'pro_welcome';

export interface Person {
  firstName: string | null;
  memberStatus: string | null;   // ASPIRING or MEMBER
  province: string | null;
}

export interface Links {
  site: string;          // the website (A-List Pro accounts use it too)
  unsubscribe: string;   // stops these emails (one click)
}

export interface Email { subject: string; preheader: string; html: string; text: string }

const INK = '#0b0b0a', PAPER = '#ffffff', SIGNAL = '#facc15', MUTED = '#5d5a50', RULE = '#e4e2da';
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, 'Helvetica Neue', Arial, sans-serif";

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Block { kind: 'p' | 'steps' | 'list'; text?: string; items?: string[] }

function layout(o: { kicker: string; title: string; preheader: string; blocks: Block[]; cta: { label: string; url: string } | null; links: Links }): string {
  const body = o.blocks.map(b => {
    if (b.kind === 'p') return `<p style="margin:0 0 16px;font:16px/1.55 ${SANS};color:${INK}">${b.text}</p>`;
    const rows = (b.items ?? []).map((item, i) => `
      <tr>
        <td valign="top" style="width:34px;padding:0 0 14px;font:italic 22px/1.2 ${SERIF};color:${INK}">${b.kind === 'steps' ? String(i + 1).padStart(2, '0') : '&#9632;'}</td>
        <td valign="top" style="padding:2px 0 14px;font:16px/1.5 ${SANS};color:${INK}">${item}</td>
      </tr>`).join('');
    return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:4px 0 12px">${rows}</table>`;
  }).join('');
  return `<!doctype html>
<html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:#f3f2ec">
<div style="display:none;max-height:0;overflow:hidden">${esc(o.preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f3f2ec"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:${PAPER}">
    <tr><td style="background:${INK};padding:18px 28px">
      <span style="font:italic 26px/1 ${SERIF};color:${PAPER}">Ca</span>
      <span style="font:700 11px/1 ${SANS};letter-spacing:4px;color:${PAPER};padding-left:8px">CINEARCH</span>
    </td></tr>
    <tr><td style="height:10px;line-height:10px;font-size:0;background:repeating-linear-gradient(-45deg,${SIGNAL} 0 10px,${INK} 10px 20px);background-color:${SIGNAL}">&nbsp;</td></tr>
    <tr><td style="padding:32px 28px 8px">
      <p style="margin:0 0 10px;font:700 11px/1 ${SANS};letter-spacing:3px;text-transform:uppercase;color:${MUTED}">${o.kicker}</p>
      <h1 style="margin:0 0 20px;font:italic 400 34px/1.1 ${SERIF};color:${INK}">${o.title}</h1>
      ${body}
      ${o.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px"><tr>
        <td style="background:${SIGNAL}"><a href="${o.cta.url}" style="display:inline-block;padding:14px 26px;font:700 13px/1 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${INK};text-decoration:none">${o.cta.label}</a></td>
      </tr></table>` : `<p style="margin:8px 0 28px;padding:14px 16px;background:${INK};font:600 15px/1.4 ${SANS};color:${PAPER}"><span style="color:${SIGNAL}">&#9632;</span>&nbsp; Open CineArch on your iPhone.</p>`}
    </td></tr>
    <tr><td style="padding:18px 28px 26px;border-top:1px solid ${RULE};font:12px/1.6 ${SANS};color:${MUTED}">
      You're getting this because you have a CineArch account.
      <a href="${o.links.unsubscribe}" style="color:${MUTED}">Stop these tips</a>, or turn them off any time in Account in the iPhone app.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function plain(title: string, lines: string[], cta: { label: string; url: string } | null, links: Links): string {
  return [title, '', ...lines, '', cta ? `${cta.label}: ${cta.url}` : 'Open CineArch on your iPhone.', '', "You're getting this because you have a CineArch account.",
          `Stop these tips: ${links.unsubscribe}`].join('\n');
}

const strip = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');

export function render(kind: Kind, person: Person, links: Links): Email {
  const hi = person.firstName ? `, ${esc(person.firstName)}` : '';
  // Free accounts use the iPhone app; the website is for A-List Pro.
  const open = null;
  let e: { subject: string; preheader: string; kicker: string; title: string; blocks: Block[]; cta: { label: string; url: string } | null };

  switch (kind) {
    case 'welcome':
      e = {
        subject: "You're on the call sheet", preheader: 'Three first steps to get your days counting.',
        kicker: 'Welcome', title: `You're on the call sheet${hi}.`,
        blocks: [
          { kind: 'p', text: 'CineArch keeps your days on set, checks your pay against the union minimum, and counts your union days toward your card.' },
          { kind: 'p', text: 'Three first steps:' },
          { kind: 'steps', items: [
            '<strong>Set the scene.</strong> Four questions: where you work, what you do, who’s in your corner and what you’re working toward.',
            '<strong>Mark your first day.</strong> Tap the clapperboard after a day on set: the production, your role, your hours and whose set it was.',
            '<strong>Track a union.</strong> Days on a union set count toward that union’s card, even before you’re a member.',
          ] },
        ],
        cta: open,
      };
      break;

    case 'scene_reminder':
      e = {
        subject: 'Set the scene: 4 questions', preheader: 'So CineArch shows the unions and rates for your work.',
        kicker: 'Setting the Scene', title: `Four questions, then you're rolling${hi}.`,
        blocks: [
          { kind: 'p', text: 'You haven’t set the scene yet. It’s four questions: where you’re based, your work, your team and your goals.' },
          { kind: 'p', text: 'Your answers decide which unions CineArch suggests for your province and role, and which union minimums it checks your pay against.' },
        ],
        cta: null,
      };
      break;

    case 'first_week': {
      const member = person.memberStatus === 'MEMBER';
      const where = person.province ? ` in ${esc(person.province)}` : '';
      e = member ? {
        subject: 'Tracking your next level', preheader: 'Moving up a tier, or joining another union.',
        kicker: 'Your first week', title: `Your next level${hi}.`,
        blocks: [
          { kind: 'p', text: 'You’re already a member, so your Wrap tracks the next level: moving up a tier, or joining another union.' },
          { kind: 'list', items: [
            'Mark each day on set and CineArch checks your rate against the union minimum for your role.',
            'Say who booked each job. CineArch shows your agent’s commission and what you keep.',
            `The Union Guide lists the unions${where}, how to join and their minimum rates.`,
          ] },
        ],
        cta: open,
      } : {
        subject: 'How your union days add up', preheader: 'Days on a union set count before you’re a member.',
        kicker: 'Your first week', title: `Every union day counts${hi}.`,
        blocks: [
          { kind: 'p', text: 'Days on a union set count toward that union’s card, even before you’re a member. Your Wrap shows how close you are.' },
          { kind: 'list', items: [
            'When you mark the slate, pick the union whose set it was, so the day counts toward the right card.',
            'CineArch checks your rate against the union minimum for your role.',
            `The Union Guide lists the unions${where}, how to join and their minimum rates.`,
          ] },
        ],
        cta: open,
      };
      break;
    }

    case 'pro_welcome':
      e = {
        subject: 'Welcome to A-List Pro', preheader: 'Works offline on iPhone, and syncs with the website.',
        kicker: 'A-List Pro', title: `The business side, handled${hi}.`,
        blocks: [
          { kind: 'p', text: 'Here’s what A-List Pro adds:' },
          { kind: 'list', items: [
            '<strong>Sync Online.</strong> Works offline on iPhone, and syncs with iPad and the website.',
            '<strong>Wrap Wallet.</strong> Income and expenses with Canadian tax rules: your $30k GST/HST line, and what to set aside for CPP and income tax.',
            '<strong>Green Lit.</strong> Back every Wallet entry and union day with proof, up to 5 GB.',
            '<strong>Your Ledger.</strong> PDF and spreadsheet reports for a union application or tax time, up to 3 a month.',
          ] },
        ],
        cta: { label: 'Open CineArch on the web', url: links.site },
      };
      break;
  }

  const html = layout({ ...e, links });
  const lines = e.blocks.flatMap(b => b.kind === 'p' ? [strip(b.text!)] : (b.items ?? []).map((t, i) => `${b.kind === 'steps' ? `${i + 1}.` : '-'} ${strip(t)}`));
  return { subject: e.subject, preheader: e.preheader, html, text: plain(strip(e.title), lines, e.cta, links) };
}
