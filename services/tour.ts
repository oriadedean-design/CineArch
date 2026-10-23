import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour.css';
import { PLANS } from '../types';

// The table read on the website: a spotlight walk through the real dock, one
// step of the flow at a time (same order as WalkthroughView on the phone).
// Shown once per account after Setting the Scene (profiles.web_tour_seen_at,
// also noted in this browser in case saving fails); replay it from Your Config.

const SEEN = 'cinearch.tourSeen';

export const tourSeenHere = () => { try { return localStorage.getItem(SEEN) === '1'; } catch { return false; } };

export const startTour = (onDone?: () => void) => {
  const pro = PLANS.pro.label;
  const tour = driver({
    showProgress: true,
    progressText: 'Scene {{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Roll camera',
    popoverClass: 'cinearch-tour',
    stagePadding: 6,
    stageRadius: 0,
    overlayOpacity: 0.8,
    onDestroyed: () => { try { localStorage.setItem(SEEN, '1'); } catch { /* private window */ } onDone?.(); },
    steps: [
      { popover: { title: 'Table read', description: 'A one-minute walk through CineArch: mark your days, check your pay, count toward your card, and keep the business side in order. Skip any time with Esc.' } },
      { element: '[data-tour="mark"]', popover: { title: 'Mark the slate', description: 'After each day on set, hit the clapperboard: the production, your role, hours and whose set it was. CineArch works out overtime and checks your rate against the union minimum.', side: 'top' } },
      { element: '[data-tour="/jobs"]', popover: { title: 'Your Slate', description: 'Every day you\'ve marked. Open one to see who booked it and what you kept after commission.', side: 'top' } },
      { element: '[data-tour="/"]', popover: { title: 'Your Wrap', description: 'Days on a union set count toward that union\'s card, even before you\'re a member. Your Wrap shows how close you are and what\'s coming up.', side: 'top' } },
      { element: '[data-tour="/finance"]', popover: { title: `Your Wallet · ${pro}`, description: 'Income and expenses with Canadian tax rules: your $30k GST/HST line and what to set aside for CPP and income tax.', side: 'top' } },
      { element: '[data-tour="/reports"]', popover: { title: `Your Ledger · ${pro}`, description: 'PDF and spreadsheet reports for a union application or tax time. Up to 3 reports a month.', side: 'top' } },
      { element: '[data-tour="/settings"]', popover: { title: 'Your Config', description: 'Where you\'re based, how you\'re paid, your agents and their commission, and feedback to the developers. This walkthrough is here too.', side: 'top' } },
    ],
  });
  tour.drive();
};
