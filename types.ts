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
  memberStatus?: 'ASPIRING' | 'MEMBER';
  
  careerFocus?: string;
  department?: string;
  selectedRoles?: string[];
  goals?: string[];

  // Agent Fee Configuration
  hasAgentFee?: boolean;
  agentFeePercentage?: number;

  // Enterprise Specifics
  entityType?: EntityType;
  cohortYear?: string;
  programName?: string;
  organizationName?: string;

  businessStructure?: 'INCORPORATED' | 'SOLE_PROPRIETORSHIP' | 'EMPLOYEE' | 'ORGANIZATION';

  accountType: 'INDIVIDUAL' | 'AGENT';
  managedUsers?: User[]; 
  activeViewId?: string; 
  primaryIndustry?: string;

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
  joiningRequirements?: string[];
  applicationProcess?: string[];
  memberBenefits?: string[];
  residencyRule?: string;
  applicationFee?: number;
  contactEmail?: string;
  jurisdictionalNotes?: string;
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
  startDate: string; 
  endDate?: string;
  totalHours: number;
  hourlyRate?: number;
  grossEarnings?: number; 
  unionDeductions?: number; 
  notes?: string;
  documentCount: number;
  documentIds?: string[];
  createdAt: string; 
  imageUrl?: string;
  genre?: string;
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

export const UNIONS: UnionType[] = [
  { 
    id: 'u-actra', 
    name: 'ACTRA', 
    description: 'National Performer Guild representing actors, singers, and stunt performers.', 
    defaultDuesRate: 0.0225, 
    joiningRequirements: ['Proof of Canadian Citizenship/PR', 'Varies by credit type'],
    memberBenefits: ['Collective Bargaining', 'Retirement Plan', 'Health Insurance', 'Legal Assistance'],
    applicationProcess: ['Submit qualifying credits', 'Payment of application fee', 'Orientation attendance'],
    tiers: [
      { name: 'Apprentice', targetType: 'HOURS', targetValue: 1600, description: 'National Apprentice Program.' }, 
      { name: 'Full Member', targetType: 'CREDITS', targetValue: 3, description: 'Requires 3 qualifying credits.' }
    ] 
  },
  { 
    id: 'u-873', 
    name: 'IATSE 873', 
    description: 'Primary technical local for film and TV production in the Greater Toronto Area.', 
    defaultDuesRate: 0.045, 
    tiers: [{ name: 'Permit Status', targetType: 'DAYS', targetValue: 30, description: '30 days worked to gain status.' }] 
  },
  { 
    id: 'u-667', 
    name: 'IATSE 667', 
    description: 'International Cinematographers Guild representing camera personnel and publicists in Eastern Canada.', 
    defaultDuesRate: 0.04, 
    tiers: [{ name: 'Trainee', targetType: 'DAYS', targetValue: 60, description: 'Camera Trainee program.' }] 
  },
  { 
    id: 'u-411', 
    name: 'IATSE 411', 
    description: 'Specialized local for Production Coordinators, Assistant Coordinators, and Craft Service.', 
    defaultDuesRate: 0.035, 
    tiers: [{ name: 'Permit', targetType: 'DAYS', targetValue: 120, description: 'Requires 120 office days.' }],
    memberBenefits: ['Health & Welfare', 'Group RRSP', 'Master Contract Protections']
  },
  { 
    id: 'u-dgc', 
    name: 'Directors Guild of Canada', 
    description: 'National organization representing directors, editors, production designers, and more.', 
    defaultDuesRate: 0.02, 
    jurisdictionalNotes: 'In Quebec, technical positions are often represented by AQTIS 514 IATSE instead of DGC technical locals. DGC National standards apply to creative leadership.',
    applicationProcess: ['Check Department requirements', 'Complete Gap orientation', 'Apply to District Council'],
    tiers: [{ name: 'Associate', targetType: 'DAYS', targetValue: 150, description: 'Guild Apprentice Program.', requiresDepartment: true }] 
  },
  {
    id: 'u-aqtis',
    name: 'AQTIS 514 IATSE',
    description: 'The dominant technical guild in Quebec, formed by the merger of AQTIS and IATSE 514.',
    defaultDuesRate: 0.03,
    applicationFee: 250,
    contactEmail: 'membres@aqtis514iatse.com',
    memberBenefits: ['Group Insurance', 'RRSP Transfers', 'Collective Agreement Enforcement'],
    applicationProcess: [
      'Provide Date of Birth and SIN',
      'Complete Introduction to the Union session',
      'Accumulate department-specific days (90-200)',
      'Submit required letters of recommendation'
    ],
    tiers: [
      { name: 'Permit Holder', targetType: 'DAYS', targetValue: 90, description: 'Accumulated days under AQTIS contract.' }
    ],
    residencyRule: 'Provincial Quebec residency required for local member status.'
  }
];

export interface Plan {
  id: string;
  label: string;
  price: string;
  desc: string;
  benefits: string[];
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    label: 'Indie Log',
    price: '$0',
    desc: 'Local-only registry for individual crew.',
    benefits: ['5 Active Slates', 'Basic Audit Export', 'Regional Guild Metadata']
  },
  pro: {
    id: 'pro',
    label: 'A-List Pro',
    price: '$15',
    desc: 'Full financial terminal and vault access.',
    benefits: ['Unlimited Slates', 'Real-time GST Monitor', 'Encrypted Vault Storage', 'Audit Pack™ Compiler']
  },
  agency: {
    id: 'agency',
    label: 'Agency Command',
    price: '$95',
    desc: 'Multi-user roster management system.',
    benefits: ['Manage 35+ Personnel', 'Bulk Roster Ingest', 'Showrunner Aggregate Dashboard', 'Priority Support']
  }
};

export interface ResidencyDocument {
  id: string;
  userId: string;
  type: string;
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
