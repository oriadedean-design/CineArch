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
        description: "The primary creative lead responsible for guiding technical crew and performances from development through to the final cut."
      },
      { 
        name: "1st Assistant Director", 
        primaryUnion: "DGC", 
        departmentCode: "DIR",
        description: "The Director's right hand. Responsible for set discipline, scheduling, and ensuring the production stays on track. The primary 'Voice' of the floor."
      },
      { 
        name: "2nd Assistant Director", 
        primaryUnion: "DGC", 
        departmentCode: "DIR",
        description: "Manages the back-base, actor movements, and background performers. Responsible for the generation of the daily Call Sheet."
      },
      { 
        name: "Set P.A.", 
        primaryUnion: "DGC", 
        departmentCode: "DIR",
        description: "Entry-level production staff responsible for lock-ups, safety protocols on the floor, and general support for the AD department."
      }
    ]
  },
  {
    name: "Camera Department",
    code: "CAM",
    description: "Optics, lighting, and visual capture technical crew.",
    roles: [
      { 
        name: "Director of Photography", 
        primaryUnion: "IATSE 667", 
        departmentCode: "CAM",
        description: "Chief of camera and lighting, responsible for the cinematic look and technical execution of the visual narrative."
      },
      { 
        name: "1st Assistant Camera", 
        primaryUnion: "IATSE 667", 
        departmentCode: "CAM",
        description: "The Focus Puller. Responsible for camera maintenance, technical assembly, and ensuring the image remains sharp at all times."
      },
      { 
        name: "Camera Trainee", 
        primaryUnion: "IATSE 667", 
        departmentCode: "CAM",
        description: "Apprentice role assisting the 2nd AC with equipment organization, slate marking, and battery management."
      },
      { 
        name: "Still Photographer", 
        primaryUnion: "IATSE 667", 
        departmentCode: "CAM",
        description: "Captures high-resolution production stills for marketing, archival, and unit publicity."
      }
    ]
  },
  {
    name: "Art Department",
    code: "ART",
    description: "Visual generation of sets, environments, and overall design concepts.",
    roles: [
      { 
        name: "Production Designer", 
        primaryUnion: "DGC", 
        departmentCode: "ART",
        description: "Visionary lead for all visual elements including sets, props, and location transformations. Works directly with the Director."
      },
      { 
        name: "Art Director", 
        primaryUnion: "DGC", 
        departmentCode: "ART",
        description: "The logistical head of the art department. Manages the budget, draftspersons, and execution of the Designer's vision."
      }
    ]
  },
  {
    name: "Production Office",
    code: "OFF",
    description: "The administrative and logistical backbone of the production.",
    roles: [
      { 
        name: "Production Coordinator", 
        primaryUnion: "IATSE 411", 
        departmentCode: "OFF",
        description: "Manages the heavy logistics: travel, housing, shipping, and the distribution of production paperwork."
      },
      { 
        name: "Production Secretary", 
        primaryUnion: "IATSE 411", 
        departmentCode: "OFF",
        description: "Assists the Coordinator with day-to-day administrative tasks, reception, and filing."
      },
      { 
        name: "Office P.A.", 
        primaryUnion: "IATSE 411", 
        departmentCode: "OFF",
        description: "General administrative support, courier runs, and maintaining production office operations."
      }
    ]
  },
  {
    name: "Construction",
    code: "CON",
    description: "Fabrication and structural execution of production sets.",
    roles: [
      { 
        name: "Construction Coordinator", 
        primaryUnion: "IATSE 873", 
        departmentCode: "CON",
        description: "Managing the set build budget, materials procurement, and the structural build team."
      },
      { 
        name: "Scenic Artist", 
        primaryUnion: "IATSE 873", 
        departmentCode: "CON",
        description: "Responsible for specialized painting, textures, and aging effects on set structures."
      }
    ]
  }
];