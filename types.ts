
export interface User {
  id: string; // matches uid
  email: string;
  name: string;
  phone?: string;
  country?: string;
  language?: string;
  role: string;
  province: string;
  isOnboarded: boolean;
  isPremium?: boolean;
  memberStatus?: 'ASPIRING' | 'MEMBER';
  
  // Business Structure
  businessStructure?: 'INCORPORATED' | 'SOLE_PROPRIETORSHIP' | 'EMPLOYEE' | 'NONE';

  // Agency / Enterprise Fields
  accountType: 'INDIVIDUAL' | 'AGENT';
  managedUsers?: User[]; // Hydrated from agency_assignments
  activeViewId?: string; // ID of the user currently being managed/viewed
  primaryIndustry?: string;
  organizationName?: string;

  // Firestore Aggregates (Updated by Cloud Functions)
  stats?: {
    totalHours: number;
    totalEarnings: number;
    totalDeductions: number;
    unionStatus?: string;
    lastUpdated?: string;
  }
}

export type JobStatus = 'CONFIRMED' | 'TENTATIVE';

export interface UnionTier {
  name: string;
  targetType: 'HOURS' | 'DAYS' | 'CREDITS' | 'EARNINGS';
  targetValue: number;
  description: string;
  requiresDepartment?: boolean; 
  initiationFee?: number;
  annualDues?: number;
  requiredCertificates?: string[];
}

export interface UnionType {
  id: string;
  name: string;
  description: string;
  defaultDuesRate: number;
  tiers: UnionTier[];
}

export interface UserUnionTracking {
  id: string;
  userId: string;
  unionTypeId: string;
  unionName: string;
  tierLabel: string;
  department?: string; 
  targetType: 'HOURS' | 'DAYS' | 'CREDITS' | 'EARNINGS';
  targetValue: number;
  startingValue: number;
}

export interface Job {
  id: string;
  userId: string;
  status: JobStatus;
  productionName: string;
  companyName: string;
  role: string;
  department?: string;
  isUnion: boolean;
  unionTypeId?: string;
  unionName?: string;
  creditType?: 'PRINCIPAL' | 'ACTOR' | 'STUNT' | 'BACKGROUND' | 'CREW' | 'OTHER';
  isUpgrade?: boolean; 
  productionTier?: string; 
  startDate: string; // ISO Date String
  endDate?: string;
  totalHours: number;
  hourlyRate?: number;
  grossEarnings?: number; 
  unionDeductions?: number; 
  notes?: string;
  documentCount: number;
  documentIds?: string[];
  createdAt: string; // ISO or Firestore Timestamp
  imageUrl?: string;
  genre?: string;
}

export interface Document {
  id: string;
  jobId: string;
  fileName: string;
  fileType: string;
  url: string;
  uploadedAt: string;
}

export interface ResidencyDocument {
  id: string;
  userId: string;
  type: keyof typeof RESIDENCY_DOC_TYPES;
  fileName: string;
  uploadedAt: string;
  verified: boolean;
}

export const RESIDENCY_DOC_TYPES = {
  LICENSE: "Driver's License / Photo ID",
  UTILITY_BILL: "Utility Bill (Proof of Address)",
  TAX_RETURN: "T4 / Notice of Assessment",
  PAY_STUB: "Pay Stub",
  CERTIFICATE: "Training Certificate",
  OTHER: "Other Documentation"
};

// --- Finance Types (New) ---

export type TransactionType = 'INCOME' | 'EXPENSE' | 'ASSET_PURCHASE' | 'DRAW' | 'LOAN' | 'TAX_PAYMENT' | 'REIMBURSEMENT';

