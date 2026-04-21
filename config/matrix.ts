
import { CanadianProvince } from '../types';

/**
 * REGISTRY A: ROLE DEFAULTS (National)
 * Defines the "Natural Guild" for a role regardless of geography.
 */
export const NATIONAL_ROLE_DEFAULTS: Record<string, string> = {
  // Direction
  'Director': 'u-dgc',
  '1st Assistant Director': 'u-dgc',
  '2nd Assistant Director': 'u-dgc',
  'Set P.A.': 'u-dgc',
  
  // Camera
  'Director of Photography': 'u-667',
  '1st Assistant Camera': 'u-667',
  'Camera Trainee': 'u-667',
  
  // Production Office
  'Production Coordinator': 'u-411',
  'Office P.A.': 'u-411',
  
  // Performers
  'Actor': 'u-actra',
  'Stunt Performer': 'u-actra'
};

/**
 * REGISTRY B: JURISDICTIONAL AUTHORITY
 * Defines which guilds hold authority over specific departments in specific provinces.
 */
export const JURISDICTION_AUTHORITY: Record<string, Record<string, string>> = {
  [CanadianProvince.QC]: {
    'Camera Department': 'u-aqtis',
    'Art Department': 'u-aqtis',
    'Construction': 'u-aqtis',
    'Grip': 'u-aqtis',
    'Electric': 'u-aqtis'
  },
  [CanadianProvince.BC]: {
    'Camera Department': 'u-669'
  }
};

/**
 * THE RESOLVER
 * Intersects Role Defaults with Jurisdictional Authority.
 */
export const resolveGuildMatrix = (province: string, dept: string, role: string): string => {
  // 1. Check if the Province has a blanket authority over this Department
  const regionalDeptOverride = JURISDICTION_AUTHORITY[province]?.[dept];
  if (regionalDeptOverride) return regionalDeptOverride;

  // 2. Fallback to the National Default for this specific Role
  return NATIONAL_ROLE_DEFAULTS[role] || 'u-873'; // Default to 873 as a catch-all for tech
};
