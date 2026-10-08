// Public union & jurisdiction guide data.
// Built from the same sources the web app uses (config/unions/* via the
// union engine, config/industry_roles.ts), so the guide and the app's
// eligibility logic can't drift apart.
import { UNION_REGISTRY } from '../../../config/unions/registry';
import { INDUSTRY_DEPARTMENTS } from '../../../config/industry_roles';
import { resolveGuildsForRole } from '../../../services/union_engine';
import { CanadianProvince, ONTARIO_REGION_LABELS, type OntarioRegion } from '../../../types';
import type { UnionType } from '../../../types';
import { RATE_SCHEDULES } from '../../../config/unions/rates/iatse_212_2025';

export const rateScheduleFor = (unionId: string) => RATE_SCHEDULES[unionId];

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Unions ──────────────────────────────────────────────────

export interface GuideUnion extends UnionType {
  slug: string;
}

export const UNIONS: GuideUnion[] = Object.values(UNION_REGISTRY)
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

export const DEPARTMENTS: GuideDepartment[] = INDUSTRY_DEPARTMENTS.map(d => ({
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
  return Object.values(UNION_REGISTRY).some(u => u.ontarioRegions?.includes(region) && u.needsVerification?.some(v => v.startsWith(label)))
    ? `${label} coverage is awaiting confirmation from the union.`
    : undefined;
};

export const areasFor = (province: GuideProvince): GuideArea[] =>
  province.name === CanadianProvince.ON
    ? ONTARIO_AREAS.map(region => ({ region, label: ONTARIO_REGION_LABELS[region], note: areaNote(region) }))
    : [{}];

// Unions that cover a role in a province or area (first = primary, rest = competing/overlapping).
export const unionsFor = (province: GuideProvince, role: GuideRole, area: GuideArea = {}): GuideUnion[] =>
  resolveGuildsForRole(province.name, role.name, role.department, { fallback: false, region: area.region })
    .map(id => unionById.get(id))
    .filter((u): u is GuideUnion => !!u);

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

export const formatTier = (t: UnionType['tiers'][number]) =>
  t.targetType === 'EARNINGS'
    ? `$${t.targetValue.toLocaleString('en-CA')} ${TARGET_LABEL.EARNINGS}`
    : `${t.targetValue.toLocaleString('en-CA')} ${TARGET_LABEL[t.targetType] ?? t.targetType.toLowerCase()}`;

export const formatPercent = (rate: number) => `${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 2)}%`;
