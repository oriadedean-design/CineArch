// Commission on a job from your representatives (public.representatives).
// Same rule as RepresentationStore.commissions on the phone: the person who
// booked it, plus anyone who takes a cut of every job.

export interface Rep {
  id: string;
  name: string;
  commission_pct: number;
  applies_to: string;   // 'booked' | 'all'
}

export interface Commission { rep: Rep; amount: number }

const cents = (n: number) => Math.round(n * 100) / 100;

export const commissionsOn = (
  job: { grossEarnings?: number | null; representativeId?: string | null; agentName?: string | null },
  reps: Rep[],
): Commission[] => {
  const gross = job.grossEarnings ?? 0;
  if (gross <= 0) return [];
  return reps
    .filter(r => r.applies_to === 'all' || (job.representativeId ? job.representativeId === r.id : job.agentName === r.name))
    .map(r => ({ rep: r, amount: cents(gross * Number(r.commission_pct) / 100) }));
};

/** What you keep after every commission. */
export const takeHome = (gross: number, commissions: Commission[]) =>
  cents(gross - commissions.reduce((s, c) => s + c.amount, 0));
