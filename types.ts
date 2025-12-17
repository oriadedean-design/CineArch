
export interface User {
  id: string;
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
  
  careerFocus?: string;
  department?: string;
  selectedRoles?: string[];
  goals?: string[];

  businessStructure?: 'INCORPORATED' | 'SOLE_PROPRIETORSHIP' | 'EMPLOYEE' | 'NONE';

  accountType: 'INDIVIDUAL' | 'AGENT';
  managedUsers?: User[]; 
  activeViewId?: string; 
  primaryIndustry?: string;
  organizationName?: string;

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
  { id: 'u1', name: 'ACTRA', description: 'Alliance of Canadian Cinema, Television and Radio Artists', defaultDuesRate: 0.0225, tiers: [{ name: 'Apprentice', targetType: 'HOURS', targetValue: 1600, description: 'Accumulate 1600 hours to join.' }, { name: 'Full Member', targetType: 'CREDITS', targetValue: 3, description: 'Requires 3 qualifying credits.' }] },
  { id: 'u2', name: 'IATSE', description: 'International Alliance of Theatrical Stage Employees', defaultDuesRate: 0.045, tiers: [{ name: 'Permit Status', targetType: 'DAYS', targetValue: 120, description: '120 days worked in a specific department.', requiresDepartment: true }] },
  { id: 'u3', name: 'DGC', description: 'Directors Guild of Canada', defaultDuesRate: 0.02, tiers: [{ name: 'Associate', targetType: 'DAYS', targetValue: 150, description: 'Guild Apprentice Program (150 days).', requiresDepartment: true }] },
  { id: 'u4', name: 'WGC', description: 'Writers Guild of Canada', defaultDuesRate: 0.02, tiers: [{ name: 'Member', targetType: 'CREDITS', targetValue: 1, description: 'Requires one produced script credit.' }, { name: 'Apprentice', targetType: 'HOURS', targetValue: 500, description: 'Requires 500 development hours.' }] },
];

export interface Plan {
  id: string;
  label: string;
  price: string;
  desc: string;
  benefits: string[];
}

export const PLANS: Record<string, Plan> = {
  indie: {
    id: 'indie',
    label: 'Indie Log',
    price: 'Free',
    desc: 'For independent creators and students.',
    benefits: ['Up to 3 Production Logs', 'Basic Union Tracking', 'Encrypted Document Vault']
  },
  pro: {
    id: 'pro',
    label: 'A-List',
    price: '$15',
    desc: 'The industry standard for active crew.',
    benefits: ['Unlimited Production Logs', 'Bulk Log Import', 'Audit Packs', 'GST Threshold Monitoring']
  },
  agency: {
    id: 'agency',
    label: 'Showrunner',
    price: '$90',
    desc: 'Complete roster management for agents.',
    benefits: ['Manage up to 35 Clients', 'Aggregated Guild Analytics', 'Roster-wide Compliance Checks', 'Priority Support']
  }
};
