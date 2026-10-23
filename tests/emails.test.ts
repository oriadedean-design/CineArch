import { describe, it, expect } from 'vitest';
import { render, type Kind } from '../supabase/functions/_shared/templates';

// The onboarding emails (supabase/functions/_shared/templates.ts).
const links = { site: 'https://cine-arch.vercel.app', unsubscribe: 'https://cine-arch.vercel.app/#/unsubscribe?u=x&t=y' };
const kinds: Kind[] = ['welcome', 'scene_reminder', 'first_week', 'pro_welcome'];

describe('onboarding emails', () => {
  it('every email has a subject, both versions and the unsubscribe link; only Pro points to the website', () => {
    for (const k of kinds) {
      const e = render(k, { firstName: 'Nia', memberStatus: 'ASPIRING', province: 'Ontario' }, links);
      expect(e.subject.length).toBeGreaterThan(5);
      for (const body of [e.html, e.text]) {
        expect(body).toContain(links.unsubscribe);
        // Free accounts can't use the website, so their emails send them to the iPhone app.
        if (k === 'pro_welcome') expect(body).toContain('Open CineArch on the web');
        else expect(body).toContain('Open CineArch on your iPhone');
        expect(body).not.toMatch(/undefined|null|NaN/);
      }
    }
  });
  it('first week copy follows union status, and names the province', () => {
    const aspiring = render('first_week', { firstName: null, memberStatus: 'ASPIRING', province: 'Ontario' }, links);
    const member = render('first_week', { firstName: null, memberStatus: 'MEMBER', province: 'Ontario' }, links);
    expect(aspiring.subject).toBe('How your union days add up');
    expect(member.subject).toBe('Tracking your next level');
    expect(aspiring.text).toContain('in Ontario');
  });
  it('works without a name or province, and escapes names', () => {
    const e = render('welcome', { firstName: null, memberStatus: null, province: null }, links);
    expect(e.html).toContain("You're on the call sheet.");
    const sneaky = render('welcome', { firstName: '<b>x</b>', memberStatus: null, province: null }, links);
    expect(sneaky.html).not.toContain('<b>x</b>');
  });
  it('Pro welcome promises only what the plan lists', () => {
    const e = render('pro_welcome', { firstName: null, memberStatus: null, province: null }, links);
    expect(e.text).toContain('up to 3 a month');
    expect(e.text).toContain('up to 5 GB');
    expect(e.text).toContain('Works offline on iPhone');
  });
});
