
import { UnionType } from '../../types';

export const UNION_REGISTRY: Record<string, UnionType> = {
  'u-actra': {
    id: 'u-actra',
    name: 'ACTRA',
    description: 'National baseline for performers (Except BC). Authority for Actors, Background, and Stunts.',
    defaultDuesRate: 0.0225,
    applicationFee: 75,
    memberBenefits: ['Health Insurance', 'Retirement Plan', 'Collective Bargaining'],
    tiers: [{ name: 'Full Member', targetType: 'CREDITS', targetValue: 3, description: '3 Qualified Credits.' }]
  },
  'u-ubcp': {
    id: 'u-ubcp',
    name: 'UBCP/ACTRA',
    description: 'Autonomous BC branch representing performers in British Columbia.',
    defaultDuesRate: 0.025,
    applicationFee: 100,
    memberBenefits: ['BC Health & Welfare', 'Retirement Plan'],
    tiers: [{ name: 'Full Member', targetType: 'CREDITS', targetValue: 3, description: 'BC Standard.' }]
  },
  'u-dgc': {
    id: 'u-dgc',
    name: 'DGC',
    description: 'Directors Guild of Canada. Creative authority for Directors, ADs, PMs, Locations, and Editors.',
    defaultDuesRate: 0.02,
    applicationFee: 500,
    memberBenefits: ['National Pension', 'Health & Welfare'],
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 300, description: 'National standard.' }]
  },
  'u-wgc': {
    id: 'u-wgc',
    name: 'WGC',
    description: 'Writers Guild of Canada. Authority for screenwriters and story editors.',
    defaultDuesRate: 0.02,
    applicationFee: 350,
    tiers: [{ name: 'Full Member', targetType: 'CREDITS', targetValue: 1, description: 'Produced Credit.' }]
  },
  'u-873': {
    id: 'u-873',
    name: 'IATSE 873',
    description: 'Toronto technical local. Jurisdiction for Script Supervisors and primary Tech Depts in the GTA.',
    defaultDuesRate: 0.045,
    applicationFee: 200,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 90, description: 'Toronto Tech Standard.' }]
  },
  'u-nabet': {
    id: 'u-nabet',
    name: 'NABET 700-M UNIFOR',
    description: 'Ontario technical guild. Competitive jurisdiction for Tech, Craft, and Transportation.',
    defaultDuesRate: 0.03,
    applicationFee: 150,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 30, description: 'Ontario Tech Standard.' }]
  },
  'u-891': {
    id: 'u-891',
    name: 'IATSE 891',
    description: 'BC/Yukon technical local. Jurisdiction for Tech, Sound, and First Aid.',
    defaultDuesRate: 0.035,
    applicationFee: 150,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 90, description: 'BC Tech Standard.' }]
  },
  'u-212': {
    id: 'u-212',
    name: 'IATSE 212',
    description: 'Alberta Mixed Local. Covers Tech, Sound, Art Dept, and Picture Editing.',
    defaultDuesRate: 0.03,
    applicationFee: 100,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 60, description: 'Alberta Standard.' }]
  },
  'u-856': {
    id: 'u-856',
    name: 'IATSE 856',
    description: 'Manitoba Local. Jurisdiction for Tech, Sound, FACS, and Transportation.',
    defaultDuesRate: 0.03,
    applicationFee: 100,
    jurisdictionalNotes: 'FACS (First Aid / Craft Service) is a unique hybrid department in MB.',
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 60, description: 'Manitoba Standard.' }]
  },
  'u-849': {
    id: 'u-849',
    name: 'IATSE 849',
    description: 'Atlantic Technical Local. Covers all tech, Sound, and Transportation.',
    defaultDuesRate: 0.03,
    applicationFee: 100,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 60, description: 'Atlantic Standard.' }]
  },
  'u-667': {
    id: 'u-667',
    name: 'IATSE 667',
    description: 'Cinematographers Guild (Eastern). Camera authority in ON, QC, and Atlantic.',
    defaultDuesRate: 0.04,
    applicationFee: 300,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 60, description: 'Eastern Camera.' }]
  },
  'u-669': {
    id: 'u-669',
    name: 'IATSE 669',
    description: 'Cinematographers Guild (Western). Camera authority in BC, AB, SK, MB, and Territories.',
    defaultDuesRate: 0.04,
    applicationFee: 300,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 60, description: 'Western Camera.' }]
  },
  'u-aqtis': {
    id: 'u-aqtis',
    name: 'AQTIS 514 IATSE',
    description: 'Quebec Mega-Local for all technical and camera departments.',
    defaultDuesRate: 0.03,
    applicationFee: 250,
    residencyRule: 'QC Residency required.',
    tiers: [{ name: 'Permittee', targetType: 'DAYS', targetValue: 90, description: 'Quebec Standard.' }]
  },
  'u-t155': {
    id: 'u-t155',
    name: 'Teamsters 155',
    description: 'Transportation and Security in British Columbia.',
    defaultDuesRate: 0.03,
    applicationFee: 200,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 100, description: 'BC Transpo.' }]
  },
  'u-t938': {
    id: 'u-t938',
    name: 'Teamsters 938',
    description: 'Transportation and Logistics in Ontario.',
    defaultDuesRate: 0.03,
    applicationFee: 200,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 100, description: 'Ontario Transpo.' }]
  },
  'u-t362': {
    id: 'u-t362',
    name: 'Teamsters 362',
    description: 'Transportation and Security in Alberta.',
    defaultDuesRate: 0.03,
    applicationFee: 200,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 100, description: 'AB Transpo.' }]
  },
  'u-411': {
    id: 'u-411',
    name: 'IATSE 411',
    description: 'Ontario specialized local for Coordinators and Craft Service.',
    defaultDuesRate: 0.035,
    applicationFee: 150,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 120, description: 'Ontario Standard.' }]
  }
};
