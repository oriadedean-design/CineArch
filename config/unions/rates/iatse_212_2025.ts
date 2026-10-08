// IATSE Local 212 — Collective Agreement for Motion Picture 2025, rate schedule.
// Transcribed as published: "2025 Rates – in effect April 1, 2025 to March 31, 2026".
// Columns: High Budget, Tier A, Tier B, Tier C. null = Negotiable.

export interface RateRow {
  title: string;
  rates: [number | null, number | null, number | null, number | null];
}

export interface RateSection {
  department: string;
  note?: string;
  rows: RateRow[];
}

export interface RateSchedule {
  unionId: string;
  title: string;
  effectiveFrom: string; // ISO date
  effectiveTo: string;
  columns: [string, string, string, string];
  sections: RateSection[];
}

const N = null;
const r = (title: string, hb: number | null, a: number | null, b: number | null, c: number | null): RateRow =>
  ({ title, rates: [hb, a, b, c] });

export const IATSE_212_RATES_2025: RateSchedule = {
  unionId: 'u-212',
  title: 'IATSE Local 212 — Collective Agreement for Motion Picture 2025',
  effectiveFrom: '2025-04-01',
  effectiveTo: '2026-03-31',
  columns: ['High Budget', 'Tier A', 'Tier B', 'Tier C'],
  sections: [
    { department: 'Accounting', rows: [
      r('Production Accountant', N, N, N, N),
      r('First Assistant Accountant', 3334.13, 3146.38, 3086.26, 2792.70),
      r('Second Assistant Accountant, Asset Manager', 2200.61, 2121.93, 2040.79, 1854.62),
      r('Accounting Clerk', 1829.33, 1745.17, 1661.30, 1568.20),
      r('Accounting Trainee', 1711.50, 1711.50, 1711.50, 1711.50),
      r('Specialty Accountant', N, N, N, N),
    ]},
    { department: 'Art', rows: [
      r('Production Designer', N, N, N, N),
      r('Supervising Art Director / HOD', N, N, N, N),
      r('Art Director', 4353.97, 4157.81, 3974.21, 3487.26),
      r('1st Assistant Art Director', 3553.50, 3450.50, 3244.50, 2925.00),
      r('Graphics Artist, Set Designer, Illustrator, Storyboard Artist', 46.28, 45.00, 42.55, 39.37),
      r('2nd Assistant Art Director', 42.96, 41.68, 38.66, 36.17),
      r('Art Department Coordinator', 40.90, 39.30, 36.66, 34.24),
      r('Art Department Trainee', 24.45, 24.45, 24.45, 24.45),
      r('Specialty Artist', N, N, N, N),
    ]},
    { department: 'Construction', rows: [
      r('Construction Coordinator', 49.82, 47.56, 47.56, 47.56),
      r('Construction Foreman, Head Carpenter', 47.12, 44.92, 44.92, 44.92),
      r('Assistant Construction Coordinator', 44.91, 42.85, 42.85, 42.85),
      r('Lead Carpenter, Lead Metal Fabricator', 44.91, 42.85, 42.85, 42.85),
      r('Scenic Carpenter, Buyer, On-Set Standby Carpenter', 41.66, 39.70, 39.70, 39.70),
      r('Scenic Metal Fabricator, Model Maker', 41.66, 39.70, 39.70, 39.70),
      r('Certified Equipment Operator', 41.30, 39.41, 39.41, 39.41),
      r('Carpenter, Maintenance Person', 39.41, 37.70, 37.70, 37.70),
      r('Metal Fabricator', 37.50, 35.72, 35.72, 35.72),
      r('Assistant Carpenter', 34.09, 32.48, 32.48, 32.48),
      r('Labourer', 32.78, 30.74, 30.74, 30.74),
      r('Specialty Construction', N, N, N, N),
    ]},
    { department: 'Costume', rows: [
      r('Costume Designer', N, N, N, N),
      r('Assistant Costume Designer, Set Supervisor, Costume Supervisor, Costume Coordinator, Background Coordinator', 45.65, 43.51, 41.02, 38.10),
      r('Cutter, Tailor, Key Breakdown', 42.11, 40.66, 38.75, 36.29),
      r('Truck Costumer, First Hand, Performer’s Costumer, Buyer, Costume Craftsperson, Dyer, Background Supervisor, Milliner, Breakdown Artist, Senior Stitcher', 40.97, 39.30, 36.66, 34.24),
      r('Stitcher', 38.99, 37.15, 35.18, 32.58),
      r('Costumer', 36.82, 35.13, 34.02, 31.64),
      r('Specialty Costumer', N, N, N, N),
    ]},
    { department: 'Craft Services', rows: [
      r('Head of Craft Service', 47.12, 44.92, 42.06, 38.52),
      r('First Assistant Craft Service', 41.30, 39.41, 37.09, 34.51),
      r('Craft Service Assistant', 37.94, 36.16, 34.24, 31.71),
      r('Specialty Craft Service', N, N, N, N),
    ]},
    { department: 'Editors', note: 'Based on 10-hour days.', rows: [
      r('Supervising Editor', 4440.53, 4397.42, 4254.65, 3825.95),
      r('Supervising Sound Editor', 4440.53, 4397.42, 4254.65, 3825.95),
      r('Editor', 4031.39, 3992.25, 3873.73, 3482.48),
      r('Sound Effects Editor, Music Editor, Dialogue Editor', 68.78, 68.11, 65.58, 51.27),
      r('Negative Cutter, Conformer', N, N, N, N),
      r('First Assistant Editor', 2328.31, 2305.70, 2220.94, 2001.43),
      r('Assistant Dialogue Editor, Assistant Sound Effects Editor', 2328.31, 2305.70, 2220.94, 2001.43),
      r('Second Assistant Editor', 2025.29, 2005.62, 1934.29, 1741.90),
      r('Specialty Editor', N, N, N, N),
    ]},
    { department: 'First Aid', rows: [
      r('First Aid HOD / Coordinator', 47.12, 47.12, 47.12, 47.12),
      r('Advanced Care Paramedic (ACP)', 54.18, 54.18, 54.18, 54.18),
      r('Primary Care Paramedic (PCP)', 47.40, 47.40, 47.40, 47.40),
      r('Emergency Medical Responder (EMR)', 41.64, 41.64, 41.64, 41.64),
      r('Advanced First Aid Attendant', 40.10, 40.10, 40.10, 40.10),
      r('Specialty Practitioner', N, N, N, N),
    ]},
    { department: 'Greens', rows: [
      r('Head Greens Person', 47.12, 44.92, 42.06, 38.52),
      r('Best Person', 42.19, 40.23, 38.01, 35.53),
      r('Lead Person, On-Set Greens, Buyer', 41.30, 39.41, 37.09, 34.51),
      r('Certified Equipment Operator', 41.30, 39.41, 37.09, 34.51),
      r('Greens Person', 37.94, 36.16, 34.24, 31.71),
      r('Labourer', 32.78, 30.74, 28.96, 28.08),
      r('Specialty Greens', N, N, N, N),
    ]},
    { department: 'Grips', rows: [
      r('Key Grip', 47.12, 44.92, 42.06, 38.52),
      r('Key Rigging Grip', 43.49, 41.07, 38.94, 36.50),
      r('Gimbal Operator (e.g. MOVI, Ronin)', 61.12, 58.39, 55.34, 51.19),
      r('Best Person, Dolly Operator', 42.19, 40.23, 38.01, 35.53),
      r('Lead, Certified Equipment Operator', 41.30, 39.41, 37.09, 34.51),
      r('Grip Crew', 37.94, 36.16, 34.24, 31.71),
      r('Special Equipment Operator', N, N, N, N),
      r('Specialty Grip', N, N, N, N),
    ]},
    { department: 'Hair', rows: [
      r('Head of Department', 47.12, 44.92, 42.06, 38.52),
      r('Assistant Head of Department', 47.12, 44.92, 42.06, 38.52),
      r('Key Hairstylist', 41.30, 39.41, 37.09, 34.51),
      r('Hairstylist', 37.94, 36.16, 34.24, 31.71),
      r('Special Skills Hairstylist', 40.97, 39.28, 36.66, 34.24),
      r('Specialty Hairstylist', N, N, N, N),
    ]},
    { department: 'High Rigger', rows: [
      r('High Rigger', 45.71, 44.10, 42.06, 38.52),
      r('Specialty High Rigger', N, N, N, N),
    ]},
    { department: 'Lighting / Electrics', rows: [
      r('Chief Lighting Technician / Gaffer', 47.12, 44.92, 42.06, 38.52),
      r('Rigging Gaffer', 43.49, 41.07, 38.94, 36.50),
      r('Best Person', 42.19, 40.23, 38.01, 35.53),
      r('Generator Operator, Lighting Console Operator, Lead', 41.30, 39.41, 37.09, 34.51),
      r('Set Wireperson, Certified Equipment Operator', 41.30, 39.41, 37.09, 34.51),
      r('Lighting Technician / Lamp Operator, Rigging Lamp Operator', 37.94, 36.16, 34.24, 31.71),
      r('Lighting Programmer, Special Equipment Operator', N, N, N, N),
      r('Specialty Lighting Technician', N, N, N, N),
    ]},
    { department: 'Makeup', rows: [
      r('Department Head Makeup Artist', 47.12, 44.92, 42.06, 38.52),
      r('Assistant Department Head Makeup Artist', 47.12, 44.92, 42.06, 38.52),
      r('Prosthetic Makeup Artist', 47.12, 44.92, 42.06, 38.52),
      r('Key Makeup Artist', 41.30, 39.41, 37.09, 34.51),
      r('Makeup Artist', 37.94, 36.16, 34.24, 31.71),
      r('Key Animal Painter', 47.12, 44.92, 42.06, 38.52),
      r('Assistant Animal Painter', 40.97, 39.30, 36.66, 34.24),
      r('Specialty Makeup Artist', N, N, N, N),
    ]},
    { department: 'Painting', rows: [
      r('Paint Coordinator', 49.82, 47.56, 47.56, 47.56),
      r('Paint Foreman', 47.12, 44.92, 44.92, 44.92),
      r('Scenic Artist, Lead Painter, Sign Painter', 44.91, 42.85, 42.85, 42.85),
      r('Scenic Painter, On-Set Standby Painter', 41.66, 39.70, 39.70, 39.70),
      r('Plasterer, Wallpaper Hanger', 41.66, 39.70, 39.70, 39.70),
      r('Certified Equipment Operator', 41.30, 39.41, 39.41, 39.41),
      r('Painter', 39.41, 37.69, 37.69, 37.69),
      r('Labourer', 32.78, 30.74, 30.74, 30.74),
      r('Specialty Paint', N, N, N, N),
    ]},
    { department: 'Props', rows: [
      r('Property Master', 47.12, 44.92, 42.06, 38.52),
      r('Assistant Property Master', 43.49, 41.07, 38.94, 36.50),
      r('Props Buyer, Props Builder', 41.30, 39.41, 37.09, 34.51),
      r('Props Coordinator', 41.30, 39.41, 37.09, 34.51),
      r('Armourer', N, N, N, N),
      r('Props Assistant', 37.94, 36.16, 34.24, 31.71),
      r('2nd Props Assistant', 33.30, 31.26, 29.48, 28.60),
      r('Specialty Props', N, N, N, N),
    ]},
    { department: 'Script Coordinators', rows: [
      r('Script Coordinator', 2160.58, 2119.79, 2057.66, 1877.35),
      r('Assistant Script Coordinator', 1728.06, 1695.44, 1645.76, 1501.54),
      r('Specialty Script Coordinator', N, N, N, N),
    ]},
    { department: 'Script Supervisors', rows: [
      r('Script Supervisor', 48.47, 47.56, 46.17, 42.12),
      r('Assistant Script Supervisor', 38.68, 36.90, 35.45, 32.08),
      r('Specialty Script Supervisor', N, N, N, N),
    ]},
    { department: 'Sculpting', rows: [
      r('Sculpting Coordinator', N, N, N, N),
      r('Lead Sculptor, Sculptor Foreman', 47.12, 44.92, 44.92, 44.92),
      r('Sculptor', 41.66, 39.70, 39.70, 39.70),
      r('Assistant Sculptor', 39.41, 37.69, 37.69, 37.69),
      r('Specialty Sculptor', N, N, N, N),
    ]},
    { department: 'Security / Watchman', rows: [
      r('Security Coordinator', 47.12, 44.92, 42.06, 38.52),
      r('Security Captain (when necessary)', 41.30, 39.41, 37.09, 34.51),
      r('Security Watchperson', 32.78, 30.74, 28.96, 28.08),
      r('Specialty Security', N, N, N, N),
    ]},
    { department: 'Set Decorating', rows: [
      r('Set Decorator', N, N, N, N),
      r('Assistant Set Decorator', 3044.30, 2874.87, 2725.63, 2555.28),
      r('Set Decorator Coordinator, On-Set Dresser, Lead Dresser', 41.30, 39.41, 37.09, 34.51),
      r('Set Buyer, Warehouse Supervisor, Certified Equipment Operator', 41.30, 39.41, 37.09, 34.51),
      r('Set Dresser, Draper, Upholsterer', 37.93, 36.16, 34.24, 31.71),
      r('Labourer', 32.78, 30.74, 28.96, 28.08),
      r('Specialty Set Decorating', N, N, N, N),
    ]},
    { department: 'Sound', rows: [
      r('Mixer (Production & Dubbing)', 60.28, 57.42, 54.28, 47.12),
      r('Boom Operator', 50.58, 48.26, 45.46, 40.15),
      r('Utility Sound Technician', 38.68, 36.90, 35.45, 32.08),
      r('Specialty Sound', N, N, N, N),
    ]},
    { department: 'Special Effects', rows: [
      r('Special Effects Coordinator', 52.10, 49.57, 46.65, 42.85),
      r('Special Effects Supervisor', 52.10, 49.57, 46.65, 42.85),
      r('First Assistant Special Effects', 47.40, 45.23, 42.12, 36.87),
      r('Second Assistant Special Effects', 41.70, 40.21, 40.06, 34.90),
      r('Special Effects Fabricator, Buyer', 41.70, 40.21, 40.06, 34.90),
      r('Specialty Special Effects', N, N, N, N),
    ]},
    { department: 'Trainee (All Departments)', note: 'May not be hired without prior approval from the Union.', rows: [
      r('Trainee', 24.45, 24.45, 24.45, 24.45),
    ]},
    { department: 'Tutors', rows: [
      r('Tutor', 64.16, 64.16, 64.16, 64.16),
      r('Interpreters / Translators', N, N, N, N),
      r('Specialty Tutor', N, N, N, N),
    ]},
    { department: 'Visual Effects / CGI', rows: [
      r('Visual Effects Supervisor', N, N, N, N),
      r('Visual Effects Assistant', N, N, N, N),
      r('CGI Supervisor', N, N, N, N),
      r('Animator, Modeler', N, N, N, N),
      r('Specialty Visual Effects', N, N, N, N),
    ]},
  ],
};

export const RATE_SCHEDULES: Record<string, RateSchedule> = {
  'u-212': IATSE_212_RATES_2025,
};
