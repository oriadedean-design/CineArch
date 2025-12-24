
import { CanadianProvince } from '../types';
import { UNION_SPECS } from './unions_data';

/**
 * THE JURISDICTIONAL MAP
 * This defines the peculiarities of each province.
 * If a role/province combo isn't here, it falls back to Role Default.
 */

interface ProvincialRule {
  roleIncludes?: string[];
  deptIncludes?: string[];
  assignedUnionId: string;
}

export const PROVINCIAL_EXCEPTIONS: Record<string, ProvincialRule[]> = {
  'Quebec': [
    { 
      deptIncludes: ['Camera', 'Sound', 'Art', 'Construction', 'Grip', 'Electric'], 
      assignedUnionId: 'u-aqtis' 
    },
    { 
      roleIncludes: ['Director', 'Assistant Director'], 
      assignedUnionId: 'u-dgc' 
    }
  ],
  'Ontario': [
    { 
      roleIncludes: ['Production Coordinator', 'Assistant Coordinator', 'Craft'], 
      assignedUnionId: 'u-411' 
    },
    { 
      deptIncludes: ['Camera'], 
      assignedUnionId: 'u-667' 
    }
  ],
  'British Columbia': [
    { 
      deptIncludes: ['Camera'], 
      assignedUnionId: 'u-669' // Placeholder for 669
    }
  ]
};

/**
 * RESOLVER LOGIC
 * The primary engine to determine union eligibility.
 */
export const resolveUnionsForRole = (province: string, roleName: string, deptName: string): string[] => {
  const suggestions = new Set<string>();
  
  // 1. Check Provincial Exceptions
  const exceptions = PROVINCIAL_EXCEPTIONS[province] || [];
  exceptions.forEach(rule => {
    const roleMatch = rule.roleIncludes?.some(r => roleName.toLowerCase().includes(r.toLowerCase()));
    const deptMatch = rule.deptIncludes?.some(d => deptName.toLowerCase().includes(d.toLowerCase()));
    
    if (roleMatch || deptMatch) {
      suggestions.add(rule.assignedUnionId);
    }
  });

  // 2. If no provincial match found, use a baseline heuristic
  if (suggestions.size === 0) {
    if (roleName.includes('Director') || roleName.includes('Set PA')) suggestions.add('u-dgc');
    else if (deptName.includes('Camera')) suggestions.add('u-667');
    else suggestions.add('u-873');
  }

  return Array.from(suggestions);
};
