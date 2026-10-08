import { CanadianProvince, type OntarioRegion } from '../types';
import { NATIONAL_ROLE_MAPPING, NATIONAL_DEPT_MAPPING, PERFORMER_ROLES, WRITER_ROLES } from '../config/unions/national_standards';
import { PROVINCIAL_OVERRIDES, ONTARIO_REGIONAL_OVERRIDES, type OverrideRule } from '../config/unions/provincial_overrides';
import { UNION_REGISTRY } from '../config/unions/registry';

// The single union resolver. The app (onboarding, job logging, field manual)
// and the public guide both go through here.

export interface ResolveOptions {
  // The app always wants a suggestion; the public guide must not publish a guess.
  fallback?: boolean;
  // Ontario sub-region. Northern Ontario and Ottawa have their own technical local.
  region?: string;
}

const FALLBACK_UNION = 'u-873';

const matchesRole = (rule: OverrideRule, r: string) => !!rule.roles?.some(t => r.includes(t.toLowerCase()));
const matchesDept = (rule: OverrideRule, d: string) => !!rule.departments?.some(t => d.includes(t.toLowerCase()));

// Applies role rules, then (only if none matched) department rules.
const applyRules = (rules: OverrideRule[], r: string, d: string): string[] => {
  const byRole = rules.filter(rule => matchesRole(rule, r));
  const matched = byRole.length > 0 ? byRole : rules.filter(rule => matchesDept(rule, d));
  return matched.map(rule => rule.assignedUnionId);
};

const operatesIn = (unionId: string, prov: CanadianProvince, region?: OntarioRegion) => {
  const spec = UNION_REGISTRY[unionId];
  if (!spec) return false;
  if (spec.regions && !spec.regions.includes(prov)) return false;
  // Only filter by sub-region when we know it; "elsewhere in Ontario" stays unfiltered.
  if (prov === CanadianProvince.ON && region && region !== 'OTHER' && spec.ontarioRegions) {
    return spec.ontarioRegions.includes(region);
  }
  return true;
};

/**
 * Order of operation:
 * 1. Performers → ACTRA (UBCP/ACTRA in BC); writing staff → WGC
 * 2. Exclusive provincial rules (a match settles the role)
 * 3. Ontario regional rules (Northern Ontario / Ottawa → IATSE 634)
 * 4. Provincial role rules, then provincial department rules
 * 5. National standards
 * 6. Competition & overlap injectors (the "OR" logic from the matrix)
 * 7. Drop locals that don't operate in this province / region
 */
