
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
        description: "A Director is the driving force in the dramatic and artistic aspects of an audiovisual work. The Director visualizes and defines the style and structure of the script while guiding the technical crew and actors in the fulfillment of that vision.",
        requirements: ["DGC Membership", "Creative Portfolio", "Gap Training"]
      },
      { 
        name: "1st Assistant Director", 
        primaryUnion: "DGC", 
        departmentCode: "DIR",
        description: "Responsible for breaking down all elements presented in a script, working with the Director and the DP to develop the shooting plan and schedule, and then making it all actually happen on set. Must be a strong leader and brilliant puzzle-master.",
        requirements: ["DGC Membership", "WHMIS", "First Aid Level 1"]
      },
      { 
        name: "Script Supervisor", 
        primaryUnion: "DGC", 
        departmentCode: "DIR",
        description: "The guardian of continuity, timing, and editing notes for the production. Responsible for maintaining narrative logic across takes.",
        requirements: ["Script Supervisor Course", "Attention to detail"]
      }
    ]
  },
  {
    name: "Production Office",
    code: "PRO",
    description: "Administrative and logistical command for the production budget and operations.",
    roles: [
      {
        name: "Production Manager (PM)",
        primaryUnion: "DGC",
        departmentCode: "PRO",
        description: "Works closely with the Producer to oversee general operations through the implementation and administration of the production budget. Liaises effectively with all department heads.",
      },
      {
        name: "Assistant Production Manager (APM)",
        primaryUnion: "DGC",
        departmentCode: "PRO",
        description: "Assists the PM in the performance of his or her duties.",
      },
      {
        name: "Unit Manager (UM)",
        primaryUnion: "DGC",
        departmentCode: "PRO",
        description: "The PM’s representative on the shooting set. Supervises daily logistics in consultation with PM, Coordinator, ADs, and Art Dept.",
      },
      {
        name: "Production Coordinator",
        primaryUnion: "IATSE 411",
        departmentCode: "PRO",
        description: "Manages office operations, travel, insurance, and vendor relations.",
      }
    ]
  },
  {
    name: "Assistant Directors",
    code: "AD",
    description: "On-set management and communication bridge between creative and technical departments.",
    roles: [
      {
        name: "Second Assistant Director (2AD)",
        primaryUnion: "DGC",
        departmentCode: "AD",
        description: "Genius organizer and communicator. Creates daily call sheets and prep documentation, ensuring all required elements are reflected.",
      },
      {
        name: "Third Assistant Director (3AD)",
        primaryUnion: "DGC",
        departmentCode: "AD",
        description: "Works directly with the 1st AD on set to make sure operations are running smoothly. Keeps everyone informed of set needs.",
      },
      {
        name: "Fourth Assistant Director (4AD)",
        primaryUnion: "DGC",
        departmentCode: "AD",
        description: "Works at trailers managing cast during hair/makeup/wardrobe preparations and keeping them informed of timing needs.",
      },
      {
        name: "Set PA (PA)",
        primaryUnion: "DGC",
        departmentCode: "AD",
        description: "Assigned any and all necessary tasks by the senior ADs. Requires a strong work ethic and positive attitude.",
      }
    ]
  },
  {
    name: "Locations",
    code: "LOC",
    description: "Responsible for finding and securing environments for filming.",
    roles: [
      {
        name: "Location Manager (LM)",
        primaryUnion: "DGC",
        departmentCode: "LOC",
        description: "Responsible for finding filming locations fitting the vision, securing contracts, insurance, permits, and operational needs within budget.",
      },
      {
        name: "Assistant Location Manager (ALM)",
        primaryUnion: "DGC",
        departmentCode: "LOC",
        description: "Works under supervision of LM to secure permits, support space rentals, etc. Liaison between crew and public.",
      },
      {
        name: "Location Production Assistant (LPA)",
        primaryUnion: "DGC",
        departmentCode: "LOC",
        description: "Works on set to ensure permits and neighbours are respected and that set runs in a clean and efficient manner.",
      }
    ]
  },
  {
    name: "Art Dept",
    code: "ART",
    description: "Visual generation of sets, environments, and overall design concepts.",
    roles: [
      { 
        name: "Production Designer (PD)", 
        primaryUnion: "DGC", 
        departmentCode: "ART",
        description: "Responsible for visualization and generation of set design, sketches, rendering, location selection, and design concept relating to set dec, props, SFX, and lighting.",
      },
      { 
        name: "Art Director (ART)", 
        primaryUnion: "DGC", 
        departmentCode: "ART",
        description: "Co-ordinates the preparation and execution of all visual elements. Administrative and organizational heart of the Art Department.",
      },
      {
        name: "First Assistant Art Director (1AR)",
        primaryUnion: "DGC",
        departmentCode: "ART",
        description: "Includes Set/Graphic/Motion Designers. Responsible for conceptualization and creation of original on-screen featured elements.",
      },
      {
        name: "Second Assistant Art Director (2AR)",
        primaryUnion: "DGC",
        departmentCode: "ART",
        description: "Duties include drafting, floor-plans, measuring, surveying, photographing locations, and model making.",
      },
      {
        name: "Art Department Coordinator (ADC)",
        primaryUnion: "DGC",
        departmentCode: "ART",
        description: "Works closely with Art Director to assist with administration, procurement, and budget tracking.",
      },
      {
        name: "Trainee Assistant Art Director (TAAD)",
        primaryUnion: "DGC",
        departmentCode: "ART",
        description: "Learning position directly supervised by senior Members of the Art Department.",
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
      },
      { 
        name: "Assistant (1st/2nd)", 
        primaryUnion: "IATSE 667", 
        departmentCode: "CAM",
        description: "Responsible for camera maintenance, focus pulling, and technical assembly.",
      }
    ]
  },
  {
    name: "Picture Editing",
    code: "PEDIT",
    description: "Post-production assembly of visual assets to create the final narrative.",
    roles: [
      {
        name: "Picture Editor (PE)",
        primaryUnion: "DGC",
        departmentCode: "PEDIT",
        description: "Creative head who works closely with the Director in crafting the final story, rhythm, pace and tension.",
      },
      {
        name: "First Assistant Picture Editor (1PE)",
        primaryUnion: "DGC",
        departmentCode: "PEDIT",
        description: "In charge of day to day running of the edit room. Thorough understanding of Post Production process and technology.",
      },
      {
        name: "Assistant Picture Editor (APE)",
        primaryUnion: "DGC",
        departmentCode: "PEDIT",
        description: "Works under direction of 1PE, assisting with duties in the editing room.",
      },
      {
        name: "Trainee Assistant Picture Editor (TAPE)",
        primaryUnion: "DGC",
        departmentCode: "PEDIT",
        description: "Trainee position working under supervision of 1PE and/or APE.",
      }
    ]
  },
  {
    name: "Sound Editing",
    code: "SEDIT",
    description: "Post-production design and assembly of all auditory elements.",
    roles: [
      {
        name: "Sound Editor (SE)",
        primaryUnion: "DGC",
        departmentCode: "SEDIT",
        description: "Manages all Post Sound elements including dialogue, ADR, SFX and Foley. Responsible for synchronization and assembly.",
      },
      {
        name: "Music Editor (ME)",
        primaryUnion: "DGC",
        departmentCode: "SEDIT",
        description: "Responsible for preparation of music materials and the synchronization and assembly of music tracks.",
      },
      {
        name: "First Assistant Sound Editor (1SE)",
        primaryUnion: "DGC",
        departmentCode: "SEDIT",
        description: "Works in fast paced environment. Excellent knowledge of computer software and recording electronics.",
      },
      {
        name: "Trainee Assistant Sound Editor (TASE)",
        primaryUnion: "DGC",
        departmentCode: "SEDIT",
        description: "Training position assisting with the needs of the editing room.",
      }
    ]
  },
  {
    name: "Post Production",
    code: "POST",
    description: "Management of the finishing process after principal photography.",
    roles: [
      {
        name: "Post Production Supervisor (PPS)",
        primaryUnion: "DGC",
        departmentCode: "POST",
        description: "Administrative liaison between Editorial, Producers and PMs. Responsible for budgeting and scheduling Post Production.",
      },
      {
        name: "Post Production Coordinator (PPC)",
        primaryUnion: "DGC",
        departmentCode: "POST",
        description: "Assists Post Production Supervisors in any and all aspects of their duties.",
      },
      {
        name: "Post Production Assistant (PPPA)",
        primaryUnion: "DGC",
        departmentCode: "POST",
        description: "Assists with paperwork, shipping, filing, and running errands in the editing department.",
      }
    ]
  },
  {
    name: "Accounting Department",
    code: "ACC",
    description: "Financial management, payroll, and auditing for the production.",
    roles: [
      {
        name: "Production Accountant (AUD)",
        primaryUnion: "DGC",
        departmentCode: "ACC",
        description: "Responsible for coordination, supervision and operation of the Accounting Department. Requires high-level organizational abilities.",
      },
      {
        name: "1st Assistant Accountant (General)",
        primaryUnion: "DGC",
        departmentCode: "ACC",
        description: "Organizational and administrative abilities normally required in a Production Accounting office. Position is bondable.",
      },
      {
        name: "1st Assistant Accountant (Payroll)",
        primaryUnion: "DGC",
        departmentCode: "ACC",
        description: "Processes cast and crew payroll on a weekly basis. Strong understanding of collective agreements required.",
      },
      {
        name: "Second Assistant Accountant (2AA)",
        primaryUnion: "DGC",
        departmentCode: "ACC",
        description: "Responsibilities include data entry, preparation of accounts payable, invoices, petty cash, and payroll calculation.",
      },
      {
        name: "Third Assistant Accountant (3AA)",
        primaryUnion: "DGC",
        departmentCode: "ACC",
        description: "Completes data entry, processing of cheques, filing, and auditing petty cash envelopes.",
      },
      {
        name: "Trainee Assistant Accountant (TAA)",
        primaryUnion: "DGC",
        departmentCode: "ACC",
        description: "Works under direct supervision of senior Accounting staff. Bookkeeping familiarity required.",
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
        description: "Responsible for movement of assets and personnel across locations.",
      }
    ]
  }
];