export type ExpenseCategory = 
  | 'ADVERTISING'
  | 'BANK_FEES'
  | 'CONTRACTORS'
  | 'EQUIPMENT_RENTAL'
  | 'GEAR_SMALL_TOOLS'
  | 'INSURANCE'
  | 'LEGAL_ACCOUNTING'
  | 'LOCATION_PERMITS'
  | 'MEALS_ENTERTAINMENT'
  | 'OFFICE_SUPPLIES'
  | 'PHONE_INTERNET'
  | 'SOFTWARE_SUBSCRIPTIONS'
  | 'TRAVEL'
  | 'VEHICLE_FUEL'
  | 'VEHICLE_INSURANCE'
  | 'VEHICLE_REPAIRS'
  | 'VEHICLE_LEASE'
  | 'HOME_OFFICE_UTILITIES'
  | 'HOME_OFFICE_RENT'
  | 'HOME_OFFICE_PROPERTY_TAX'
  | 'HOME_OFFICE_INSURANCE'
  | 'HOME_OFFICE_MORTGAGE_INTEREST'
  | 'UNION_DUES'
  | 'AGENT_COMMISSIONS'
  | 'TRAINING_WORKSHOPS'
  | 'RESEARCH_MATERIALS'
  | 'WORK_CLOTHING'
  | 'FINES_PENALTIES'
  | 'OWNER_SALARY';

export type IncomeCategory = 
  | 'SERVICE_FEES'
  | 'PRODUCTION_FEE'
  | 'LICENSING'
  | 'GRANT'
  | 'ROYALTY'
  | 'REIMBURSEMENT_IN'
  | 'OTHER';

export interface Money {
  currency: string;
  amount: number;
}

export interface FinanceTransaction {
  id: string;
  userId: string;
  jobId?: string; // Link to a job if applicable
  type: TransactionType;
  dateIncurred: string;
  datePaid?: string;
  description: string;
  
  // Category (Union of Expense/Income enums simplified for storage)
  category: string; 
  
  amountBeforeTax: number;
  taxAmount: number; // GST/HST paid or collected
  totalAmount: number;
  
  businessUsePercent: number; // Default 100
  
  // Calculated fields from Engine
  deductibleAmount?: number;
  addBackAmount?: number;
  ruleTags?: string[]; // e.g. "MEALS_50_LIMIT", "GST_THRESHOLD_WARNING"
}

export interface FinanceStats {
  grossIncomeYTD: number;
  totalExpensesYTD: number;
  deductibleExpensesYTD: number;
  netIncomeYTD: number;
  gstCollected: number;
  gstPaid: number;
  gstNetRemittance: number;
  taxableIncomeProjected: number;
}

// --- Resources (New) ---
export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  category: 'GUIDE' | 'COMPLIANCE' | 'NEWS' | 'UNION';
  date: string;
  readTime: string;
  author: string;
  imageUrl: string;
  content: React.ReactNode;
}

// --- End Finance Types ---

export enum CanadianProvince {
  ON = "Ontario",
  BC = "British Columbia",
  QC = "Quebec",
  AB = "Alberta",
  MB = "Manitoba",
  SK = "Saskatchewan",
  NS = "Nova Scotia",
  NB = "New Brunswick",
  NL = "Newfoundland and Labrador",
  PE = "Prince Edward Island",
  YT = "Yukon",
  NT = "Northwest Territories",
  NU = "Nunavut"
}

