import { User, Job, UserUnionTracking, FinanceTransaction, FinanceStats } from '../types';

export const DEMO_FLAG = 'cinearch_demo';

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    new URLSearchParams(window.location.search).get('demo') === 'true' ||
    sessionStorage.getItem(DEMO_FLAG) === 'true'
  );
}

export function enterDemoMode() {
  sessionStorage.setItem(DEMO_FLAG, 'true');
  // Reload so the flag is picked up cleanly
  window.location.href = window.location.origin + window.location.pathname + '?demo=true';
}

export function exitDemoMode() {
  sessionStorage.removeItem(DEMO_FLAG);
  window.location.href = window.location.origin + window.location.pathname;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

export const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@cinearch.ca',
  name: 'Jordan Ellis',
  phone: '416-555-0192',
  country: 'CA',
  language: 'en',
  role: 'Camera Operator',
  province: 'Ontario',
  region: 'TORONTO',
  accountType: 'INDIVIDUAL',
  isOnboarded: true,
  isPremium: true,
  memberStatus: 'ASPIRING',
  careerFocus: 'Camera Department',
  department: 'Camera Department',
  selectedRoles: ['Camera Operator', 'First Assistant Camera'],
  goals: ['IATSE 667 Member', 'GST Registration'],
  hasAgentFee: false,
  agentFeePercentage: 0,
  businessStructure: 'SOLE_PROPRIETORSHIP',
  primaryIndustry: 'Film & Television',
  stats: {
    totalHours: 672,
    totalEarnings: 22400,
    totalDeductions: 3100,
    unionStatus: 'IATSE 667 Permit',
    lastUpdated: new Date().toISOString(),
  },
};

export const DEMO_JOBS: Job[] = [
  {
    id: 'demo-job-001',
    userId: DEMO_USER.id,
    status: 'CONFIRMED',
    productionName: 'Untitled Horror Feature',
    companyName: 'Darkfield Productions Inc.',
    role: 'Camera Operator',
    department: 'Camera Department',
    isUnion: true,
    unionTypeId: 'u-667',
    unionName: 'IATSE 667',
    creditType: 'CREW',
    startDate: '2026-01-06',
    endDate: '2026-03-14',
    totalHours: 280,
    hourlyRate: 48,
    grossEarnings: 13440,
    unionDeductions: 604,
    province: 'Ontario',
    genre: 'Horror',
    documentCount: 2,
    documentIds: ['doc-001', 'doc-002'],
    createdAt: '2026-01-05T09:00:00Z',
  },
  {
    id: 'demo-job-002',
    userId: DEMO_USER.id,
    status: 'CONFIRMED',
    productionName: 'Northern Lights (Series)',
    companyName: 'Apex Screen Partners',
    role: 'First Assistant Camera',
    department: 'Camera Department',
    isUnion: true,
    unionTypeId: 'u-667',
    unionName: 'IATSE 667',
    creditType: 'CREW',
    startDate: '2025-09-15',
    endDate: '2025-12-20',
    totalHours: 312,
    hourlyRate: 44,
    grossEarnings: 13728,
    unionDeductions: 549,
    province: 'Ontario',
    genre: 'Drama',
    documentCount: 1,
    documentIds: ['doc-003'],
    createdAt: '2025-09-14T08:00:00Z',
  },
  {
    id: 'demo-job-003',
    userId: DEMO_USER.id,
    status: 'TENTATIVE',
    productionName: 'The Long Weekend',
    companyName: 'Junction Films',
    role: 'Camera Operator',
    department: 'Camera Department',
    isUnion: false,
    startDate: '2026-08-01',
    totalHours: 80,
    hourlyRate: 35,
    grossEarnings: 2800,
    province: 'Ontario',
    genre: 'Comedy',
    documentCount: 0,
    createdAt: '2026-05-20T10:00:00Z',
  },
];

export const DEMO_TRACKING: UserUnionTracking[] = [
  {
    id: 'demo-track-001',
    userId: DEMO_USER.id,
    unionTypeId: 'u-667',
    unionName: 'IATSE 667',
    tierLabel: 'Full Member',
    department: 'Camera Department',
    targetType: 'DAYS',
    targetValue: 90,
    startingValue: 0,
  },
  {
    id: 'demo-track-002',
    userId: DEMO_USER.id,
    unionTypeId: 'u-actra',
    unionName: 'ACTRA',
    tierLabel: 'Full Member',
    targetType: 'CREDITS',
    targetValue: 3,
    startingValue: 0,
  },
];

export const DEMO_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: 'demo-tx-001',
    userId: DEMO_USER.id,
    jobId: 'demo-job-001',
    type: 'INCOME',
    dateIncurred: '2026-03-14',
    description: 'Untitled Horror Feature — Final Pay',
    category: 'SERVICE_FEES',
    amountBeforeTax: 13440,
    taxAmount: 0,
    totalAmount: 13440,
    businessUsePercent: 100,
    deductibleAmount: 0,
    ruleTags: [],
  },
  {
    id: 'demo-tx-002',
    userId: DEMO_USER.id,
    type: 'EXPENSE',
    dateIncurred: '2026-02-10',
    description: 'Lens Rental — Zeiss CP.3 Set',
    category: 'GEAR_SMALL_TOOLS',
    amountBeforeTax: 480,
    taxAmount: 62.4,
    totalAmount: 542.4,
    businessUsePercent: 100,
    deductibleAmount: 480,
    ruleTags: [],
  },
  {
    id: 'demo-tx-003',
    userId: DEMO_USER.id,
    type: 'EXPENSE',
    dateIncurred: '2026-01-22',
    description: 'Crew Meal — Location Catering',
    category: 'MEALS_ENTERTAINMENT',
    amountBeforeTax: 68,
    taxAmount: 8.84,
    totalAmount: 76.84,
    businessUsePercent: 100,
    deductibleAmount: 34,
    ruleTags: ['MEALS_50_LIMIT'],
  },
  {
    id: 'demo-tx-004',
    userId: DEMO_USER.id,
    jobId: 'demo-job-002',
    type: 'INCOME',
    dateIncurred: '2025-12-20',
    description: 'Northern Lights — Series Pay',
    category: 'SERVICE_FEES',
    amountBeforeTax: 13728,
    taxAmount: 0,
    totalAmount: 13728,
    businessUsePercent: 100,
    deductibleAmount: 0,
    ruleTags: [],
  },
];

export const DEMO_STATS: FinanceStats & { estCPP: number; estIncomeTax: number } = {
  grossIncomeYTD: 16240,
  totalExpensesYTD: 619.24,
  deductibleExpensesYTD: 514,
  netIncomeYTD: 15620.76,
  gstCollected: 0,
  gstPaid: 71.24,
  gstNetRemittance: -71.24,
  taxableIncomeProjected: 15106.76,
  estCPP: 878,
  estIncomeTax: 2265,
};
