
import { CanadianProvince as P, type UnionType } from '../../types';

export const UNION_REGISTRY: Record<string, UnionType> = {
  'u-actra': {
    id: 'u-actra',
    regions: [P.ON, P.QC, P.AB, P.MB, P.SK, P.NS, P.NB, P.NL, P.PE, P.YT, P.NT, P.NU],
    name: 'ACTRA',
    description: 'National baseline for performers (Except BC). Authority for Actors, Background, and Stunts.',
    defaultDuesRate: 0.0225,
    applicationFee: 75,
    memberBenefits: ['Health Insurance', 'Retirement Plan', 'Collective Bargaining'],
    tiers: [{ name: 'Full Member', targetType: 'CREDITS', targetValue: 3, description: '3 Qualified Credits.' }]
  },
  'u-ubcp': {
    id: 'u-ubcp',
    regions: [P.BC],
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
    regions: [P.ON],
    name: 'IATSE 873',
    description: 'Toronto technical local. Jurisdiction for Script Supervisors and primary Tech Depts in the GTA.',
    defaultDuesRate: 0.045,
    applicationFee: 200,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 90, description: 'Toronto Tech Standard.' }]
  },
  'u-nabet': {
    id: 'u-nabet',
    regions: [P.ON],
    name: 'NABET 700-M UNIFOR',
    description: 'Ontario technical guild. Competitive jurisdiction for Tech, Craft, and Transportation.',
    defaultDuesRate: 0.03,
    applicationFee: 150,
    tiers: [{ name: 'Permittee', targetType: 'DAYS', targetValue: 40, description: 'At least 40 days of relevant experience in the department you apply to (non-union, commercial, online, student, volunteer, stage, print & advertising and international work all count). Permittees work on NABET signatory productions after available members have been considered; permittee status is the route to full membership.' }],
    joiningRequirements: ['Canadian citizenship, permanent residency, or a valid work permit', 'NABETiquette certificate (valid for three years; certificates issued on or after July 9, 2017 are accepted)', 'Ontario Ministry of Labour Worker and Supervisor Health & Safety Awareness certificates', 'Any department-specific requirements and relevant licences (e.g. transport or hair)', 'At least 40 days of relevant work experience in the department'],
    applicationProcess: ['Complete the Permittee Application Form in full', 'Take NABETiquette, the mandatory etiquette and protocol course (register and pay in advance by phone at 416-536-4827 or in person)', 'Gather department-specific requirements and copies of relevant licences', 'Complete the Ministry of Labour Worker and Supervisor Health & Safety modules and download the certificates', 'Attach your most up-to-date resume showing at least 40 days of relevant experience', 'Submit by mail, in person, or by email to permitteeapplications@nabet700.com'],
    contactEmail: 'permitteeapplications@nabet700.com',
    contactPhone: '416-536-4827',
    jurisdictionalNotes: 'Applications are accepted year-round; incomplete applications are not accepted. Applying to more than one department requires a separate application for each. Applications are reviewed by the Department VP/Committee and the decision is sent by email and regular mail.'
  },
  'u-891': {
    id: 'u-891',
    regions: [P.BC, P.YT],
    name: 'IATSE 891',
    description: 'BC/Yukon technical local. Jurisdiction for Tech, Sound, and First Aid.',
    defaultDuesRate: 0.035,
    applicationFee: 150,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 90, description: 'BC Tech Standard.' }],
    departments: ['Accounting', 'Art', 'Construction', 'Costume', 'Editing', 'First Aid / Craft Service', 'Greens', 'Grips', 'Hair', 'Lighting / Electrics', 'Makeup', 'Painting', 'Production Office', 'Props', 'Script Supervisors', 'Set Decorating', 'Sound', 'Special Effects', 'Visual Effects']
  },
  'u-212': {
    id: 'u-212',
    regions: [P.AB],
    name: 'IATSE 212',
    description: 'Alberta Mixed Local. Covers Tech, Sound, Art Dept, and Picture Editing.',
    defaultDuesRate: 0.03,
    applicationFee: 100,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 60, description: 'Alberta Standard.' }],
    departments: ['Accounting', 'Art', 'Construction', 'Costume', 'Craft Services', 'Editors', 'First Aid', 'Greens', 'Grips', 'Hair', 'High Rigger', 'Lighting / Electrics', 'Makeup', 'Painting', 'Props', 'Script Coordinators', 'Script Supervisors', 'Sculpting', 'Security / Watchman', 'Set Decorating', 'Sound', 'Special Effects', 'Tutors', 'Visual Effects / CGI']
  },
  'u-856': {
    id: 'u-856',
    regions: [P.MB],
    name: 'IATSE 856',
    description: 'Manitoba Local. Jurisdiction for Tech, Sound, FACS, and Transportation.',
    defaultDuesRate: 0.03,
    applicationFee: 600,
    jurisdictionalNotes: 'FACS (First Aid / Craft Service) is a unique hybrid department in MB.',
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 60, description: '60+ days worked on 2 or more IATSE 856 productions.' }],
    joiningRequirements: ['60+ days worked on 2 or more IATSE 856 productions', 'Valid Emergency (Basic) First Aid Certificate or higher', 'Completion of the Collective Agreement Course hosted by IATSE Local 856', '$600 membership application fee', 'To stay in good standing: pay annual dues on time and follow the Local 856 Constitution and By-Laws'],
    departments: ['Animal Wrangling', 'Art', 'Background Casting', 'Catering', 'Construction', 'Continuity (Script)', 'Costume', 'First Aid and Craft Services (FACS)', 'Greens', 'Grips', 'Hairstylists', 'Lighting', 'Makeup Artists', 'Paint', 'Picture Vehicles', 'Props', 'Security', 'Set Decorating', 'Sound', 'Special Effects', 'Transportation']
  },
  'u-849': {
    id: 'u-849',
    regions: [P.NS, P.NB, P.NL, P.PE],
    name: 'IATSE 849',
    description: 'Atlantic Technical Local. Covers all tech, Sound, and Transportation.',
    defaultDuesRate: 0.03,
    applicationFee: 100,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 60, description: 'Atlantic Standard.' }],
    departments: ['Animal Wrangler', 'Costumes', 'Craft Service', 'Diving', 'Greens', 'Grip', 'Hair', 'Lighting', 'Make-up', 'Marine', 'Props', 'Scenic Paint', 'Script Supervision', 'Set Construction', 'Set Decoration', 'Sound', 'Special Effects', 'Transportation']
  },
  'u-667': {
    id: 'u-667',
    regions: [P.ON, P.QC, P.NS, P.NB, P.NL, P.PE],
    name: 'IATSE 667',
    description: 'Cinematographers Guild (Eastern). Camera authority in ON, QC, and Atlantic.',
    defaultDuesRate: 0.04,
    applicationFee: 300,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 60, description: 'Eastern Camera.' }]
  },
  'u-669': {
    id: 'u-669',
    regions: [P.BC, P.AB, P.SK, P.MB, P.YT, P.NT, P.NU],
    name: 'IATSE 669',
    description: 'Cinematographers Guild (Western). Camera authority in BC, AB, SK, MB, and Territories.',
    defaultDuesRate: 0.04,
    applicationFee: 300,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 60, description: 'Western Camera.' }]
  },
  'u-aqtis': {
    id: 'u-aqtis',
    regions: [P.QC],
    name: 'AQTIS 514 IATSE',
    description: 'Quebec Mega-Local for all technical and camera departments.',
    defaultDuesRate: 0.03,
    applicationFee: 250,
    residencyRule: 'QC Residency required.',
    tiers: [{ name: 'Permittee', targetType: 'DAYS', targetValue: 90, description: 'Quebec Standard.' }]
  },
  'u-t155': {
    id: 'u-t155',
    regions: [P.BC],
    name: 'Teamsters 155',
    description: 'Transportation and Security in British Columbia.',
    defaultDuesRate: 0.03,
    applicationFee: 200,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 100, description: 'BC Transpo.' }]
  },
  'u-t938': {
    id: 'u-t938',
    regions: [P.ON],
    name: 'Teamsters 938',
    description: 'Transportation and Logistics in Ontario.',
    defaultDuesRate: 0.03,
    applicationFee: 200,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 100, description: 'Ontario Transpo.' }]
  },
  'u-t362': {
    id: 'u-t362',
    regions: [P.AB],
    name: 'Teamsters 362',
    description: 'Transportation and Security in Alberta.',
    defaultDuesRate: 0.03,
    applicationFee: 200,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 100, description: 'AB Transpo.' }]
  },
  'u-411': {
    id: 'u-411',
    regions: [P.ON],
    name: 'IATSE 411',
    description: 'Ontario specialized local for Coordinators and Craft Service.',
    defaultDuesRate: 0.035,
    applicationFee: 150,
    tiers: [{ name: 'Member', targetType: 'DAYS', targetValue: 120, description: 'Ontario Standard.' }]
  }
};
