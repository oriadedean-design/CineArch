
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
  'Unit Manager': 'u-dgc',
  
  // Production Office
  'Coordinator': 'u-411',
  'Production Manager': 'u-dgc',
  'Assistant Production Manager': 'u-dgc',
  'Location Manager': 'u-dgc',
  'Assistant Location Manager': 'u-dgc',
  'Location Production Assistant': 'u-dgc',

  // Camera
  'DOP': 'u-667',
  'Operator': 'u-667',
  'Assistant Camera': 'u-667',
  'Still Photographer': 'u-667',

  // Creative & Art
  'Production Designer': 'u-dgc',
  'Art Director': 'u-dgc',
  'Art Department Coordinator': 'u-dgc',
  'Assistant Art Director': 'u-dgc',
  'Set Designer': 'u-dgc',
  'Graphic Designer': 'u-dgc',
  
  // Editorial & Post
  'Editor': 'u-dgc',
  'Picture Editor': 'u-dgc',
  'Sound Editor': 'u-dgc',
  'Music Editor': 'u-dgc',
  'Post Production Supervisor': 'u-dgc',
  'Post Production Coordinator': 'u-dgc',
  'Post Production Assistant': 'u-dgc',

  // Accounting
  'Accountant': 'u-dgc',
  'Production Accountant': 'u-dgc',
  '1st Assistant Accountant': 'u-dgc',
  '2nd Assistant Accountant': 'u-dgc',
  '3rd Assistant Accountant': 'u-dgc',

  // Performers
  'Actor': 'u-actra',
  'Stunt': 'u-actra',
  'Background Performer': 'u-actra',

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
  'Camera Department': 'u-667',
  'Accounting Department': 'u-dgc',
  'Picture Editing': 'u-dgc',
  'Sound Editing': 'u-dgc',
  'Post Production': 'u-dgc'
};

// Performer categories ACTRA represents (UBCP/ACTRA in BC). Resolved before
// any crew rule so titles like "Stunt Coordinator" never reach a crew local.
export const PERFORMER_ROLES = ['Actor', 'Background Performer', 'Choreographer', 'Dancer', 'Singer', 'Puppeteer', 'Stunt'];

// Writing staff WGC represents. Resolved before crew rules so "Story Editor"
// isn't read as a picture or sound editor.
export const WRITER_ROLES = ['Writer', 'Story Editor', 'Story Consultant'];
