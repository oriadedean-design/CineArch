
// --- Enums Matching Postgres ---
export type ProvinceCode = 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';
export type OrgType = 'individual' | 'agency';
export type MemberRole = 'owner' | 'admin' | 'member';
export type SeatType = 'free' | 'pro' | 'agency';
export type ExpenseCategory = 
  | 'Kit Rental' 
  | 'Union Dues' 
  | 'Agent Commission' 
  | 'Meals & Entertainment' 
  | 'Travel' 
  | 'Home Office' 
  | 'Equipment/CCA' 
  | 'Other';

export enum CanadianProvince {
  AB = 'Alberta',
  BC = 'British Columbia',
  MB = 'Manitoba',
  NB = 'New Brunswick',
  NL = 'Newfoundland and Labrador',
  NS = 'Nova Scotia',
  NT = 'Northwest Territories',
  NU = 'Nunavut',
  ON = 'Ontario',
  PE = 'Prince Edward Island',
  QC = 'Quebec',
  SK = 'Saskatchewan',
  YT = 'Yukon'
}

// --- Core Identity ---
export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  province?: string;
  isOnboarded?: boolean;
  isPremium?: boolean;
  memberStatus?: string;
  country?: string;
  language?: string;
  accountType?: 'INDIVIDUAL' | 'AGENT';
  managedUsers?: User[];
  activeViewId?: string;
  organizationName?: string;
  primaryIndustry?: string;
  businessStructure?: 'SOLE_PROPRIETORSHIP' | 'INCORPORATED' | 'EMPLOYEE' | 'NONE';
  updated_at?: string;
}

// --- Organizations & Tenancy ---
export interface Organization {
  id: string;
  name: string;
  org_type: OrgType;
  created_at: string;
}

export interface OrgMembership {
  org_id: string;
  user_id: string;
  member_role: MemberRole;
  status: 'active' | 'invited' | 'disabled';
  created_at: string;
  // Joins
  organization?: Organization;
  profile?: Profile;
}

export interface OrgSeat {
  id: string;
  org_id: string;
  seat_type: SeatType;
  assigned_user_id?: string; // If null, seat is empty
  assigned_at?: string;
  created_at: string;
  // Joins
  assigned_profile?: Profile; 
}

export interface Subscription {
  org_id: string;
  tier: 'free' | 'pro' | 'agency';
  status: 'active' | 'past_due' | 'canceled';
  current_period_end: string;
}

export interface UsageCounter {
  org_id: string;
  period_yyyymm: number;
  import_credits_used: number;
  invites_used: number;
}

// --- Financials (Strict Schema Match) ---
export interface FinancialProfile {
  user_id: string;
  org_id: string; // Scoped to org
  fiscal_residency_prov: ProvinceCode;
  gst_number?: string;
  is_gst_registered: boolean;
  business_structure: 'Sole Proprietorship' | 'Corporation';
}

export interface IncomeEntry {
  id: string;
  org_id: string;
  job_id?: string;
  user_id: string; // The earner
  date_invoiced: string;
  subtotal: number;
  tax_collected_gst: number;
  tax_collected_pst_qst: number;
  place_of_supply: ProvinceCode;
  is_t4_income: boolean;
  description: string;
  category?: string;
}

export interface Expense {
  id: string;
  org_id: string;
  user_id: string;
  date_incurred: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  tax_paid_gst: number;
  tax_paid_pst: number;
  claimable_percentage: number; // Default 100.00 or 50.00
  receipt_url?: string;
}

