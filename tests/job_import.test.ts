import { beforeAll, describe, expect, it } from 'vitest';
import {
  setEngineSnapshot, setRateLines, buildImport, detectDateOrder, guessMapping, parseDate, TEMPLATE_CSV,
  type EngineSnapshot, type RateLine,
} from '../services/engine';
import fixture from './fixtures/pay_engine.json';

beforeAll(() => {
  setEngineSnapshot(fixture.snapshot as unknown as EngineSnapshot);
  setRateLines(fixture.lines as unknown as Record<string, RateLine[]>);
});

const ctx = { userId: 'u1', defaultProvince: 'Ontario', existing: [] };

describe('column mapping', () => {
  it('maps the template headers to every field', () => {
    const headers = TEMPLATE_CSV.split('\n')[0].split(',');
    const mapping = guessMapping(headers);
    expect(mapping).toMatchObject({
      productionName: 'Production', companyName: 'Production company', role: 'Role', startDate: 'Date',
      days: 'Days', hoursPerDay: 'Hours per day', mealBreakMinutes: 'Meal break', hourlyRate: 'Hourly rate',
      grossEarnings: 'Gross pay', union: 'Union', province: 'Province', productionType: 'Production type',
    });
  });

  it('maps a CineArch report export back onto the right fields', () => {
    const exported = ['Production', 'Production company', 'Role', 'Date', 'End Date', 'Days', 'Hours per day', 'Meal break',
      'Total hours', 'Overtime hours', 'Hourly rate', 'Union minimum', 'Gross pay', 'Union', 'Production type', 'Province',
      'Department', 'Status', 'Notes'];
    expect(guessMapping(exported)).toMatchObject({
      startDate: 'Date', hoursPerDay: 'Hours per day', totalHours: 'Total hours', hourlyRate: 'Hourly rate',
      grossEarnings: 'Gross pay', union: 'Union', productionType: 'Production type', notes: 'Notes',
    });
  });

  it("doesn't let 'Total hours' take the hours-per-day field", () => {
    expect(guessMapping(['Show', 'Total Hours', 'Hours'])).toMatchObject({ totalHours: 'Total Hours', hoursPerDay: 'Hours' });
  });
});

describe('dates', () => {
  it('reads day/month when a day is over 12', () => {
    expect(detectDateOrder(['03/04/2026', '25/04/2026'])).toEqual({ order: 'dmy', ambiguous: false });
    expect(parseDate('03/04/2026', 'dmy')).toBe('2026-04-03');
  });
  it('flags columns that could be read either way', () => {
    expect(detectDateOrder(['03/04/2026'])).toEqual({ order: 'mdy', ambiguous: true });
  });
  it('rejects impossible dates', () => {
    expect(parseDate('2026-02-30', 'ymd')).toBeUndefined();
  });
});

describe('buildImport', () => {
  const header = TEMPLATE_CSV.split('\n')[0].split(',');
  const rows = (lines: string[][]) => lines.map(cells => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])));
  const mapping = guessMapping(header);

  it('fills in the union minimum and pays overtime by the agreement', async () => {
    const result = await buildImport(rows([
      ['Night Shift', 'Northern Pictures', 'Grip', '2026-09-14', '5', '13', '60', '', '', 'IATSE 873', 'ON', 'Feature Film'],
    ]), mapping, ctx);
    expect(result.errors).toEqual([]);
    expect(result.jobs[0]).toMatchObject({
      isUnion: true, unionTypeId: 'u-873', hourlyRate: 48.60, unionMinimumRate: 48.60, ratePosition: 'Grip',
      totalHours: 60, overtimeHours: 20, grossEarnings: 3402, daysWorked: 5, department: 'Grip',
    });
  });

  it('keeps a non-union rate as given and flags pay below scale on union sets', async () => {
    const result = await buildImport(rows([
      ['Student Short', 'Indie Collective', 'Background Performer', '2026-09-20', '1', '10', '30', '22', '', 'non-union'],
      ['Big Show', 'Studio Co', 'Grip', '2026-09-21', '1', '9', '60', '40', '', 'IATSE 873', 'Ontario', 'Feature Film'],
    ]), mapping, ctx);
    expect(result.jobs[0]).toMatchObject({ isUnion: false, hourlyRate: 22, totalHours: 9.5, grossEarnings: 209 });
    expect(result.totals).toMatchObject({ rows: 2, union: 1, nonUnion: 1, belowScale: 1 });
  });

  it('reports problem rows by spreadsheet row number and skips duplicates', async () => {
    const result = await buildImport(rows([
      ['Night Shift', '', 'Grip', '2026-09-14'],
      ['Night Shift', 'Northern Pictures', 'Grip', 'someday'],
      ['Night Shift', 'Northern Pictures', 'Grip', '2026-09-14', '1', '12', '', '', '', 'Local 999'],
      ['Night Shift', 'Northern Pictures', 'Grip', '2026-09-15', '1', '12'],
      ['Night Shift', 'Northern Pictures', 'Grip', '2026-09-15', '1', '12'],
    ]), mapping, { ...ctx, existing: [] });
    expect(result.errors.map(e => e.row)).toEqual([2, 3, 4]);
    expect(result.errors[0].message).toMatch(/company/);
    expect(result.duplicates).toBe(1);
    expect(result.jobs).toHaveLength(1);
  });

  it('rejects a production type the union has no rate card for', async () => {
    const result = await buildImport(rows([
      ['Night Shift', 'Northern Pictures', 'Grip', '2026-09-14', '1', '10', '', '', '', 'IATSE 873', 'Ontario', 'Music Video'],
    ]), mapping, ctx);
    expect(result.errors[0].message).toMatch(/rate card/);
  });
});
