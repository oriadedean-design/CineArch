
import React from 'react';

export enum EntityType {
  AGENCY = 'AGENCY',
  ARTS_ORG = 'ARTS_ORG',
  TRAINING_INST = 'TRAINING_INST'
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  country?: string;
  language?: string;
  role: string;
  province: string;
  region?: 'TORONTO' | 'NORTHERN_ON' | 'OTTAWA' | 'OTHER' | 'MONTREAL' | 'QUEBEC_CITY';
  isOnboarded: boolean;
  isPremium?: boolean;
  webTourSeenAt?: string;        // the dock tour ran for this account (profiles.web_tour_seen_at)
  isAdmin?: boolean;             // can verify facts on /admin (set in the database only)
  memberStatus?: 'ASPIRING' | 'MEMBER';
  
  careerFocus?: string;
  department?: string;
  selectedRoles?: string[];
  goals?: string[];

  // Agent Fee Configuration
  hasAgentFee?: boolean;
  agentFeePercentage?: number;
  earningGoal?: number;          // what they want to earn from film work this year (CAD)
  payType?: 't4' | 'self_employed' | 'both';  // decides what the Wallet says to set aside
  gstMethod?: 'regular' | 'quick';

  // Enterprise Specifics
  entityType?: EntityType;
  cohortYear?: string;
  programName?: string;
  organizationName?: string;

  businessStructure?: 'INCORPORATED' | 'SOLE_PROPRIETORSHIP' | 'EMPLOYEE' | 'ORGANIZATION';

  accountType: 'INDIVIDUAL' | 'AGENT';
  managedUsers?: User[]; 
  activeViewId?: string; 
  inviteStatus?: 'PENDING';        // roster entry that hasn't accepted yet
  pendingInvites?: AgencyInvite[]; // invites addressed to this individual
  primaryIndustry?: string;
  // Track which agency is managing this individual
  managedByAgencyId?: string;

  stats?: {
    totalHours: number;
    totalEarnings: number;
    totalDeductions: number;
    unionStatus?: string;
    lastUpdated?: string;
  }
}

export type NotificationType = 'GST_THRESHOLD' | 'PRODUCTION_START' | 'PRODUCTION_END' | 'UNION_DUE' | 'SYSTEM';

export interface CineNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

export type JobStatus = 'CONFIRMED' | 'TENTATIVE';

export interface UnionTier {
  name: string;
  targetType: 'HOURS' | 'DAYS' | 'CREDITS' | 'EARNINGS';
  targetValue: number;
  description: string;
  requiresDepartment?: boolean;  // only work in your department, category or position counts
  province?: string | null;      // the branch it applies to (null = everywhere)
  roleIds?: string[];            // only jobs in these roles count (empty = any)
  windowMonths?: number | null;  // only work in the last N months counts
  hoursRule?: 'actra_background' | null;
  startLabel?: string | null;    // asks when counting starts, e.g. 'AABP since'
  countsWork?: 'union' | 'any';  // 'any' = relevant work anywhere counts (permit steps)
  minProductions?: number | null; // at least this many different productions
  shortDayHours?: number | null; // a day this short counts as half
  shortDayInclusive?: boolean;   // true = "this many hours or less", else "under"
  excludeRoleIds?: string[];     // work in these roles never counts
  sourceUrl?: string | null;
  checkedOn?: string | null;     // YYYY-MM-DD
  confirmed?: boolean;           // false = no published source; not a firm goal
  initiationFee?: number;
  annualDues?: number;
  requiredCertificates?: string[];
}

export interface UnionType {
  id: string;
  name: string;
  description: string;
  defaultDuesRate?: number;       // omitted = not sourced yet
  tiers: UnionTier[];
  joiningRequirements?: string[];
  applicationProcess?: string[];
  memberBenefits?: string[];
  residencyRule?: string;
  applicationFee?: number;
  contactEmail?: string;
  jurisdictionalNotes?: string;
  regions?: CanadianProvince[];   // provinces where this local operates; omitted = national
  departments?: string[];         // departments the local represents, as the local lists them
  contactPhone?: string;
  applicationFeeNotes?: string;   // breakdown / refund policy for applicationFee
  // Ontario sub-regions this local covers (omitted = the whole province).
  ontarioRegions?: OntarioRegion[];
  // Claims taken from a source we haven't confirmed with the union yet.
  needsVerification?: string[];
}

