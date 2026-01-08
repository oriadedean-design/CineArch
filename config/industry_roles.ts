
export interface JurisdictionOverride {
  province: 'Quebec' | 'Ontario' | 'BC' | 'Other';
  union: string;
  daysRequired?: number;
  productionsRequired?: number;
  trainings?: string[];
  notes?: string;
}

export interface IndustryRole {
  name: string;
  primaryUnion: string;
  description: string;
  departmentCode: string;
  requirements?: string[];
  jurisdictionOverrides?: JurisdictionOverride[];
}

export interface IndustryDepartment {
  name: string;
  code: string;
  description: string;
  roles: IndustryRole[];
}

export const INDUSTRY_DEPARTMENTS: IndustryDepartment[] = [
  {
    name: "Direction",
    code: "DIR",
    description: "The driving force behind the artistic and dramatic visualization of the script.",
    roles: [
      { 
        name: "Director", 
        primaryUnion: "DGC", 
        departmentCode: "DIR",
        description: "The primary creative lead responsible for guiding technical crew and performances.",
        requirements: ["DGC Membership", "Creative Portfolio", "Gap Training"]
      },
      { 
        name: "1st Assistant Director", 
        primaryUnion: "DGC", 
        departmentCode: "DIR",
        description: "The Director's right hand. Responsible for set discipline and the daily shooting schedule.",
        requirements: ["DGC Membership", "WHMIS", "First Aid Level 1"]
      },
      { 
        name: "Script Supervisor", 
        primaryUnion: "DGC", 
        departmentCode: "DIR",
        description: "The guardian of continuity, timing, and editing notes for the production.",
        requirements: ["Script Supervisor Course", "Attention to detail", "Digital Continuity Tools"]
      }
    ]
  },
  {
    name: "Camera Department",
    code: "CAM",
    description: "Optics, lighting, and visual capture technical crew.",
    roles: [
      { 
        name: "DOP / Operator", 
        primaryUnion: "IATSE 667", 
        departmentCode: "CAM",
        description: "Chief of camera and lighting, responsible for the cinematic look.",
        requirements: ["667/669 Membership", "Technical Reel", "Adv. Optics Certification"]
      },
      { 
        name: "Assistant (1st/2nd)", 
        primaryUnion: "IATSE 667", 
        departmentCode: "CAM",
        description: "Responsible for camera maintenance, focus pulling, and technical assembly.",
        requirements: ["Equipment Knowledge", "Focus Pulling Exp", "667/669 Permit"]
      }
    ]
  },
  {
    name: "Art Dept",
    code: "ART",
    description: "Visual generation of sets, environments, and overall design concepts.",
    roles: [
      { 
        name: "Production Designer", 
        primaryUnion: "DGC", 
        departmentCode: "ART",
        description: "Visionary lead for all visual elements. Works directly with the Director.",
        requirements: ["DGC/Local Membership", "Architectural Knowledge", "Design Portfolio"]
      },
      { 
        name: "Art Director", 
        primaryUnion: "DGC", 
        departmentCode: "ART",
        description: "The logistical head of the art department, managing budgets and execution.",
        requirements: ["Budgeting Experience", "DGC Membership", "Drafting Proficiency"]
      }
    ]
  },
  {
    name: "Lighting/Electric",
    code: "ELE",
    description: "Electrical distribution and lighting equipment management.",
    roles: [
      { 
        name: "Gaffer / Spark", 
        primaryUnion: "IATSE 873", 
        departmentCode: "ELE",
        description: "Chief of the electrical department, executing the DOP's lighting plan.",
        requirements: ["Master Electrician (Local Dependent)", "WHMIS", "873/NABET Membership"]
      }
    ]
  },
  {
    name: "Transportation",
    code: "TRA",
    description: "Logistics and fleet management for cast, crew, and equipment.",
    roles: [
      { 
        name: "Coordinator / Driver", 
        primaryUnion: "Teamsters", 
        departmentCode: "TRA",
        description: "Responsible for the movement of assets and personnel across locations.",
        requirements: ["Class 1/3 Driver's License", "Teamsters Membership", "Clean Abstract"]
      }
    ]
  },
  {
    name: "Craft Service",
    code: "CFT",
    description: "On-set catering and refreshment services.",
    roles: [
      { 
        name: "Server", 
        primaryUnion: "IATSE 873", 
        departmentCode: "CFT",
        description: "Providing nutrition and refreshments to cast and crew during production.",
        requirements: ["Food Handlers Certificate", "WHMIS", "Regional Guild Status"]
      }
    ]
  },
  {
    name: "First Aid",
    code: "FAD",
    description: "Medical safety and emergency response for the production set.",
    roles: [
      { 
        name: "Attendant", 
        primaryUnion: "N/A", 
        departmentCode: "FAD",
        description: "Ensuring the physical safety of all personnel on set.",
        requirements: ["OFA Level 3", "CPR Certification", "Medical Equipment Kit"]
      }
    ]
  }
];
