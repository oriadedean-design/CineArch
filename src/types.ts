
export type MemberStatus = 'ASPIRING' | 'MEMBER';

export interface UserStats {
  totalHours: number;
  totalEarnings: number;
  totalDeductions: number;
  unionStatus?: string;
  lastUpdated?: string;
}

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
  memberStatus?: MemberStatus;

  // Onboarding control flags
  onboardingOptOut?: boolean; // If true, we do not force the onboarding wizard
  onboardingSkippedAt?: string; // Timestamp for last skip

  // Agency / Enterprise Fields
  accountType: 'INDIVIDUAL' | 'AGENT';
  managedUsers?: User[]; // Hydrated from agency_assignments
  activeViewId?: string; // ID of the user currently being managed/viewed
  primaryIndustry?: string;

  // Firestore Aggregates (Updated by Cloud Functions)
  stats?: UserStats;
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
}

export interface AgencyAssignment {
  id: string;
  agentId: string;
  memberId: string;
  memberEmail: string;
  status: 'ACTIVE' | 'PENDING' | 'ARCHIVED';
  createdAt: string;
  permissions: {
    canViewFinancials: boolean;
    canEditJobs: boolean;
  };
}

export interface ResidencyDocument {
  id: string;
  userId: string;
  type: keyof typeof RESIDENCY_DOC_TYPES;
  fileName: string;
  storagePath?: string;
  url: string;
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

export type DocumentType = 'LICENSE' | 'PAY_STUB' | 'CONTRACT';

export interface DocumentMetadata {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  docType: DocumentType;
  storagePath?: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
}

export interface CalculationRecord {
  id: string;
  userId: string;
  type: string; // e.g., TAX_REPORT_2024
  generatedAt: string;
  data: Record<string, unknown>;
}

export interface TaxRule {
  id: string; // province_year key like ON_2024
  province: string;
  year: number;
  basicPersonalAmount: number;
  brackets: { threshold: number; rate: number }[];
}

export interface SubscriptionRecord {
  id: string; // Auto-ID or Stripe subscription ID
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  planTier: 'PRO' | 'AGENCY';
  startDate: string;
  canceledAt?: string;
  endedAt?: string;
  provider: 'stripe';
  created: string;
}

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

export const FILM_ROLES = [
  "Actor",
  "Background Performer",
  "Director",
  "Producer",
  "Camera",
  "Sound",
  "Editor",
  "Grip/Electric",
  "Art Department",
  "Production Assistant",
  "Other"
];

export const DEPARTMENTS = [
  "Production",
  "Camera",
  "Sound",
  "Grip",
  "Electric",
  "Art",
  "Costume",
  "Hair/Makeup",
  "Locations",
  "Post-Production",
  "Transport",
  "Script",
  "Continuity",
  "Construction",
  "Special Effects"
];

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
  "Production Company"
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
