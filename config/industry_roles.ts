
export interface IndustryRole {
  name: string;
  primaryUnion: string;
}

export interface IndustryDepartment {
  name: string;
  roles: IndustryRole[];
}

export const INDUSTRY_DEPARTMENTS: IndustryDepartment[] = [
  {
    name: "Executive / Employer",
    roles: [
      { name: "Producer", primaryUnion: "CMPA" },
      { name: "Executive Producer", primaryUnion: "CMPA" },
      { name: "Line Producer", primaryUnion: "CMPA" }
    ]
  },
  {
    name: "Directing",
    roles: [
      { name: "Director", primaryUnion: "DGC" },
      { name: "2nd Unit Director", primaryUnion: "DGC" }
    ]
  },
  {
    name: "Direction (Set)",
    roles: [
      { name: "1st AD", primaryUnion: "DGC" },
      { name: "2nd AD", primaryUnion: "DGC" },
      { name: "3rd AD", primaryUnion: "DGC" },
      { name: "Set PA", primaryUnion: "DGC" }
    ]
  },
  {
    name: "Writing (WGC)",
    roles: [
      { name: "Screenwriter", primaryUnion: "WGC" },
      { name: "Story Editor", primaryUnion: "WGC" },
      { name: "Executive Story Editor", primaryUnion: "WGC" },
      { name: "Head Writer", primaryUnion: "WGC" },
      { name: "Dialogue Writer", primaryUnion: "WGC" }
    ]
  },
  {
    name: "Production Office",
    roles: [
      { name: "Production Manager (PM)", primaryUnion: "DGC" },
      { name: "Unit Manager", primaryUnion: "DGC" },
      { name: "Production Accountant", primaryUnion: "DGC" },
      { name: "Production Coordinator", primaryUnion: "IATSE (411/891)" },
      { name: "Assistant Coordinator", primaryUnion: "IATSE (411/891)" },
      { name: "Office PA", primaryUnion: "IATSE (411/891)" }
    ]
  },
  {
    name: "Performers",
    roles: [
      { name: "Principal Actor", primaryUnion: "ACTRA / UDA" },
      { name: "Voice Artist", primaryUnion: "ACTRA / UDA" },
      { name: "Singer", primaryUnion: "ACTRA / UDA" },
      { name: "Dancer", primaryUnion: "ACTRA / UDA" }
    ]
  },
  {
    name: "Background",
    roles: [
      { name: "Background Performer", primaryUnion: "ACTRA" },
      { name: "Stand-In", primaryUnion: "ACTRA" }
    ]
  },
  {
    name: "Stunts",
    roles: [
      { name: "Stunt Coordinator", primaryUnion: "ACTRA" },
      { name: "Stunt Performer", primaryUnion: "ACTRA" },
      { name: "Stunt Double", primaryUnion: "ACTRA" }
    ]
  },
  {
    name: "Camera",
    roles: [
      { name: "Director of Photography", primaryUnion: "IATSE (667/669)" },
      { name: "Camera Operator", primaryUnion: "IATSE (667/669)" },
      { name: "1st AC", primaryUnion: "IATSE (667/669)" },
      { name: "2nd AC", primaryUnion: "IATSE (667/669)" },
      { name: "DIT", primaryUnion: "IATSE (667/669)" },
      { name: "Loader", primaryUnion: "IATSE (667/669)" }
    ]
  },
  {
    name: "Publicity",
    roles: [
      { name: "Unit Publicist", primaryUnion: "IATSE (667/669)" },
      { name: "Still Photographer", primaryUnion: "IATSE (667/669)" }
    ]
  },
  {
    name: "Lighting",
    roles: [
      { name: "Gaffer", primaryUnion: "IATSE" },
      { name: "Best Boy Electric", primaryUnion: "IATSE" },
      { name: "Genny Operator", primaryUnion: "IATSE" },
      { name: "Lamp Operator", primaryUnion: "IATSE" }
    ]
  },
  {
    name: "Grip",
    roles: [
      { name: "Key Grip", primaryUnion: "IATSE" },
      { name: "Best Boy Grip", primaryUnion: "IATSE" },
      { name: "Dolly Grip", primaryUnion: "IATSE" },
      { name: "Rigging Grip", primaryUnion: "IATSE" }
    ]
  },
  {
    name: "Sound (On-Set)",
    roles: [
      { name: "Sound Mixer", primaryUnion: "IATSE" },
      { name: "Boom Operator", primaryUnion: "IATSE" },
      { name: "Sound Utility", primaryUnion: "IATSE" }
    ]
  },
  {
    name: "Art Department",
    roles: [
      { name: "Production Designer", primaryUnion: "DGC" },
      { name: "Art Director", primaryUnion: "DGC" },
      { name: "Set Designer", primaryUnion: "DGC" }
    ]
  },
  {
    name: "Set Decoration",
    roles: [
      { name: "Set Decorator", primaryUnion: "IATSE" },
      { name: "Leadman", primaryUnion: "IATSE" },
      { name: "Set Dresser", primaryUnion: "IATSE" },
      { name: "Buyer", primaryUnion: "IATSE" }
    ]
  },
  {
    name: "Props",
    roles: [
      { name: "Property Master", primaryUnion: "IATSE" },
      { name: "Assistant Props", primaryUnion: "IATSE" },
      { name: "Greensperson", primaryUnion: "IATSE" }
    ]
  },
  {
    name: "Construction",
    roles: [
      { name: "Construction Coordinator", primaryUnion: "IATSE" },
      { name: "Head Carpenter", primaryUnion: "IATSE" },
      { name: "Scenic Painter", primaryUnion: "IATSE" }
    ]
  },
  {
    name: "Costume",
    roles: [
      { name: "Costume Designer", primaryUnion: "IATSE" },
      { name: "Costume Supervisor", primaryUnion: "IATSE" },
      { name: "Set Costumer", primaryUnion: "IATSE" },
      { name: "Truck Operator", primaryUnion: "IATSE" }
    ]
  },
  {
    name: "Hair & Makeup",
    roles: [
      { name: "Department Head", primaryUnion: "IATSE" },
      { name: "Key Artist", primaryUnion: "IATSE" },
      { name: "SFX Makeup", primaryUnion: "IATSE" }
    ]
  },
  {
    name: "Locations",
    roles: [
      { name: "Location Manager", primaryUnion: "DGC" },
      { name: "ALM", primaryUnion: "DGC" },
      { name: "Scout", primaryUnion: "DGC" },
      { name: "LPA", primaryUnion: "DGC" }
    ]
  },
  {
    name: "Transportation",
    roles: [
      { name: "Transportation Coordinator", primaryUnion: "Teamsters (155/419)" },
      { name: "Captain", primaryUnion: "Teamsters (155/419)" },
      { name: "Driver", primaryUnion: "Teamsters (155/419)" },
      { name: "Honeywagon Driver", primaryUnion: "Teamsters (155/419)" }
    ]
  },
  {
    name: "Craft / Catering",
    roles: [
      { name: "Chef", primaryUnion: "Teamsters" },
      { name: "Craft Service", primaryUnion: "IATSE (411) / Teamsters" }
    ]
  },
  {
    name: "Post-Production",
    roles: [
      { name: "Editor", primaryUnion: "DGC" },
      { name: "Assistant Editor", primaryUnion: "DGC" },
      { name: "Post Supervisor", primaryUnion: "DGC" }
    ]
  },
  {
    name: "Post-Sound",
    roles: [
      { name: "Sound Editor", primaryUnion: "DGC" },
      { name: "Re-Recording Mixer", primaryUnion: "DGC" },
      { name: "Foley Artist", primaryUnion: "DGC" }
    ]
  },
  {
    name: "Special Effects",
    roles: [
      { name: "SFX Supervisor", primaryUnion: "IATSE" },
      { name: "SFX Tech", primaryUnion: "IATSE" },
      { name: "Pyrotechnician", primaryUnion: "IATSE" }
    ]
  },
  {
    name: "Health & Safety",
    roles: [
      { name: "Set Medic", primaryUnion: "IATSE / Non-Union" },
      { name: "Safety Officer", primaryUnion: "IATSE / Non-Union" },
      { name: "COVID Compliance", primaryUnion: "IATSE / Non-Union" }
    ]
  }
];
