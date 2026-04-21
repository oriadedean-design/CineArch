
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
      roleIncludes: ['Director', 'Assistant Director', 'Script Supervisor'], 
      assignedUnionId: 'u-dgc' 
    }
  ],
  'Ontario': [
    { 
      roleIncludes: ['Production Coordinator', 'Assistant Coordinator', 'Craft'], 
      assignedUnionId: 'u-411' 
    },
    { 
      deptIncludes: ['Camera', 'Publicity'], 
      assignedUnionId: 'u-667' 
    },
    {
      roleIncludes: ['Script Supervisor'],
      assignedUnionId: 'u-873'
    }
  ],
  'British Columbia': [
    { 
      deptIncludes: ['Camera'], 
      assignedUnionId: 'u-669'
    },
    {
      deptIncludes: ['Director', 'Art', 'Logistics'],
      assignedUnionId: 'u-dgc'
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
    const lowRole = roleName.toLowerCase();
    const lowDept = deptName.toLowerCase();

    if (lowRole.includes('director') || lowRole.includes('set pa')) suggestions.add('u-dgc');
    else if (lowDept.includes('camera') || lowRole.includes('photographer')) suggestions.add('u-667');
    else if (lowRole.includes('actor') || lowRole.includes('stunt')) suggestions.add('u-actra');
    else suggestions.add('u-873');
  }

  return Array.from(suggestions);
};
