import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// The privacy policy, shown on the website and linked from the app (Account >
// Privacy policy). Every statement here must match what the app actually does;
// change it whenever what we collect, where it's kept, or who handles it changes.
// App Store Review Guideline 5.1.1(i): what's collected and how it's used, who
// else handles it, retention and deletion, and how to ask us about it.

const UPDATED = 'October 23, 2026';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-accent">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-white/75">{children}</div>
  </section>
);

export const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-14 animate-in fade-in duration-700 max-w-3xl mx-auto">
      <button onClick={() => navigate('/resources')} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <header className="space-y-4">
        <span className="text-accent text-[10px] font-black uppercase tracking-[0.6em] block">Privacy policy</span>
        <h1 className="font-serif italic text-5xl md:text-6xl text-white leading-none">What we keep, and why.</h1>
        <p className="text-white/70">CineArch helps film and TV workers log their days, check their pay and track their union progress. This page explains what information that takes, where it's kept, who else handles it and how to delete it. Last updated {UPDATED}.</p>
      </header>

      <Section title="What we collect">
        <p><strong className="text-white">Your account:</strong> your email address, your name and a password. Passwords are stored by our login provider as a one-way hash; we never see them.</p>
        <p><strong className="text-white">Setting the Scene:</strong> your province and region, department, roles, whether you're a union member, your earning goal, how you're paid and your GST/HST method.</p>
        <p><strong className="text-white">Your work:</strong> the jobs you mark (production, company, role, dates, hours, rate, pay, union, who booked it and your notes), the unions you track, and your agents and managers with their commission.</p>
        <p><strong className="text-white">A-List Pro only:</strong> your Wrap Wallet entries (income and expenses) and the receipts, pay stubs and other documents you add as proof.</p>
        <p><strong className="text-white">Notes you send us</strong> from Feedback to the developers, and a record of which devices are signed in to your account (used to limit an account to a few devices).</p>
        <p>We don't collect your location or contacts, we don't use advertising or analytics tools, and we don't track you across other apps or websites.</p>
      </Section>

      <Section title="Where it's kept">
        <p>On the free Indie Log plan, the CineArch iPhone app keeps your jobs and union progress on your iPhone only. Your account, your Setting the Scene answers, your agents and managers and any notes you send are kept online so you can sign in and use them on the website.</p>
        <p>On A-List Pro, your jobs, union progress, Wrap Wallet and documents are kept online so they sync between your iPhone and the website.</p>
        <p>Information kept online is stored by Supabase in its Canada (Central) region. Supabase encrypts stored data (AES-256) and data in transit (TLS). Documents are kept in private storage that only your account can open.</p>
      </Section>

      <Section title="The camera and your photos">
        <p>CineArch asks for the camera only when you choose to scan a receipt or pay stub, and reads photos only when you pick one. A picture is uploaded only when you save it as proof on A-List Pro.</p>
      </Section>

      <Section title="How we use it">
        <p>Only to run CineArch for you: to work out your pay, union progress and tax set-asides, to show your records on your devices, to make the reports you ask for, and to answer your notes. We don't sell your information or share it for advertising.</p>
      </Section>

      <Section title="Who else handles it">
        <p><strong className="text-white">Supabase</strong> runs our database, sign-in and file storage. <strong className="text-white">Vercel</strong> hosts the website and receives the technical details any website sees, such as your IP address. The website loads its fonts from <strong className="text-white">Google Fonts</strong>, which receives your IP address when a page loads. <strong className="text-white">Apple</strong> delivers the iPhone app. Each handles information only to provide its service to us, under its own privacy terms.</p>
      </Section>

      <Section title="Keeping and deleting it">
        <p>We keep your information until you delete it or delete your account. Delete account (in Account on the iPhone, or Settings on the website) immediately and permanently deletes your login, jobs, union progress, agents and managers, documents, finance records and notes. Copies in our database provider's backups are removed when those backups expire.</p>
        <p>Deleting the iPhone app also deletes anything kept only on that iPhone.</p>
      </Section>

      <Section title="Your choices">
        <p>You can see and change your information in the app at any time, ask us what we hold about you, ask us to correct it, or withdraw your consent by deleting your account. To ask us anything about your privacy, send a note from Feedback to the developers (in Account on the iPhone, or Settings on the website).</p>
      </Section>
    </div>
  );
};