export const DEPARTMENT_ROLES: Record<string, string[]> = {
  "Development & Executives": [
    "Executive Producer", "Producer", "Co-Producer", "Associate Producer", "Line Producer", "Co-Executive Producer", "Supervising Producer", "Development Executive", "Creative Executive", "Head of Production", "Head of Development", "Story Editor", "Script Reader / Coverage", "Researcher", "Rights & Clearances Manager"
  ],
  "Production Office": [
    "Unit Production Manager (UPM)", "Production Supervisor", "Production Coordinator (POC)", "Assistant Production Coordinator (APOC)", "Travel Coordinator", "Shipping & Customs Coordinator", "Production Secretary", "Office Production Assistant (Office PA)", "Runner", "Receptionist", "Assistant to the Producer", "Assistant to the Director"
  ],
  "Accounting & Finance": [
    "Production Accountant", "First Assistant Accountant", "Second Assistant Accountant", "Payroll Accountant", "Post-Production Accountant", "Accounting Clerk", "Construction Accountant", "Tax Incentive Specialist", "Estimator"
  ],
  "Direction & Continuity": [
    "Director", "First Assistant Director (1st AD)", "Second Assistant Director (2nd AD)", "Second Second Assistant Director (2nd 2nd AD)", "Third Assistant Director / Additional AD", "Key Set Production Assistant (Key PA)", "Set Production Assistant (Set PA)", "Basecamp PA", "Crowd Control / Lock-up PA", "Script Supervisor (Continuity)"
  ],
  "Script & Writing": [
    "Screenwriter", "Staff Writer", "Script Doctor", "Script Coordinator", "Writers’ Assistant", "Technical Advisor (Subject Matter Expert)"
  ],
  "Casting": [
    "Casting Director", "Casting Associate", "Casting Assistant", "Extras Casting Director", "Extras Casting Associate", "Background Coordinator"
  ],
  "Camera Department": [
    "Director of Photography (Cinematographer)", "Camera Operator (A/B/C Cam)", "First Assistant Camera (1st AC / Focus Puller)", "Second Assistant Camera (2nd AC / Loader)", "Digital Imaging Technician (DIT)", "Digital Loader / Data Wrangler", "Camera Utility / Truck Loader", "Steadicam Operator", "Video Assist Operator", "Video Playback Operator", "Script / Continuity Supervisor", "Underwater Director of Photography", "Underwater Camera Operator", "Drone Pilot / Aerial Cinematographer", "Aerial Camera Operator", "Crash Cam Operator", "Russian Arm Operator", "Technocrane Operator", "Libra Head Technician", "Stereographer (3D)"
  ],
  "Lighting (Electric)": [
    "Chief Lighting Technician (Gaffer)", "Assistant Chief Lighting Technician (Best Boy Electric)", "Electrician / Set Lighting Technician", "Lamp Operator", "Rigging Gaffer", "Best Boy Rigging Electric", "Rigging Electrician", "Genny Operator (Generator)", "Dimmer Board Operator", "Basecamp Electrician", "Lighting Console Programmer", "Fixtures Technician (Practical Lights)", "Balloon Tech (Lighting Balloons)"
  ],
  "Grip (Rigging & Camera Support)": [
    "Key Grip", "Best Boy Grip", "Grip", "Dolly Grip", "Rigging Key Grip", "Best Boy Rigging Grip", "Rigging Grip", "Key Rigging Grip", "Technocrane Grip", "Camera Car Driver (Insert Car)"
  ],
  "Art Department": [
    "Production Designer", "Art Director", "Supervising Art Director", "Assistant Art Director", "Art Department Coordinator", "Art Department Assistant", "Production Illustrator / Concept Artist", "Set Designer / Draftsman", "Graphic Designer", "Model Maker", "Storyboard Artist", "Set Decorator", "Leadman", "Buyer", "Set Dresser / Swing", "On-Set Dresser", "Drapery Foreman / Draper", "Property Master", "Assistant Property Master", "Prop Assistant", "Prop Maker", "Armorer (Weapons Specialist)", "Food Stylist", "Product Placement Coordinator", "Construction Coordinator", "Construction Foreman", "Gang Boss", "Carpenter / Scenic Carpenter", "Laborer", "Plasterer", "Welder / Metal Fabricator", "Standby Carpenter", "Charge Scenic Artist (Key Scenic)", "Scenic Foreman", "Scenic Artist / Painter", "Sign Writer", "On-Set Scenic (Standby Painter)", "Head Greensman", "Greensman / Greensperson"
  ],
  "Costume & Wardrobe": [
    "Costume Designer", "Assistant Costume Designer", "Costume Supervisor", "Key Costumer", "Set Costumer", "Truck Costumer", "Costume Coordinator", "Costume Buyer", "Cutter / Fitter", "Seamstress / Tailor", "Dyer / Ager / Breakdown Artist", "Milliner (Hat Maker)", "Cobbler (Shoe Maker)", "Wardrobe Assistant"
  ],
  "Hair & Makeup": [
    "Department Head Makeup", "Key Makeup Artist", "Makeup Artist", "Department Head Hair", "Key Hair Stylist", "Hair Stylist", "Personal Makeup Artist/Hair Stylist", "Special Effects (SFX) Makeup Artist", "Prosthetics Designer", "Prosthetics Technician", "Lens Technician (Contact Lenses)", "Body Painter", "Wig Maker"
  ],
  "Sound (Production)": [
    "Production Sound Mixer", "Boom Operator", "Sound Utility / Cable Person / 2nd Boom", "Sound Trainee"
  ],
  "Special Effects": [
    "Special Effects Supervisor", "Special Effects Coordinator", "Special Effects Foreman", "Special Effects Technician", "Pyrotechnician", "Powder Man"
  ],
  "Stunts": [
    "Stunt Coordinator", "Assistant Stunt Coordinator", "Fight Choreographer", "Stunt Captain", "Stunt Double", "Stunt Performer / Utility Stunt", "Precision Driver", "Stunt Rigger", "Safety Diver (Water Stunts)"
  ],
  "Locations": [
    "Location Manager", "Assistant Location Manager", "Location Scout", "Location Assistant", "Unit Manager", "Location Security / Police Liaison", "Parking Coordinator"
  ],
  "Transportation": [
    "Transportation Coordinator", "Transportation Captain", "Transportation Office Coordinator", "Dispatcher", "Driver (Teamster)", "Cast Driver", "Camera Car Driver", "Process Trailer Driver", "Honeywagon Operator", "Water Truck Driver", "Picture Car Coordinator", "Picture Car Mechanic"
  ],
  "Animals & Wrangling": [
    "Head Animal Wrangler", "Animal Trainer", "Animal Handler"
  ],
  "Health, Safety & Compliance": [
    "Set Medic / EMT / Nurse", "Water Safety / Lifeguard", "Safety Officer", "COVID Compliance Officer (CCO)", "Health & Safety Manager", "Intimacy Coordinator", "Fire Safety Officer (Fire Marshal)", "Child Labor Guardian / Studio Teacher"
  ],
  "Catering & Craft Services": [
    "Catering Chef", "Sous Chef / Catering Assistant", "Key Craft Service (Crafty)", "Craft Service Assistant"
  ],
  "Post-Production (Picture)": [
    "Post-Production Supervisor", "Post-Production Coordinator", "Editor", "Additional Editor", "First Assistant Editor", "Second Assistant Editor", "Post-Production PA", "Supervising Colorist", "Colorist", "Dailies Colorist", "Online Editor", "Conform Editor", "Film Lab Technician", "Negative Cutter"
  ],
  "Post-Production (Sound)": [
    "Supervising Sound Editor", "Sound Designer", "Sound Editor", "Dialogue Editor", "ADR Supervisor", "ADR Editor", "ADR Mixer", "ADR Recordist", "Sound Effects Editor", "Foley Artist", "Foley Mixer", "Foley Editor", "Re-Recording Mixer", "Mix Technician", "Dolby Consultant"
  ],
  "Music": [
    "Composer", "Music Supervisor", "Music Editor", "Score Mixer", "Orchestrator", "Music Preparation / Copyist", "Contractor", "Session Musician"
  ],
  "VFX & Animation": [
    "VFX Supervisor", "VFX Producer", "VFX Coordinator", "VFX Editor", "CG Supervisor", "Compositing Supervisor", "Compositor", "Roto Artist", "Paint / Prep Artist", "Matchmove Artist", "Layout Artist", "Matte Painter", "3D Modeler", "Texture Artist", "Rigger", "Animator", "Lighting Artist", "FX Artist", "Render Wrangler", "Pipeline TD"
  ],
  "Marketing, PR & Distribution": [
    "Unit Publicist", "Still Photographer", "EPK Producer", "EPK Crew", "Trailer Editor", "Marketing Executive", "Distribution Executive", "Acquisitions Manager", "Sales Agent"
  ],
  "Performers (Principal)": [
    "Principal Actor", "Voice Artist", "Singer", "Dancer"
  ],
  "Background Performers": [
    "Background Performer", "Stand-In"
  ]
};

