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
        description: "A Director is the driving force in the dramatic and artistic aspects of an audiovisual work. The Director visualizes and defines the style and structure of the script.",
      },
      { 
        name: "1st Assistant Director", 
        primaryUnion: "DGC", 
        departmentCode: "DIR",
        description: "Responsible for breaking down all elements presented in a script and maintaining the shooting schedule.",
      }
    ]
  },
  {
    name: "Script & Continuity",
    code: "SCR",
    description: "Ensuring narrative and visual consistency throughout the filming process.",
    roles: [
      { 
        name: "Script Supervisor", 
        primaryUnion: "DGC / IATSE 873", 
        departmentCode: "SCR",
        description: "The guardian of continuity, timing, and editing notes for the production. Tracks narrative logic across takes.",
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
        description: "Oversees general operations and implementation of the production budget.",
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
        description: "Creates daily call sheets and prep documentation, ensuring all required elements are reflected.",
      },
      {
        name: "Set PA (PA)",
        primaryUnion: "DGC",
        departmentCode: "AD",
        description: "Assigned any and all necessary tasks by the senior ADs. Entry level position.",
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
        description: "Responsible for finding filming locations, securing contracts, and operational needs.",
      },
      {
        name: "Location Production Assistant (LPA)",
        primaryUnion: "DGC",
        departmentCode: "LOC",
        description: "Works on set to ensure permits are respected and that the location remains clean.",
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
        description: "Creative head responsible for visualization and generation of set design and overall concept.",
      },
      { 
        name: "Art Director (ART)", 
        primaryUnion: "DGC", 
        departmentCode: "ART",
        description: "Coordinates the preparation and execution of all visual elements in the Art Department.",
      }
    ]
  },
  {
    name: "Set Decoration",
    code: "DEC",
    description: "Dressing and detailing sets with furniture, decor, and textures.",
    roles: [
      {
        name: "Set Decorator",
        primaryUnion: "IATSE 873",
        departmentCode: "DEC",
        description: "Creative lead responsible for the decor and interior/exterior dressing of all sets.",
      },
      {
        name: "Assistant Set Decorator",
        primaryUnion: "IATSE 873",
        departmentCode: "DEC",
        description: "Coordinates procurement and placement of decor elements as per the vision.",
      },
      {
        name: "Buyer",
        primaryUnion: "IATSE 873",
        departmentCode: "DEC",
        description: "Responsible for sourcing, purchasing, and renting furniture and decor items.",
      },
      {
        name: "Lead Dresser",
        primaryUnion: "IATSE 873",
        departmentCode: "DEC",
        description: "Manages the set dressing crew in the physical layout and installation of decor.",
      },
      {
        name: "Set Dresser",
        primaryUnion: "IATSE 873",
        departmentCode: "DEC",
        description: "Executes the physical dressing and arrangement of furniture on set.",
      },
      {
        name: "On-Set Dresser",
        primaryUnion: "IATSE 873",
        departmentCode: "DEC",
        description: "Maintains the decor during filming and handles continuity of dressing elements.",
      }
    ]
  },
  {
    name: "Costume Department",
    code: "COST",
    description: "Design, procurement, and maintenance of all on-screen character apparel.",
    roles: [
      {
        name: "Costume Designer",
        primaryUnion: "DGC",
        departmentCode: "COST",
        description: "Creative visionary for the look of all characters' wardrobe and accessories.",
      },
      {
        name: "Assistant Costume Designer",
        primaryUnion: "DGC / IATSE 873",
        departmentCode: "COST",
        description: "Supports the Designer in sourcing, research, and department logistics.",
      },
      {
        name: "Wardrobe Coordinator",
        primaryUnion: "IATSE 873",
        departmentCode: "COST",
        description: "Administrative lead for the department, managing budget and inventory.",
      },
      {
        name: "Key Wardrobe",
        primaryUnion: "IATSE 873",
        departmentCode: "COST",
        description: "Supervises the on-set wardrobe crew and character wardrobe continuity.",
      },
      {
        name: "Truck Supervisor",
        primaryUnion: "IATSE 873",
        departmentCode: "COST",
        description: "Responsible for the organization and maintenance of the wardrobe trailer.",
      },
      {
        name: "Cutter",
        primaryUnion: "IATSE 873",
        departmentCode: "COST",
        description: "Highly skilled technician responsible for pattern making and structural construction.",
      },
      {
        name: "Sewer",
        primaryUnion: "IATSE 873",
        departmentCode: "COST",
        description: "Responsible for garment construction, alterations, and maintenance.",
      },
      {
        name: "Dresser",
        primaryUnion: "IATSE 873",
        departmentCode: "COST",
        description: "Assists cast members with costume changes and maintains character continuity.",
      }
    ]
  },
  {
    name: "Hair & Makeup",
    code: "HMU",
    description: "Personnel aesthetics, character design, and prosthetic applications.",
    roles: [
      {
        name: "Key Makeup Artist",
        primaryUnion: "IATSE 873",
        departmentCode: "HMU",
        description: "Department head for makeup, supervising artists and defining character looks.",
      },
      {
        name: "Assistant Makeup",
        primaryUnion: "IATSE 873",
        departmentCode: "HMU",
        description: "Applies makeup to cast and background under the direction of the Key.",
      },
      {
        name: "Key Hair",
        primaryUnion: "IATSE 873",
        departmentCode: "HMU",
        description: "Department head for hair, supervising stylists and character hair design.",
      },
      {
        name: "Assistant Hair",
        primaryUnion: "IATSE 873",
        departmentCode: "HMU",
        description: "Executes hair styling for cast and background as per the department vision.",
      },
      {
        name: "Prosthetics Artist",
        primaryUnion: "IATSE 873",
        departmentCode: "HMU",
        description: "Specialized artist for the application and maintenance of prosthetic effects.",
      }
    ]
  },
  {
    name: "Camera Department",
    code: "CAM",
    description: "Optics, lighting, and visual capture technical crew.",
    roles: [
      { 
        name: "Director of Photography (DOP)", 
        primaryUnion: "IATSE 667", 
        departmentCode: "CAM",
        description: "Chief of camera and lighting, responsible for the cinematic look.",
      },
      { 
        name: "Assistant Camera (1st/2nd)", 
        primaryUnion: "IATSE 667", 
        departmentCode: "CAM",
        description: "Responsible for camera maintenance, focus pulling, and technical assembly.",
      }
    ]
  },
  {
    name: "Grip",
    code: "GRP",
    description: "Support equipment, camera movement, and lighting modification.",
    roles: [
      {
        name: "Key Grip",
        primaryUnion: "IATSE 873",
        departmentCode: "GRP",
        description: "Supervises the grip crew and manages all support and movement equipment.",
      },
      {
        name: "Best Boy Grip",
        primaryUnion: "IATSE 873",
        departmentCode: "GRP",
        description: "Administrative lead for the grip department, managing equipment and personnel.",
      },
      {
        name: "Dolly Grip",
        primaryUnion: "IATSE 873",
        departmentCode: "GRP",
        description: "Specialized grip responsible for the operation and maintenance of the camera dolly.",
      },
      {
        name: "Grip",
        primaryUnion: "IATSE 873",
        departmentCode: "GRP",
        description: "Technician responsible for rigging support equipment and light modification.",
      }
    ]
  },
  {
    name: "Lighting/Electric",
    code: "ELE",
    description: "Electrical distribution and lighting equipment management.",
    roles: [
      { 
        name: "Gaffer", 
        primaryUnion: "IATSE 873", 
        departmentCode: "ELE",
        description: "Chief of the electrical department, executing the DOP's lighting plan.",
      },
      {
        name: "Best Boy Electric",
        primaryUnion: "IATSE 873",
        departmentCode: "ELE",
        description: "Manages electrical equipment inventory and coordinates the electric crew.",
      },
      {
        name: "Generator Operator",
        primaryUnion: "IATSE 873",
        departmentCode: "ELE",
        description: "Responsible for the operation and safety of the production power generators.",
      },
      {
        name: "Lamp Operator",
        primaryUnion: "IATSE 873",
        departmentCode: "ELE",
        description: "Technician responsible for the physical placement and operation of lighting fixtures.",
      }
    ]
  },
  {
    name: "Construction & Paint",
    code: "CONST",
    description: "The physical fabrication and scenic finishing of sets and props.",
    roles: [
      {
        name: "Construction Coordinator",
        primaryUnion: "IATSE 873",
        departmentCode: "CONST",
        description: "Manages the set construction budget, logistics, and personnel.",
      },
      {
        name: "Head Carpenter",
        primaryUnion: "IATSE 873",
        departmentCode: "CONST",
        description: "Supervises the woodworking crew in set fabrication and assembly.",
      },
      {
        name: "Carpenter",
        primaryUnion: "IATSE 873",
        departmentCode: "CONST",
        description: "Fabricates sets and structural elements using wood and specialized materials.",
      },
      {
        name: "Key Scenic Artist",
        primaryUnion: "IATSE 873",
        departmentCode: "CONST",
        description: "Supervises the scenic painting crew and defines set finishing textures.",
      },
      {
        name: "Scenic Painter",
        primaryUnion: "IATSE 873",
        departmentCode: "CONST",
        description: "Applies specialized finishes and textures to sets to create realism.",
      },
      {
        name: "Painter",
        primaryUnion: "IATSE 873",
        departmentCode: "CONST",
        description: "Responsible for general set painting and finishing applications.",
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
        description: "Creative head who works closely with the Director in crafting the final story.",
      },
      {
        name: "Assistant Picture Editor",
        primaryUnion: "DGC",
        departmentCode: "PEDIT",
        description: "Works in the editing room, assisting with daily technical assemblies and organization.",
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
        description: "Manages Post Sound elements including dialogue, ADR, SFX and Foley.",
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
        description: "Administrative liaison between Editorial and Producers.",
      },
      {
        name: "Post Production Coordinator (PPC)",
        primaryUnion: "DGC",
        departmentCode: "POST",
        description: "Assists Post Production Supervisors in all aspects of their duties.",
      }
    ]
  },
  {
    name: "Accounting Department",
    code: "ACC",
    description: "Financial management, payroll, and auditing for the production.",
    roles: [
      {
        name: "Production Accountant",
        primaryUnion: "DGC",
        departmentCode: "ACC",
        description: "Responsible for coordination, supervision and operation of the Accounting Department.",
      },
      {
        name: "Assistant Accountant",
        primaryUnion: "DGC",
        departmentCode: "ACC",
        description: "Responsibilities include data entry, preparation of accounts payable, and payroll.",
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