export const resolveGuildsForRole = (
  province: string,
  role: string,
  department: string,
  { fallback = true, region }: ResolveOptions = {}
): string[] => {
  const prov = province as CanadianProvince;
  const ontarioRegion = prov === CanadianProvince.ON ? region as OntarioRegion | undefined : undefined;
  const overrides = PROVINCIAL_OVERRIDES[prov] || [];

  // "Director of Photography" is camera, not direction: normalize it so
  // rules targeting "Director" don't capture it.
  const r = role.toLowerCase().replace('director of photography', 'dop');
  const d = department.toLowerCase();

  const finish = (ids: Iterable<string>) => {
    const out = [...new Set(ids)].filter(id => operatesIn(id, prov, ontarioRegion));
    if (out.length === 0 && fallback && operatesIn(FALLBACK_UNION, prov, ontarioRegion)) out.push(FALLBACK_UNION);
    return out;
  };

  // 1. Performers
  if (d.includes('performer') || PERFORMER_ROLES.some(t => r.includes(t.toLowerCase()))) {
    return finish([prov === CanadianProvince.BC ? 'u-ubcp' : 'u-actra']);
  }

  if (d.includes('writing') || WRITER_ROLES.some(t => r.includes(t.toLowerCase()))) {
    return finish(['u-wgc']);
  }

  // 2. Exclusive provincial rules
  const exclusive = overrides.filter(rule => rule.exclusive && (matchesRole(rule, r) || matchesDept(rule, d)));
  if (exclusive.length > 0) return finish(exclusive.map(rule => rule.assignedUnionId));

  // 3. Ontario regional rules
  const regional = ontarioRegion ? ONTARIO_REGIONAL_OVERRIDES[ontarioRegion] : undefined;
  if (regional) {
    const ids = applyRules(regional, r, d);
    if (ids.length > 0) return finish(ids);
  }

  // 4. Provincial rules
  const results = new Set<string>(applyRules(overrides.filter(rule => !rule.exclusive), r, d));

  // 5. National standards
  if (results.size === 0) {
    const nationalRole = Object.entries(NATIONAL_ROLE_MAPPING).find(([key]) => r.includes(key.toLowerCase()));
    const nationalDept = Object.entries(NATIONAL_DEPT_MAPPING).find(([key]) => d.includes(key.toLowerCase()));
    const national = nationalRole ?? nationalDept;
    if (national) results.add(national[1]);
  }

  // 6. Overlap injectors

  if (prov === CanadianProvince.ON) {
    // ON tech: IATSE 873 or NABET 700-M
    const techRoles = ['grip', 'electric', 'sound', 'props', 'set dec', 'costume', 'wardrobe', 'construction', 'paint', 'hair', 'makeup', 'special effects', 'greens'];
    if (techRoles.some(t => r.includes(t) || d.includes(t))) {
      results.add('u-873');
      results.add('u-nabet');
    }

    // ON transportation: Teamsters 938, NABET 700-M or IATSE 873
    if (r.includes('transportation') || r.includes('driver') || d.includes('transportation')) {
      results.add('u-t938');
      results.add('u-nabet');
      results.add('u-873');
    }

    // ON craft service: IATSE 411 Craftservice caucus or IATSE 873
    if (r.includes('craft')) {
      results.add('u-411');
      results.add('u-873');
    }
  }

  // AB: DGC or IATSE 212
  if (prov === CanadianProvince.AB) {
    const abOverlapRoles = ['production designer', 'art director', 'editor', 'accountant'];
    if (abOverlapRoles.some(t => r.includes(t))) {
      results.add('u-dgc');
      results.add('u-212');
    }
  }

  // BC: DGC or IATSE 891
  if (prov === CanadianProvince.BC && r.includes('editor')) {
    results.add('u-dgc');
    results.add('u-891');
  }

  // 7. Province / region filter (+ fallback)
  return finish(results);
};

export const resolveGuildForRole = (province: string, role: string, department: string, options?: ResolveOptions): string => {
  return resolveGuildsForRole(province, role, department, options)[0];
};

export const getUnionSpec = (id: string) => UNION_REGISTRY[id] || null;
export const getAllUnions = () => Object.values(UNION_REGISTRY);

// Unions that operate in a province (and Ontario region, when known).
export const getUnionsForProvince = (province: string, region?: string) =>
  getAllUnions().filter(u => operatesIn(u.id, province as CanadianProvince, province === CanadianProvince.ON ? region as OntarioRegion : undefined));

// Looks a union up by id or by the name people write in a CSV / older rows
// ("IATSE 873", "Directors Guild of Canada", "UBCP").
const ALIASES: Record<string, string> = {
  'directors guild of canada': 'u-dgc',
  'writers guild of canada': 'u-wgc',
  'ubcp': 'u-ubcp',
  'nabet': 'u-nabet',
  'nabet 700-m': 'u-nabet',
  'aqtis': 'u-aqtis',
};
const normalizeName = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export const findUnion = (idOrName?: string | null) => {
  if (!idOrName) return null;
  if (UNION_REGISTRY[idOrName]) return UNION_REGISTRY[idOrName];
  const n = normalizeName(idOrName);
  const byName = getAllUnions().find(u => normalizeName(u.name) === n);
  return byName ?? (ALIASES[n] ? UNION_REGISTRY[ALIASES[n]] : null);
};