// Flattened for backwards compatibility if needed, though we should prefer the Department map
export const FILM_ROLES = Object.values(DEPARTMENT_ROLES).flat();
export const DEPARTMENTS = Object.keys(DEPARTMENT_ROLES);

export const PRODUCTION_TIERS = [
  "Tier A (High Budget)",
  "Tier B",
  "Tier C",
  "Tier D",
  "Tier E",
  "Tier F (Indie/Low Budget)",
  "MOW (Movie of the Week)",
  "Pilot",
  "New Media",
  "Commercial"
];

export const AGENT_ROLES = [
  "Talent Agent",
  "Talent Manager",
  "Casting Director",
  "Production Company",
  "Program Coordinator",
  "Program Manager"
];

export const AGENT_INDUSTRIES = [
  "Film & TV",
  "Commercial",
  "Voice",
  "Theatre",
  "Modeling"
];

export const UNIONS: UnionType[] = [
  { 
    id: 'u1', 
    name: 'ACTRA', 
    description: 'Alliance of Canadian Cinema, Television and Radio Artists',
    defaultDuesRate: 0.0225, 
    tiers: [
      { name: 'Background Apprentice', targetType: 'DAYS', targetValue: 15, description: 'Work on ACTRA productions as background. Earn vouchers.', initiationFee: 0, annualDues: 0 },
      { name: 'Apprentice (Hours Path)', targetType: 'HOURS', targetValue: 1600, description: 'Accumulate 1600 hours to join.', initiationFee: 160, annualDues: 195 },
      { name: 'Apprentice (Days Path)', targetType: 'DAYS', targetValue: 200, description: 'Accumulate 200 days to join.', initiationFee: 160, annualDues: 195 },
      { name: 'Full Member', targetType: 'CREDITS', targetValue: 3, description: 'Requires 3 qualifying credits.', initiationFee: 1600, annualDues: 195 }
    ]
  },
  { 
    id: 'u2', 
    name: 'IATSE', 
    description: 'International Alliance of Theatrical Stage Employees',
    defaultDuesRate: 0.045, 
    tiers: [
      { name: 'Permit Status', targetType: 'DAYS', targetValue: 120, description: '120 days worked in a specific department.', requiresDepartment: true, initiationFee: 0, annualDues: 0 },
      { name: 'Full Membership', targetType: 'DAYS', targetValue: 120, description: 'Departmental membership requirement.', requiresDepartment: true, initiationFee: 2500, annualDues: 300 }
    ]
  },
  { 
    id: 'u3', 
    name: 'DGC', 
    description: 'Directors Guild of Canada',
    defaultDuesRate: 0.02, 
    tiers: [
      { name: 'Permittee / Entry', targetType: 'DAYS', targetValue: 30, description: 'Resume showing work in category + intro courses.', requiresDepartment: true, initiationFee: 0, annualDues: 0 },
      { name: 'Associate (GAP)', targetType: 'DAYS', targetValue: 150, description: 'Guild Apprentice Program (150 days).', requiresDepartment: true, initiationFee: 500, annualDues: 450 },
      { name: 'Full Membership', targetType: 'DAYS', targetValue: 150, description: 'Accumulate required days in craft (e.g. 150 for ADs).', requiresDepartment: true, initiationFee: 1500, annualDues: 750 }
    ]
  },
  { 
    id: 'u4', 
    name: 'WGC', 
    description: 'Writers Guild of Canada',
    defaultDuesRate: 0.02, 
    tiers: [
      { name: 'Associate', targetType: 'CREDITS', targetValue: 0, description: 'Interest in writing and industry involvement.', initiationFee: 0, annualDues: 0 },
      { name: 'Full Member', targetType: 'CREDITS', targetValue: 1, description: 'One professional contract with WGC signatory producer.', initiationFee: 500, annualDues: 250 }
    ]
  },
  { 
    id: 'u5', 
    name: 'NABET 700-M', 
    description: 'National Association of Broadcast Employees and Technicians',
    defaultDuesRate: 0.03, 
    tiers: [
      { name: 'Permittee', targetType: 'DAYS', targetValue: 40, description: '40 days of experience in department + course.', requiresDepartment: true, initiationFee: 100, annualDues: 0 },
      { name: 'Full Member', targetType: 'EARNINGS', targetValue: 3000, description: 'Earn $3000 in permittee fees.', requiresDepartment: true, initiationFee: 1200, annualDues: 600 }
    ]
  },
];
