
import { CanadianProvince } from '../../types';

interface OverrideRule {
  roles?: string[];
  departments?: string[];
  assignedUnionId: string;
}

export const PROVINCIAL_OVERRIDES: Partial<Record<CanadianProvince, OverrideRule[]>> = {
  [CanadianProvince.BC]: [
    { roles: ['Actor', 'Stunt', 'Background'], assignedUnionId: 'u-ubcp' },
    { roles: ['Script Supervisor', 'Coordinator', 'Grip', 'Electric', 'Sound', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Craft', 'First Aid'], assignedUnionId: 'u-891' },
    { roles: ['DOP / Operator', 'Assistant (1st/2nd)', 'Still Photographer'], assignedUnionId: 'u-669' },
    { roles: ['Driver', 'Transportation', 'Coordinator / Driver', 'Catering', 'Security'], assignedUnionId: 'u-t155' },
    { roles: ['Editor'], assignedUnionId: 'u-dgc' }, // Also can be 891
    { departments: ['Camera Department', 'Sound', 'Grip', 'Electric', 'Art Dept', 'Props', 'Set Dec', 'Costume', 'Construction', 'Paint', 'Hair', 'Makeup', 'First Aid'], assignedUnionId: 'u-891' }
  ],
  [CanadianProvince.AB]: [
    { roles: ['DOP / Operator', 'Assistant (1st/2nd)', 'Still Photographer'], assignedUnionId: 'u-669' },
    { roles: ['Script Supervisor', 'Coordinator', 'Grip', 'Electric', 'Sound', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Craft', 'First Aid'], assignedUnionId: 'u-212' },
    { roles: ['Driver', 'Transportation', 'Coordinator / Driver', 'Security'], assignedUnionId: 'u-t362' },
    { roles: ['Production Designer', 'Art Director', 'Editor'], assignedUnionId: 'u-dgc' } // Or 212
  ],
  [CanadianProvince.MB]: [
    { roles: ['DOP / Operator', 'Assistant (1st/2nd)', 'Still Photographer'], assignedUnionId: 'u-669' },
    { roles: ['Script Supervisor', 'Coordinator', 'Grip', 'Electric', 'Sound', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Craft', 'First Aid', 'Attendant', 'Server'], assignedUnionId: 'u-856' },
    { departments: ['First Aid', 'Craft Service'], assignedUnionId: 'u-856' } // FACS Hybrid
  ],
  [CanadianProvince.ON]: [
    { roles: ['DOP / Operator', 'Assistant (1st/2nd)', 'Still Photographer', 'Publicity'], assignedUnionId: 'u-667' },
    { roles: ['Coordinator', 'Coordinator / Driver', 'Server'], assignedUnionId: 'u-411' },
    { roles: ['Script Supervisor'], assignedUnionId: 'u-873' },
    { roles: ['Driver', 'Transportation'], assignedUnionId: 'u-t938' },
    { departments: ['Grip', 'Electric', 'Sound', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup'], assignedUnionId: 'u-873' }
  ],
  [CanadianProvince.QC]: [
    { departments: ['Camera Department', 'Grip', 'Electric', 'Sound', 'Art Dept', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Transportation', 'Craft Service', 'First Aid'], assignedUnionId: 'u-aqtis' },
    { roles: ['Director', '1st/2nd AD', 'Script Supervisor', 'Production Designer', 'Art Director', 'Editor'], assignedUnionId: 'u-dgc' }
  ],
  [CanadianProvince.NS]: [
    { roles: ['DOP / Operator', 'Assistant (1st/2nd)', 'Still Photographer'], assignedUnionId: 'u-667' },
    { roles: ['Script Supervisor', 'Coordinator', 'Grip', 'Electric', 'Sound', 'Props', 'Set Dec', 'Costume', 'Wardrobe', 'Construction', 'Paint', 'Hair', 'Makeup', 'Craft', 'First Aid', 'Transportation'], assignedUnionId: 'u-849' }
  ]
};

// Map Atlantic cluster
PROVINCIAL_OVERRIDES[CanadianProvince.NB] = PROVINCIAL_OVERRIDES[CanadianProvince.NS];
PROVINCIAL_OVERRIDES[CanadianProvince.PE] = PROVINCIAL_OVERRIDES[CanadianProvince.NS];
PROVINCIAL_OVERRIDES[CanadianProvince.NL] = PROVINCIAL_OVERRIDES[CanadianProvince.NS];