export type OntarioRegion = 'TORONTO' | 'NORTHERN_ON' | 'OTTAWA' | 'OTHER';

export const ONTARIO_REGION_LABELS: Record<OntarioRegion, string> = {
  TORONTO: 'Toronto area',
  NORTHERN_ON: 'Northern Ontario',
  OTTAWA: 'Ottawa',
  OTHER: 'Elsewhere in Ontario',
};

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
  countsFrom?: string;           // YYYY-MM-DD; only work on or after it counts (tiers with a startLabel)
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
  startDate: string; 
  endDate?: string;
  totalHours: number;          // hours worked across all days, after unpaid meal breaks
  hourlyRate?: number;
  daysWorked?: number;         // identical days logged together (default 1)
  hoursPerDay?: number;        // call to wrap, per day
  mealBreakMinutes?: number;   // unpaid, per day
  overtimeHours?: number;      // across all days
  unionMinimumRate?: number;   // union scale for the position when logged
  ratePosition?: string;       // the rate-sheet position used
  grossEarnings?: number; 
  unionDeductions?: number; 
  notes?: string;
  documentCount: number;
  documentIds?: string[];
  createdAt: string; 
  imageUrl?: string;
  genre?: string;
  representativeId?: string;   // who booked it (public.representatives)
  agentName?: string;          // a typed name, from the phone's "Pick or type"
  province?: string;
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

export interface Plan {
  id: string;
  label: string;
  price: string;
  desc: string;
  benefits: string[];
}

// What each plan includes. Same wording as ios/CineArch/Data/Plans.swift.
export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    label: 'Indie Log',
    price: '$0',
    desc: 'Everything you need to log your days and count them toward your card.',
    benefits: [
      'Union guide and rate cards for every province',
      'Pay calculator with overtime and minimum calls',
      'Your Slate: mark every day you work',
      'Your Wrap: count your days toward your union card',
    ]
  },
  pro: {
    id: 'pro',
    label: 'A-List Pro',
    price: '$15',
    desc: 'The business side of your career, handled.',
    benefits: [
      'Everything in Indie Log',
      'Sync Online: one account on your phone, iPad and the website',
      'Wrap Wallet: an income and expense ledger with Canadian tax rules',
      'Your $30k GST/HST line, tracked as you earn',
      'What to set aside for CPP and income tax',
      'Green Lit: back every Wallet entry with proof (up to 5 GB)',
      'Read receipts and pay stubs with your camera',
      'Bulk upload: up to 20 receipts or pay stubs at a time',
      'Export your Wrap Wallet as a spreadsheet',
      'Union joining fees, ahead of time',
      'The Vault: pay stubs and proof for your union application',
      'Your Ledger: PDF and CSV reports for applications and tax time',
    ]
  },
  agency: {
    id: 'agency',
    label: 'Agency Command',
    price: '$95',
    desc: 'For agencies and managers looking after a roster.',
    benefits: [
      'Everything in A-List Pro',
      "Your Roster: every client's days and progress in one place",
      'Bulk upload for the whole roster',
      'Priority support',
    ]
  }
};

export interface AgencyInvite {
  id: string;
  agencyId: string;
  agencyName: string;
  createdAt: string;
}

export interface ResidencyDocument {
  id: string;
  userId: string;
  type: string;
  fileName: string;
  storagePath?: string;
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

export type TransactionType = 'INCOME' | 'EXPENSE' | 'ASSET_PURCHASE' | 'DRAW' | 'LOAN' | 'TAX_PAYMENT' | 'REIMBURSEMENT';

export interface FinanceTransaction {
  id: string;
  userId: string;
  jobId?: string; 
  type: TransactionType;
  dateIncurred: string;
  datePaid?: string;
  description: string;
  category: string; 
  amountBeforeTax: number;
  taxAmount: number; 
  totalAmount: number;
  businessUsePercent: number; 
  deductibleAmount?: number;
  addBackAmount?: number;
  ruleTags?: string[]; 
  proofPath?: string;            // receipt, pay stub or invoice; with proof the entry is Green Lit
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
