
/**
 * NATIONAL STANDARDS
 * The fallback logic when no provincial override is present.
 * Derived from the CineArch Jurisdictional Matrix.
 */
export const NATIONAL_ROLE_MAPPING: Record<string, string> = {
  // Direction
  'Director': 'u-dgc',
  'Assistant Director': 'u-dgc',
  'Script Supervisor': 'u-dgc',
  
  // Production Office
  'Coordinator': 'u-411',
  'Production Manager': 'u-dgc',
  'Location Manager': 'u-dgc',

  // Camera
  'DOP': 'u-667',
  'Operator': 'u-667',
  'Assistant Camera': 'u-667',
  'Still Photographer': 'u-667',

  // Creative
  'Production Designer': 'u-dgc',
  'Art Director': 'u-dgc',
  'Editor': 'u-dgc',
  'Writer': 'u-wgc',

  // Performers
  'Actor': 'u-actra',
  'Stunt': 'u-actra',
  'Background': 'u-actra',

  // Logistics (Fallbacks)
  'Driver': 'u-t938',
  'Transportation': 'u-t938',
  'Grip': 'u-873',
  'Electric': 'u-873',
  'Sound': 'u-873',
  'Props': 'u-873',
  'Set Dec': 'u-873',
  'Costume': 'u-873',
  'Wardrobe': 'u-873',
  'Construction': 'u-873',
  'Paint': 'u-873',
  'Hair': 'u-873',
  'Makeup': 'u-873',
  'Craft': 'u-873'
};

export const NATIONAL_DEPT_MAPPING: Record<string, string> = {
  'Direction': 'u-dgc',
  'Performer': 'u-actra',
  'Writing': 'u-wgc',
  'Transportation': 'u-t938',
  'Camera Department': 'u-667'
};
