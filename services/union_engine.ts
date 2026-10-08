import { CanadianProvince, type OntarioRegion, type UnionType, type UnionTier } from '../types';

// The union engine. Its data lives in Supabase (unions, union_jurisdictions,
// union_tiers, union_requirements, union_departments, departments, roles,
// role_coverage, department_coverage, rate_schedules, rate_lines) and is
// edited there. This module holds the latest snapshot in memory and answers
// lookups synchronously. The app loads it via services/engine_loader.ts,
// the public guide at build time.

// ── Snapshot shape (union_engine_snapshot()) ────────────────

// [role_or_department_id, province, region, union_id, relationship, notes]
type CoverageTuple = [string, string, string | null, string, 'primary' | 'shared', string | null];

interface SnapshotUnion {
  id: string;
  name: string;
  scope: string | null;
  description: string;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  applicationFee: number | null;
  applicationFeeNotes: string | null;
  duesRate: number | null;
  duesNotes: string | null;
  residencyRule: string | null;
  jurisdictionalNotes: string | null;
  memberBenefits: string[];
  needsVerification: string[];
  sourceUrls: string[];
  lastVerified: string | null;
  jurisdictions: UnionJurisdiction[];
  tiers: UnionTier[];
  requirements: UnionRequirement[];
  departments: string[];
}

export interface UnionJurisdiction {
  province: string;
  region: OntarioRegion | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  needsVerification: boolean;
}

export interface UnionRequirement {
  kind: 'requirement' | 'application_step';
  province: string | null;
  caucus: string | null;
  text: string;
}

export interface IndustryRole {
  id: string;
  name: string;
  code?: string;
  description?: string;   // omitted = "Description coming soon"
  requirements?: string[];
  aliases?: string[];
  isTrainee?: boolean;
}

export interface IndustryDepartment {
  id: string;
  name: string;
  code?: string;
  description: string;
  roles: IndustryRole[];
}

export interface RateRow { title: string; rates: (number | null)[] }
export interface RateSection { department: string; note?: string; rows: RateRow[] }
export interface RateSchedule {
  id: string;
  unionId: string;
  title: string;
  effectiveFrom: string;
  effectiveTo: string;
  columns: string[];
  rateUnit: string;
  sourceUrl?: string;
  sections: RateSection[];
}

export interface EngineSnapshot {
  version: number;
  unions: SnapshotUnion[];
  departments: { id: string; name: string; code: string | null; description: string | null; roles: { id: string; name: string; code: string | null; description: string | null; requirements: string[]; aliases: string[]; isTrainee: boolean }[] }[];
  roleCoverage: CoverageTuple[];
  departmentCoverage: CoverageTuple[];
  rateSchedules: { id: string; unionId: string; title: string; effectiveFrom: string; effectiveTo: string | null; columns: string[]; rateUnit: string; sourceUrl: string | null; notes: string | null;
    lines: { department: string; departmentNote: string | null; position: string; rates: (number | null)[] }[] }[];
}

export interface EngineUnion extends UnionType {
  scope?: string;
  website?: string;
  duesNotes?: string;
  sourceUrls: string[];
  lastVerified?: string;
  jurisdictions: UnionJurisdiction[];
  requirements: UnionRequirement[];
}

export interface Coverage {
  unionId: string;
  relationship: 'primary' | 'shared';
  notes: string | null;
}

// ── State ───────────────────────────────────────────────────

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const opt = <T,>(v: T | null | undefined): T | undefined => v ?? undefined;

const requirementLabel = (q: UnionRequirement) =>
  [q.province, q.caucus].filter(Boolean).join(', ') ? `${[q.province, q.caucus].filter(Boolean).join(', ')}: ${q.text}` : q.text;

const toUnion = (u: SnapshotUnion): EngineUnion => {
  const provinces = [...new Set(u.jurisdictions.map(j => j.province))] as CanadianProvince[];
  const ontarioRegions = u.jurisdictions.filter(j => j.province === CanadianProvince.ON && j.region).map(j => j.region as OntarioRegion);
  return {
    id: u.id,
    name: u.name,
    description: u.description,
    defaultDuesRate: opt(u.duesRate),
    tiers: u.tiers.map(t => ({ ...t, description: t.description ?? '' })),
    joiningRequirements: u.requirements.filter(q => q.kind === 'requirement').map(requirementLabel),
    applicationProcess: u.requirements.filter(q => q.kind === 'application_step').map(requirementLabel),
    memberBenefits: u.memberBenefits,
    residencyRule: opt(u.residencyRule),
    applicationFee: opt(u.applicationFee),
    applicationFeeNotes: opt(u.applicationFeeNotes),
    contactEmail: opt(u.contactEmail),
    contactPhone: opt(u.contactPhone),
    jurisdictionalNotes: opt(u.jurisdictionalNotes),
    regions: provinces,
    ontarioRegions: ontarioRegions.length > 0 ? ontarioRegions : undefined,
    departments: u.departments,
    needsVerification: u.needsVerification,
    scope: opt(u.scope),
    website: opt(u.website),
    duesNotes: opt(u.duesNotes),
    sourceUrls: u.sourceUrls,
    lastVerified: opt(u.lastVerified),
    jurisdictions: u.jurisdictions,
    requirements: u.requirements,
  };
};

const indexCoverage = (rows: CoverageTuple[]) => {
  const byKey = new Map<string, CoverageTuple[]>();
  for (const row of rows) {
    const list = byKey.get(row[0]) ?? [];
    list.push(row);
    byKey.set(row[0], list);
  }
  return byKey;
};

