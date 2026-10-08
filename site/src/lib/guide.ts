// Public union & jurisdiction guide data.
// Read from the union engine tables in Supabase at build time, through the
// same engine module the web app uses, so the guide and the app's
// eligibility logic can't drift apart.
import {
  setEngineSnapshot, setRateLines, getAllUnions, getDepartments, getCurrentRateSchedules, getRateSections, getPayRules, getCoverage,
  type EngineSnapshot, type EngineUnion, type Coverage, type RateLine, type RateSchedule, type RateSection, type PayRule,
} from '../../../services/union_engine';
import { CanadianProvince, ONTARIO_REGION_LABELS, type OntarioRegion } from '../../../types';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !anonKey) throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY to build the guide.');

const rpc = async (fn: string, args: object) => {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${fn} failed: ${res.status} ${await res.text()}`);
  return res.json();
};

setEngineSnapshot(await rpc('union_engine_snapshot', {}) as EngineSnapshot);

// Rates in effect on the build date (or each union's latest, if none are).
export const BUILD_DATE = new Date().toISOString().slice(0, 10);
const currentSchedules = new Map(getAllUnions().map(u => [u.id, getCurrentRateSchedules(u.id, BUILD_DATE)]));
setRateLines(await rpc('rate_schedule_lines', {
  p_schedule_ids: [...currentSchedules.values()].flat().map(s => s.id),
}) as Record<string, RateLine[]>);

export interface UnionRates {
  schedules: (RateSchedule & { sections: RateSection[] })[];
  payRule?: PayRule;
  departmentRules: PayRule[];   // e.g. 873 Transportation
}

export const ratesFor = (unionId: string): UnionRates | undefined => {
  const schedules = (currentSchedules.get(unionId) ?? []).map(s => ({ ...s, sections: getRateSections(s) }));
  if (schedules.length === 0) return undefined;
  const rules = getPayRules(unionId);
  return { schedules, payRule: rules.find(r => !r.departmentId), departmentRules: rules.filter(r => r.departmentId) };
};

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Unions ──────────────────────────────────────────────────

export interface GuideUnion extends EngineUnion {
  slug: string;
}

export const UNIONS: GuideUnion[] = getAllUnions()
  .map(u => ({ ...u, slug: slugify(u.name) }))
  .sort((a, b) => a.name.localeCompare(b.name));

const unionById = new Map(UNIONS.map(u => [u.id, u]));
export const getUnion = (id: string) => unionById.get(id);

// ── Provinces ───────────────────────────────────────────────

export interface GuideProvince {
  name: string;
  code: string;
  slug: string;
}

export const PROVINCES: GuideProvince[] = Object.entries(CanadianProvince).map(([code, name]) => ({
  code,
  name,
  slug: slugify(name),
}));

// ── Roles ───────────────────────────────────────────────────

export interface GuideRole {
  name: string;
  slug: string;
  department: string;
  departmentSlug: string;
  description: string;
  requirements: string[];
}

export interface GuideDepartment {
  name: string;
  slug: string;
  description: string;
  roles: GuideRole[];
}

const seenRoleSlugs = new Set<string>();

export const DEPARTMENTS: GuideDepartment[] = getDepartments().map(d => ({
  name: d.name,
  slug: slugify(d.name),
  description: d.description,
  roles: d.roles
    .map(r => {
      let slug = slugify(r.name);
      // Same title can appear in two departments; keep URLs unique.
      if (seenRoleSlugs.has(slug)) slug = `${slug}-${slugify(d.name)}`;
      seenRoleSlugs.add(slug);
      return {
        name: r.name,
        slug,
        department: d.name,
        departmentSlug: slugify(d.name),
        description: r.description ?? '',
        requirements: r.requirements ?? [],
      };
    }),
}));

export const ROLES: GuideRole[] = DEPARTMENTS.flatMap(d => d.roles);

// ── Jurisdiction resolution ─────────────────────────────────

// Parts of a province with different locals. Only Ontario is split today;
// "elsewhere in Ontario" isn't published because its coverage isn't sourced.
export interface GuideArea {
  region?: OntarioRegion;
  label?: string;
  note?: string;
}

const ONTARIO_AREAS: OntarioRegion[] = ['TORONTO', 'NORTHERN_ON', 'OTTAWA'];

// A region is flagged when a union covering it lists it as unverified.
const areaNote = (region: OntarioRegion) => {
  const label = ONTARIO_REGION_LABELS[region];
  return getAllUnions().some(u => u.jurisdictions.some(j => j.region === region && j.needsVerification))
    ? `${label} coverage is awaiting confirmation from the union.`
    : undefined;
};

export const areasFor = (province: GuideProvince): GuideArea[] =>
  province.name === CanadianProvince.ON
    ? ONTARIO_AREAS.map(region => ({ region, label: ONTARIO_REGION_LABELS[region], note: areaNote(region) }))
    : [{}];

// Coverage rows for a role in a province or area, with any notes (e.g. which city's local).
export const coverageFor = (province: GuideProvince, role: GuideRole, area: GuideArea = {}): (Coverage & { union: GuideUnion })[] =>
  getCoverage(province.name, role.name, role.department, { region: area.region })
    .map(c => ({ ...c, union: unionById.get(c.unionId) }))
    .filter((c): c is Coverage & { union: GuideUnion } => !!c.union);

// Unions that cover a role in a province or area (first = primary, rest = competing/overlapping).
export const unionsFor = (province: GuideProvince, role: GuideRole, area: GuideArea = {}): GuideUnion[] =>
  coverageFor(province, role, area).map(c => c.union);

// The distinct notes on a set of coverage rows.
export const coverageNotes = (rows: Coverage[]) => [...new Set(rows.flatMap(c => c.notes ? [c.notes] : []))];

const coversAnywhere = (province: GuideProvince, role: GuideRole, unionId: string) =>
  areasFor(province).some(area => unionsFor(province, role, area).some(u => u.id === unionId));

// Every province where a union covers at least one role, with those roles
// and (for split provinces) the areas it covers.
export const coverageForUnion = (union: GuideUnion) =>
  PROVINCES.map(province => ({
    province,
    areas: areasFor(province)
      .filter(area => area.label && ROLES.some(role => unionsFor(province, role, area).some(u => u.id === union.id)))
      .map(area => area.label as string),
    roles: ROLES.filter(role => coversAnywhere(province, role, union.id)),
  })).filter(c => c.roles.length > 0);

// Unions active anywhere in a province, with the roles each covers there.
export const unionsInProvince = (province: GuideProvince) => {
  const byUnion = new Map<string, { union: GuideUnion; roles: GuideRole[] }>();
  for (const role of ROLES) {
    const unions = new Map(areasFor(province).flatMap(area => unionsFor(province, role, area)).map(u => [u.id, u]));
    for (const union of unions.values()) {
      const entry = byUnion.get(union.id) ?? { union, roles: [] };
      entry.roles.push(role);
      byUnion.set(union.id, entry);
    }
  }
  return [...byUnion.values()].sort((a, b) => b.roles.length - a.roles.length);
};

// ── Formatting ──────────────────────────────────────────────

const TARGET_LABEL: Record<string, string> = {
  HOURS: 'hours',
  DAYS: 'days worked',
  CREDITS: 'qualifying credits',
  EARNINGS: 'in earnings',
};

export const formatTier = (t: EngineUnion['tiers'][number]) =>
  t.targetType === 'EARNINGS'
    ? `$${t.targetValue.toLocaleString('en-CA')} ${TARGET_LABEL.EARNINGS}`
    : `${t.targetValue.toLocaleString('en-CA')} ${TARGET_LABEL[t.targetType] ?? t.targetType.toLowerCase()}`;

export const formatPercent = (rate: number) => `${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 2)}%`;
