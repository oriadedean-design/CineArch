import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLANS } from '../types';

// What the plans promise must stay in step with docs/plan-benefits.md
// (where each claim is checked) and with the iPhone app's wording.
const audit = readFileSync(new URL('../docs/plan-benefits.md', import.meta.url), 'utf8');
const swift = readFileSync(new URL('../ios/CineArch/Data/Plans.swift', import.meta.url), 'utf8');

const swiftPlan = (id: string) => {
  const block = swift.slice(swift.indexOf(`id: "${id}"`));
  const body = block.slice(0, block.indexOf('])'));
  return {
    name: /name: "([^"]+)"/.exec(body)?.[1],
    pitch: /pitch: "([^"]+)"/.exec(body)?.[1],
    includes: [...body.slice(body.indexOf('includes:')).matchAll(/"((?:[^"\\]|\\.)+)"/g)].map(m => m[1].replace(/\\"/g, '"')),
  };
};

describe('plan benefits', () => {
  for (const plan of Object.values(PLANS)) {
    it(`${plan.label}: every benefit has a row in docs/plan-benefits.md`, () => {
      for (const b of plan.benefits) expect(audit).toContain(`| ${plan.label} | ${b} |`);
    });

    it(`${plan.label}: the iPhone app says the same thing`, () => {
      const ios = swiftPlan(plan.id);
      expect(ios.name).toBe(plan.label);
      expect(ios.pitch).toBe(plan.desc);
      expect(ios.includes).toEqual(plan.benefits);
    });
  }

  it('the audit has no rows for benefits the plans no longer promise', () => {
    const rows = [...audit.matchAll(/^\| (Indie Log|A-List Pro|Agency Command) \| (.+?) \|/gm)].map(m => `${m[1]}|${m[2]}`);
    const promised = Object.values(PLANS).flatMap(p => p.benefits.map(b => `${p.label}|${b}`));
    expect(rows.sort()).toEqual(promised.sort());
  });
});