export interface TaxRate {
  province_code: ProvinceCode;
  gst_rate: number;
  pst_rate: number;
  hst_rate: number;
  basic_personal_amount: number;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface FinanceTransaction {
    id: string;
    org_id: string;
    user_id: string;
    type: TransactionType;
    date_incurred: string;
    amountBeforeTax: number;
    taxAmount: number;
    description: string;
    category: string;
    deductibleAmount?: number;
    addBackAmount?: number;
    ruleTags?: string[];
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

// --- Legacy / Hybrid Types for Frontend UI ---
export type JobStatus = 'CONFIRMED' | 'TENTATIVE';

export interface Job {
  id: string;
  org_id: string; 
  userId: string;
  status: JobStatus;
  productionName: string;
  companyName: string;
  role: string;
  department?: string;
  isUnion: boolean;
  unionTypeId?: string;
  unionName?: string;
  startDate: string;
  endDate?: string;
  totalHours: number;
  grossEarnings?: number; 
  unionDeductions?: number; 
  notes?: string;
  documentCount: number;
  imageUrl?: string;
  genre?: string;
  // Added Missing Fields
  creditType?: 'PRINCIPAL' | 'ACTOR' | 'STUNT' | 'CREW' | 'OTHER';
  productionTier?: string;
  isUpgrade?: boolean;
  hourlyRate?: number;
  province?: string;
  createdAt?: string;
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

export interface ResidencyDocument {
    id: string;
    type: string;
    name: string;
    url: string;
    date: string;
}

export const RESIDENCY_DOC_TYPES = ['Utility Bill', 'Lease Agreement', 'Tax Assessment', 'Drivers License'];

export const DEPARTMENTS = [
  "Performers (Principal)", "Background Performers", "Stunts", 
  "Camera Department", "Lighting (Electric)", "Grip (Rigging & Camera Support)",
  "Costume & Wardrobe", "Hair & Makeup", "Sound (Production)", "Special Effects",
  "Construction", "Scenic (Paint)", "Greens", "Props", "Set Decoration",
  "Catering & Craft Services", "Direction & Continuity", "Art Department",
  "Locations", "Post-Production (Picture)", "Post-Production (Sound)",
  "Script & Writing"
];

export const FILM_ROLES = [
  "Director", "Producer", "Production Manager", "Cinematographer", "Camera Operator",
  "1st AC", "2nd AC", "Gaffer", "Best Boy Electric", "Key Grip", "Best Boy Grip",
  "Production Designer", "Art Director", "Set Decorator", "Prop Master",
  "Costume Designer", "Wardrobe Supervisor", "Key Makeup Artist", "Key Hair Stylist",
  "Sound Mixer", "Boom Operator", "Editor", "Assistant Editor", "Sound Editor",
  "Composer", "Stunt Coordinator", "Stunt Performer", "Actor", "Background Performer",
  "Screenwriter", "Script Supervisor", "Location Manager"
];

export const AGENT_ROLES = ["Talent Agent", "Talent Manager", "Casting Director", "Publicist"];
export const AGENT_INDUSTRIES = ["Film & TV", "Commercial", "Voice Over", "Theatre"];
export const DEPARTMENT_ROLES: Record<string, string[]> = {
    "Performers (Principal)": ["Actor", "Singer", "Dancer"],
    "Camera Department": ["DOP", "Camera Op", "1st AC", "2nd AC"],
};
// Quick fill
DEPARTMENTS.forEach(d => {
    if (!DEPARTMENT_ROLES[d]) DEPARTMENT_ROLES[d] = ["Head of Department", "Key", "Assistant", "General Crew"];
});

export const UNIONS = [
  { 
      id: 'u1', 
      name: 'ACTRA', 
      description: 'Alliance of Canadian Cinema, Television and Radio Artists',
      defaultDuesRate: 0.0225,
      tiers: [
          {name: 'Apprentice', targetType: 'CREDITS', targetValue: 3, requiresDepartment: false},
          {name: 'Full Member', targetType: 'CREDITS', targetValue: 6, requiresDepartment: false}
      ] as const
  },
  { 
      id: 'u2', 
      name: 'IATSE', 
      description: 'International Alliance of Theatrical Stage Employees',
      defaultDuesRate: 0.02,
      tiers: [
          {name: 'Permit', targetType: 'DAYS', targetValue: 120, requiresDepartment: true},
          {name: 'Member', targetType: 'DAYS', targetValue: 0, requiresDepartment: true}
      ] as const
  },
  { 
      id: 'u3', 
      name: 'DGC', 
      description: 'Directors Guild of Canada',
      defaultDuesRate: 0.02,
      tiers: [
          {name: 'Associate', targetType: 'DAYS', targetValue: 150, requiresDepartment: true},
          {name: 'Full Member', targetType: 'DAYS', targetValue: 300, requiresDepartment: true}
      ] as const
  },
  { 
      id: 'u4', 
      name: 'WGC', 
      description: 'Writers Guild of Canada',
      defaultDuesRate: 0.02,
      tiers: [
          {name: 'Full Member', targetType: 'CREDITS', targetValue: 1, requiresDepartment: false}
      ] as const
  },
  {
      id: 'u5',
      name: 'NABET',
      description: 'National Association of Broadcast Employees and Technicians',
      defaultDuesRate: 0.015,
      tiers: [
          {name: 'Permit', targetType: 'DAYS', targetValue: 100, requiresDepartment: true}
      ] as const
  }
];

export interface Article {
    slug: string;
    title: string;
    subtitle: string;
    category: string;
    date: string;
    readTime: string;
    author: string;
    imageUrl: string;
    content: React.ReactNode;
}