const build = (s: EngineSnapshot) => {
  const unions = s.unions.map(toUnion);
  const departments: IndustryDepartment[] = s.departments.map(d => ({
    id: d.id,
    name: d.name,
    code: opt(d.code),
    description: d.description ?? '',
    roles: d.roles.map(r => ({
      id: r.id, name: r.name, code: opt(r.code), description: opt(r.description),
      requirements: r.requirements, aliases: r.aliases, isTrainee: r.isTrainee,
    })),
  }));
  const roleByName = new Map<string, IndustryRole>();
  for (const d of departments) for (const r of d.roles) {
    for (const n of [r.name, ...(r.aliases ?? [])]) if (!roleByName.has(normalize(n))) roleByName.set(normalize(n), r);
  }
  const rateSchedules: RateSchedule[] = s.rateSchedules.map(rs => {
    const sections: RateSection[] = [];
    for (const l of rs.lines) {
      let section = sections[sections.length - 1];
      if (!section || section.department !== l.department) {
        section = { department: l.department, note: opt(l.departmentNote), rows: [] };
        sections.push(section);
      }
      section.rows.push({ title: l.position, rates: l.rates });
    }
    return { id: rs.id, unionId: rs.unionId, title: rs.title, effectiveFrom: rs.effectiveFrom, effectiveTo: rs.effectiveTo ?? rs.effectiveFrom,
      columns: rs.columns, rateUnit: rs.rateUnit, sourceUrl: opt(rs.sourceUrl), sections };
  });
  return {
    version: s.version,
    unions,
    unionById: new Map(unions.map(u => [u.id, u])),
    departments,
    deptByName: new Map(departments.map(d => [normalize(d.name), d])),
    roleByName,
    roleCoverage: indexCoverage(s.roleCoverage),
    departmentCoverage: indexCoverage(s.departmentCoverage),
    rateSchedules,
  };
};

const EMPTY: EngineSnapshot = { version: 0, unions: [], departments: [], roleCoverage: [], departmentCoverage: [], rateSchedules: [] };
let engine = build(EMPTY);

export const setEngineSnapshot = (snapshot: EngineSnapshot) => { engine = build(snapshot); };
export const getEngineVersion = () => engine.version;
export const isEngineLoaded = () => engine.version > 0;

// ── Lookups ─────────────────────────────────────────────────

// Sub-regions only narrow things when we know them; "elsewhere in Ontario" stays unfiltered.
const knownRegion = (province: string, region?: string): OntarioRegion | undefined =>
  province === CanadianProvince.ON && region && region !== 'OTHER' ? region as OntarioRegion : undefined;

const operatesIn = (unionId: string, province: string, region?: OntarioRegion) => {
  const u = engine.unionById.get(unionId);
  if (!u) return false;
  return u.jurisdictions.some(j => j.province === province && (!region || !j.region || j.region === region));
};

export const findRole = (name: string) => engine.roleByName.get(normalize(name)) ?? null;

/**
 * Which unions cover a role where it's worked. Catalog roles use
 * role_coverage; other titles fall back to their department's coverage.
 * Region rows (Northern Ontario, Ottawa) replace the province rows.
 */
export const getCoverage = (province: string, role: string, department: string, { region }: { region?: string } = {}): Coverage[] => {
  const catalogRole = findRole(role);
  const dept = engine.deptByName.get(normalize(department));
  const rows = catalogRole
    ? engine.roleCoverage.get(catalogRole.id) ?? []
    : dept ? engine.departmentCoverage.get(dept.id) ?? [] : [];

  const reg = knownRegion(province, region);
  const inProvince = rows.filter(c => c[1] === province);
  const regional = reg ? inProvince.filter(c => c[2] === reg) : [];
  const chosen = regional.length > 0 ? regional : inProvince.filter(c => c[2] === null);

  const seen = new Set<string>();
  return chosen
    .filter(c => operatesIn(c[3], province, reg) && !seen.has(c[3]) && seen.add(c[3]))
    .map(c => ({ unionId: c[3], relationship: c[4], notes: c[5] }));
};

export const resolveGuildsForRole = (province: string, role: string, department: string, options: { region?: string } = {}): string[] =>
  getCoverage(province, role, department, options).map(c => c.unionId);

export const resolveGuildForRole = (province: string, role: string, department: string, options?: { region?: string }): string | undefined =>
  resolveGuildsForRole(province, role, department, options)[0];

export const getUnionSpec = (id: string): EngineUnion | null => engine.unionById.get(id) ?? null;
export const getAllUnions = (): EngineUnion[] => engine.unions;
export const getDepartments = (): IndustryDepartment[] => engine.departments;
export const getRateSchedule = (unionId: string): RateSchedule | undefined => engine.rateSchedules.find(s => s.unionId === unionId);

// Unions that operate in a province (and Ontario region, when known).
export const getUnionsForProvince = (province: string, region?: string) =>
  engine.unions.filter(u => operatesIn(u.id, province, knownRegion(province, region)));

// Looks a union up by id or by the name people write in a CSV / older rows
// ("IATSE 873", "Directors Guild of Canada", "UBCP").
const ALIASES: Record<string, string> = {
  'directors guild of canada': 'u-dgc',
  'writers guild of canada': 'u-wgc',
  'ubcp': 'u-ubcp',
  'nabet': 'u-nabet',
  'nabet 700-m': 'u-nabet',
  'aqtis': 'u-aqtis',
  'union des artistes': 'u-uda',
};

export const findUnion = (idOrName?: string | null): EngineUnion | null => {
  if (!idOrName) return null;
  const byId = engine.unionById.get(idOrName);
  if (byId) return byId;
  const n = normalize(idOrName);
  return engine.unions.find(u => normalize(u.name) === n) ?? (ALIASES[n] ? engine.unionById.get(ALIASES[n]) ?? null : null);
};
