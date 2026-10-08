
import { CanadianProvince, type OntarioRegion } from '../../types';

export interface OverrideRule {
  roles?: string[];
  departments?: string[];
  assignedUnionId: string;
  // A match settles the role: no other rules or overlap injectors apply.
  // For titles that contain another department's keyword ("Compliance Driver").
  exclusive?: boolean;
}

export const PROVINCIAL_OVERRIDES: Partial<Record<CanadianProvince, OverrideRule[]>> = {
  [CanadianProvince.BC]: [
    { roles: ['Actor', 'Stunt', 'Background Performer'], assignedUnionId: 'u-ubcp' },
    { roles: ['Script Supervisor', 'Coordinator', 'Grip', 'Electric', 'Sound', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Craft', 'First Aid'], assignedUnionId: 'u-891' },
    { roles: ['DOP / Operator', 'DOP', 'Assistant (1st/2nd)', 'Assistant Camera', 'Still Photographer'], assignedUnionId: 'u-669' },
    { roles: ['Driver', 'Transportation', 'Coordinator / Driver', 'Catering', 'Security'], assignedUnionId: 'u-t155' },
    { roles: ['Editor', 'Picture Editor', 'Sound Editor'], assignedUnionId: 'u-dgc' }, 
    { departments: ['Camera Department', 'Sound', 'Grip', 'Electric', 'Art Dept', 'Props', 'Set Dec', 'Costume', 'Construction', 'Paint', 'Hair', 'Makeup', 'First Aid', 'Craft', 'Greens', 'Special Effects', 'Accounting Department'], assignedUnionId: 'u-891' }
  ],
  [CanadianProvince.AB]: [
    { roles: ['DOP / Operator', 'DOP', 'Assistant (1st/2nd)', 'Assistant Camera', 'Still Photographer'], assignedUnionId: 'u-669' },
    { roles: ['Script Supervisor', 'Coordinator', 'Grip', 'Electric', 'Sound', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Craft', 'First Aid'], assignedUnionId: 'u-212' },
    { roles: ['Driver', 'Transportation', 'Coordinator / Driver', 'Security'], assignedUnionId: 'u-t362' },
    { roles: ['Production Designer', 'Art Director', 'Editor', 'Picture Editor', 'Accountant', 'Production Accountant'], assignedUnionId: 'u-dgc' },
    { departments: ['Grip', 'Electric', 'Lighting', 'Props', 'Production Sound', 'Special Effects', 'Greens', 'Costume', 'Hair', 'Makeup', 'Set Dec', 'Construction', 'Paint', 'Craft', 'First Aid', 'Script'], assignedUnionId: 'u-212' }
  ],
  [CanadianProvince.MB]: [
    { roles: ['DOP / Operator', 'DOP', 'Assistant (1st/2nd)', 'Assistant Camera', 'Still Photographer'], assignedUnionId: 'u-669' },
    { roles: ['Script Supervisor', 'Coordinator', 'Grip', 'Electric', 'Sound', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Craft', 'First Aid', 'Attendant', 'Server'], assignedUnionId: 'u-856' },
    { roles: ['Driver', 'Transportation', 'Security', 'Catering'], assignedUnionId: 'u-856' },
    { departments: ['First Aid', 'Craft', 'Art Dept', 'Construction', 'Costume', 'Greens', 'Grip', 'Hair', 'Electric', 'Lighting', 'Makeup', 'Paint', 'Props', 'Set Dec', 'Production Sound', 'Special Effects', 'Transportation', 'Script'], assignedUnionId: 'u-856' }
  ],
  [CanadianProvince.ON]: [
    { roles: ['Compliance Driver', 'Honeywagon'], assignedUnionId: 'u-411', exclusive: true },
    // DGC Ontario covers Picture Editing and Sound Editing; keeps "Sound Editor" out of the sound-crew rules.
    { roles: ['Editor'], assignedUnionId: 'u-dgc', exclusive: true },
    { roles: ['DOP / Operator', 'DOP', 'Assistant (1st/2nd)', 'Assistant Camera', 'Still Photographer', 'Publicity'], assignedUnionId: 'u-667' },
    { roles: ['Coordinator', 'Coordinator / Driver', 'Server', 'Craft Service'], assignedUnionId: 'u-411' },
    { roles: ['Script Supervisor'], assignedUnionId: 'u-873' },
    { roles: ['Driver', 'Transportation'], assignedUnionId: 'u-t938' },
    { departments: ['Grip', 'Electric', 'Sound', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Special Effects', 'Greens'], assignedUnionId: 'u-873' }
  ],
  [CanadianProvince.QC]: [
    { departments: ['Camera Department', 'Grip', 'Electric', 'Sound', 'Art Dept', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Transportation', 'Craft Service', 'First Aid', 'Accounting Department', 'Picture Editing', 'Sound Editing', 'Special Effects', 'Greens'], assignedUnionId: 'u-aqtis' },
    { roles: ['Director', '1st/2nd AD', 'Script Supervisor', 'Production Designer', 'Art Director', 'Editor'], assignedUnionId: 'u-dgc' }
  ],
  [CanadianProvince.NS]: [
    { roles: ['DOP / Operator', 'DOP', 'Assistant (1st/2nd)', 'Assistant Camera', 'Still Photographer'], assignedUnionId: 'u-667' },
    { roles: ['Script Supervisor', 'Coordinator', 'Grip', 'Electric', 'Sound', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Craft', 'First Aid', 'Transportation'], assignedUnionId: 'u-849' },
    { departments: ['Costume', 'Craft', 'Greens', 'Grip', 'Hair', 'Lighting', 'Electric', 'Makeup', 'Props', 'Paint', 'Script', 'Construction', 'Set Dec', 'Production Sound', 'Special Effects', 'Transportation'], assignedUnionId: 'u-849' }
  ]
};

const WESTERN_CAMERA: OverrideRule[] = [
  { roles: ['DOP / Operator', 'DOP', 'Assistant (1st/2nd)', 'Assistant Camera', 'Still Photographer'], assignedUnionId: 'u-669' }
];
PROVINCIAL_OVERRIDES[CanadianProvince.SK] = WESTERN_CAMERA;
PROVINCIAL_OVERRIDES[CanadianProvince.YT] = WESTERN_CAMERA;
PROVINCIAL_OVERRIDES[CanadianProvince.NT] = WESTERN_CAMERA;
PROVINCIAL_OVERRIDES[CanadianProvince.NU] = WESTERN_CAMERA;

PROVINCIAL_OVERRIDES[CanadianProvince.NB] = PROVINCIAL_OVERRIDES[CanadianProvince.NS];
PROVINCIAL_OVERRIDES[CanadianProvince.PE] = PROVINCIAL_OVERRIDES[CanadianProvince.NS];
PROVINCIAL_OVERRIDES[CanadianProvince.NL] = PROVINCIAL_OVERRIDES[CanadianProvince.NS];

// Ontario regions with their own technical local. Checked before the
// province-wide rules; a match replaces the Toronto-area locals (873, and
// the NABET / Teamsters overlap) but leaves Ontario-wide locals (411, 667) alone.
const IATSE_634_DEPARTMENTS = ['Construction', 'Costume', 'Wardrobe', 'Electric', 'Lighting', 'Greens', 'Grip', 'Hair', 'Makeup', 'Picture Vehicle', 'Script', 'Set Dec', 'Production Sound', 'Special Effects', 'Transportation'];

export const ONTARIO_REGIONAL_OVERRIDES: Partial<Record<OntarioRegion, OverrideRule[]>> = {
  NORTHERN_ON: [
    { roles: ['Script Supervisor', 'Driver', 'Transportation'], assignedUnionId: 'u-634' },
    { departments: IATSE_634_DEPARTMENTS, assignedUnionId: 'u-634' }
  ]
};
ONTARIO_REGIONAL_OVERRIDES.OTTAWA = ONTARIO_REGIONAL_OVERRIDES.NORTHERN_ON;
