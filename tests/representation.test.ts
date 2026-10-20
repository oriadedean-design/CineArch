import { describe, it, expect } from 'vitest';
import { commissionsOn, takeHome, type Rep } from '../services/representation';

const agent: Rep = { id: 'a', name: 'Dana', commission_pct: 10, applies_to: 'booked' };
const manager: Rep = { id: 'm', name: 'Sam', commission_pct: 15, applies_to: 'all' };

describe('commission on a job', () => {
  it('takes the booking agent and anyone on every job', () => {
    const c = commissionsOn({ grossEarnings: 1000, representativeId: 'a' }, [agent, manager]);
    expect(c.map(x => [x.rep.id, x.amount])).toEqual([['a', 100], ['m', 150]]);
    expect(takeHome(1000, c)).toBe(750);
  });
  it('leaves out an agent who did not book it', () => {
    expect(commissionsOn({ grossEarnings: 1000, representativeId: 'other' }, [agent]).length).toBe(0);
    expect(commissionsOn({ grossEarnings: 1000 }, [agent]).length).toBe(0);
  });
  it('matches a typed agent name when no representative was picked', () => {
    expect(commissionsOn({ grossEarnings: 500, agentName: 'Dana' }, [agent])[0].amount).toBe(50);
  });
  it('rounds to the cent and skips unpaid jobs', () => {
    expect(commissionsOn({ grossEarnings: 333.33, representativeId: 'a' }, [agent])[0].amount).toBe(33.33);
    expect(commissionsOn({ grossEarnings: 0 }, [manager])).toEqual([]);
  });
});
