
import { CanadianProvince } from '../types';
import { NATIONAL_ROLE_MAPPING, NATIONAL_DEPT_MAPPING } from '../config/unions/national_standards';
import { PROVINCIAL_OVERRIDES } from '../config/unions/provincial_overrides';
import { UNION_REGISTRY } from '../config/unions/registry';

/**
 * THE RESOLVER
 * Order of Operation:
 * 1. Specific Provincial Role Override
 * 2. Specific Provincial Department Override
 * 3. Competition & Overlap Injectors (The "OR" logic from the Matrix)
 * 4. National Standards Fallback
 */
export const resolveGuildsForRole = (province: string, role: string, department: string): string[] => {
  const prov = province as CanadianProvince;
  const overrides = PROVINCIAL_OVERRIDES[prov] || [];
  const results = new Set<string>();

  // Normalized inputs
  const r = role.toLowerCase();
  const d = department.toLowerCase();

  // 1. Check Provincial Overrides (Explicit Roles)
  const roleOverrides = overrides.filter(rule => 
    rule.roles?.some(target => r.includes(target.toLowerCase()))
  );
  roleOverrides.forEach(rule => results.add(rule.assignedUnionId));

  // 2. Check Provincial Overrides (Broader Departments)
  if (results.size === 0) {
    const deptOverrides = overrides.filter(rule => 
      rule.departments?.some(target => d.includes(target.toLowerCase()))
    );
    deptOverrides.forEach(rule => results.add(rule.assignedUnionId));
  }

  // 3. Fallback to National Standards
  if (results.size === 0) {
    const nationalRole = Object.entries(NATIONAL_ROLE_MAPPING).find(([key]) => 
      r.includes(key.toLowerCase())
    );
    if (nationalRole) results.add(nationalRole[1]);
    
    if (results.size === 0) {
      const nationalDept = Object.entries(NATIONAL_DEPT_MAPPING).find(([key]) => 
        d.includes(key.toLowerCase())
      );
      if (nationalDept) results.add(nationalDept[1]);
    }
  }

  // 4. COMPETITION & OVERLAP INJECTORS (The "OR" logic from Jurisdictional Matrix)
  
  // ONTARIO TECH: IATSE 873 or NABET 700-M
  if (prov === CanadianProvince.ON) {
    const techRoles = ['grip', 'electric', 'sound', 'props', 'set dec', 'costume', 'wardrobe', 'construction', 'paint', 'hair', 'makeup'];
    const isTech = techRoles.some(target => r.includes(target) || d.includes(target));
    if (isTech) {
       results.add('u-873');
       results.add('u-nabet');
    }

    // ON Transportation: Teamsters 938 or NABET 700-M
    if (r.includes('transportation') || r.includes('driver') || d.includes('transportation')) {
       results.add('u-t938');
       results.add('u-nabet');
    }
  }

  // ALBERTA: DGC or IATSE 212
  if (prov === CanadianProvince.AB) {
    const abOverlapRoles = ['production designer', 'art director', 'editor'];
    if (abOverlapRoles.some(target => r.includes(target))) {
       results.add('u-dgc');
       results.add('u-212');
    }
  }

  // BC: DGC or IATSE 891
  if (prov === CanadianProvince.BC) {
    if (r.includes('editor')) {
       results.add('u-dgc');
       results.add('u-891');
    }
  }

  // Fallback if empty
  if (results.size === 0) {
    results.add('u-873');
  }

  return Array.from(results);
};

export const resolveGuildForRole = (province: string, role: string, department: string): string => {
  return resolveGuildsForRole(province, role, department)[0];
};

export const getUnionSpec = (id: string) => UNION_REGISTRY[id] || null;
export const getAllUnions = () => Object.values(UNION_REGISTRY);
