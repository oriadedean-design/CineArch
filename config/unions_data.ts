import { UnionType } from '../types';

/**
 * THE UNION REGISTRY
 * Each union is defined here as a "Spec". 
 * Update these objects to change benefits, fees, or national processes.
 */

export const UNION_SPECS: Record<string, UnionType> = {
  'u-actra': {
    id: 'u-actra',
    name: 'ACTRA',
    description: 'National Performer Guild representing actors, singers, and stunt performers.',
    defaultDuesRate: 0.0225,
    applicationFee: 75,
    memberBenefits: ['Collective Bargaining', 'Retirement Plan', 'Health Insurance', 'Legal Assistance'],
    applicationProcess: [
      'Submit qualifying credits (Voucher/Contract)',
      'Payment of permit or initiation fee',
      'Attend professional orientation session'
    ],
    tiers: [
      { name: 'Apprentice', targetType: 'CREDITS', targetValue: 1, description: 'Single qualifying credit.' },
      { name: 'Full Member', targetType: 'CREDITS', targetValue: 3, description: 'Three qualifying credits.' }
    ]
  },
  'u-dgc': {
    id: 'u-dgc',
    name: 'Directors Guild of Canada',
    description: 'National organization representing creative and logistical leadership.',
    defaultDuesRate: 0.02,
    applicationFee: 500,
    jurisdictionalNotes: 'DGC operates via District Councils (BC, Alberta, Ontario, Atlantic, etc). Rules are largely national but local council dues vary.',
    memberBenefits: ['National Pension Plan', 'DGC Health & Welfare', 'Creative Rights Protection'],
    applicationProcess: [
      'Review Department-specific requirements',
      'Submit proof of residency and work days',
      'Pay District Council initiation fee',
      'Orientation and Gap Training completion'
    ],
    tiers: [
      { name: 'Associate', targetType: 'DAYS', targetValue: 150, description: 'Entry level permit status.' },
      { name: 'Member', targetType: 'DAYS', targetValue: 300, description: 'Full professional membership.' }
    ]
  },
  'u-873': {
    id: 'u-873',
    name: 'IATSE 873',
    description: 'Technical production local for the Greater Toronto Area.',
    defaultDuesRate: 0.045,
    applicationFee: 200,
    memberBenefits: ['Local 873 Health Plan', 'Group RRSP', 'Technical Training Labs'],
    applicationProcess: [
      '30-60 Days worked in department',
      'Submit resume and letters of recommendation',
      'Interview with Department Committee'
    ],
    tiers: [
      { name: 'Permit', targetType: 'DAYS', targetValue: 30, description: 'Initial work eligibility.' },
      { name: 'Member', targetType: 'DAYS', targetValue: 90, description: 'Full voting status.' }
    ]
  },
  'u-411': {
    id: 'u-411',
    name: 'IATSE 411',
    description: 'Specialized local for Production Coordinators and Craft Service in Ontario.',
    defaultDuesRate: 0.035,
    applicationFee: 150,
    memberBenefits: ['Health & Welfare', 'Contract Protection', 'Industry Networking'],
    applicationProcess: [
      'Proof of 120 days in production office (for PC)',
      'Reference letters from existing members',
      'Membership committee review'
    ],
    tiers: [
      { name: 'Member', targetType: 'DAYS', targetValue: 120, description: 'Standard membership.' }
    ]
  },
  'u-667': {
    id: 'u-667',
    name: 'IATSE 667',
    description: 'International Cinematographers Guild for Eastern Canada.',
    defaultDuesRate: 0.04,
    applicationFee: 300,
    memberBenefits: ['Camera Training', 'Equipment Insurance Access', 'Health & Dental'],
    applicationProcess: [
      'Submit portfolio and work history',
      'Verification of specialized technical training',
      'Review by National Executive Board'
    ],
    tiers: [
      { name: 'Trainee', targetType: 'DAYS', targetValue: 60, description: 'Camera Trainee program.' }
    ]
  },
  'u-669': {
    id: 'u-669',
    name: 'IATSE 669',
    description: 'International Cinematographers Guild for Western Canada.',
    defaultDuesRate: 0.04,
    applicationFee: 300,
    memberBenefits: ['Technical Training', 'Health & Welfare', 'Contract Enforcement'],
    applicationProcess: [
      'Residency in Western Canada/Yukon',
      'Relevant work experience in camera department',
      'Safety training certification'
    ],
    tiers: [
      { name: 'Trainee', targetType: 'DAYS', targetValue: 60, description: 'Camera Trainee program.' }
    ]
  },
  'u-aqtis': {
    id: 'u-aqtis',
    name: 'AQTIS 514 IATSE',
    description: 'The dominant technical guild in Quebec.',
    defaultDuesRate: 0.03,
    applicationFee: 250,
    residencyRule: 'Strict Quebec provincial residency required.',
    memberBenefits: ['Group Insurance', 'RRSP Transfers', 'Collective Agreement Enforcement'],
    applicationProcess: [
      'Attend "Introduction to the Union" course',
      'Accumulate department-specific work days (90-200)',
      'Submit proof of SIN and DOB'
    ],
    tiers: [
      { name: 'Permittee', targetType: 'DAYS', targetValue: 90, description: 'Initial status.' }
    ]
  }
};