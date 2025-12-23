
import React from 'react';

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
  cohort?: string; // For filtering roster groups

  // Fee Configuration
  feeModel?: 'COMMISSION' | 'FLAT_FEE' | 'NONE';
  agentFeePercentage?: number;
  flatFeeAmount?: number;
  // Added missing property used in storage service for showrunner initialization
  hasAgentFee?: boolean;

  businessStructure?: 'INCORPORATED' | 'SOLE_PROPRIETORSHIP' | 'EMPLOYEE' | 'ORGANIZATION';
  accountType: 'INDIVIDUAL' | 'AGENT';
  
  managedUsers?: User[]; 
  activeViewId?: string; 
  agentId?: string;
  premiumSeatsTotal?: number;
  premiumSeatsUsed?: number;
  allowAgentFinance?: boolean;
  
  primaryIndustry?: string;
  organizationName?: string;
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
  role: string; // Must map to canonical list
  department?: string;
  isUnion: boolean;
  unionTypeId?: string;
  unionName?: string;
  startDate: string; 
  endDate?: string;
  totalHours: number;
  grossEarnings?: number; 
  createdAt: string;
  documentCount: number;
  // Added missing property for reports and analytics calculations
  unionDeductions?: number;
}

// Added missing interface for the Document Vault system
export interface ResidencyDocument {
  id: string;
  name: string;
  type: string;
  uri: string;
  timestamp: string;
}

// Added missing types for the Wrap Wallet financial system
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface FinanceTransaction {
  id: string;
  userId: string;
  jobId?: string;
  type: TransactionType;
  category: string;
  description: string;
  amountBeforeTax: number;
  taxAmount: number;
  totalAmount: number;
  dateIncurred: string;
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

// Added missing interface for the Editorial Resources system
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

export const CanadianProvince = {
  ON: "Ontario",
  BC: "British Columbia",
  QC: "Quebec",
  AB: "Alberta",
  MB: "Manitoba",
  SK: "Saskatchewan",
  NS: "Nova Scotia",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  PE: "Prince Edward Island",
  YT: "Yukon",
  NT: "Northwest Territories",
  NU: "Nunavut"
};

// Added missing helper type for province key mapping
export type ProvinceCode = keyof typeof CanadianProvince;

export const UNIONS: UnionType[] = [
  { id: 'u1', name: 'ACTRA', description: 'Alliance of Canadian Cinema, Television and Radio Artists', defaultDuesRate: 0.0225, tiers: [{ name: 'Apprentice', targetType: 'HOURS', targetValue: 1600, description: 'Accumulate 1600 hours to join.' }] },
  { id: 'u2', name: 'IATSE', description: 'International Alliance of Theatrical Stage Employees', defaultDuesRate: 0.045, tiers: [{ name: 'Permit Status', targetType: 'DAYS', targetValue: 120, description: '120 days worked in a specific department.' }] },
  { id: 'u3', name: 'DGC', description: 'Directors Guild of Canada', defaultDuesRate: 0.02, tiers: [{ name: 'Associate', targetType: 'DAYS', targetValue: 150, description: 'Guild Apprentice Program (150 days).' }] },
];

export const PLANS: Record<string, { id: string, label: string, price: string, desc: string, benefits: string[] }> = {
  indie: { id: 'indie', label: 'Indie Log', price: 'Free', desc: 'Personal use.', benefits: ['Basic Tracking'] },
  pro: { id: 'pro', label: 'A-List', price: '$15', desc: 'Professional crew.', benefits: ['Unlimited Logs', 'Audit Packs'] },
  agency: { id: 'agency', label: 'Showrunner', price: '$90', desc: 'Roster management.', benefits: ['35 Clients', 'Compliance Audit'] }
};
