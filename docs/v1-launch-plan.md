# V1 launch plan

This plan turns the finance/union specification into concrete decisions and tasks for the first production-ready release of CineArch.

## 1. Launch cohort and scope
- **Coverage strategy:** prioritize by city for early-career use cases, starting with Toronto and Vancouver so performers, tech, transport, and writers are represented.
- **Wave 1 (launch):** ACTRA Toronto, UBCP/ACTRA (BC), DGC Ontario, IATSE 873 (Toronto technicians), NABET 700-M UNIFOR (Toronto), Teamsters 155 (BC), WGC (national).
- **Wave 2 (next quarter):** IATSE 891, IATSE 669, ACFC West, Teamsters 362, DGC BC, DGC Manitoba MAP, NABET/ACFC alternates in other regions.
- **Wave 3 (backlog):** Remaining IATSE locals (212, 210, 295, 856, 667, 411, 634, 849), Teamsters 879, AQTIS 514, additional regional variants.
- **Action:** document “done” criteria per wave (rule coverage, dues, eligibility flows tested) and add Jira tickets per union/local.

## 2. Data entry and maintenance
- **Owner:** assign a single rule steward (producer/coord) responsible for union and tax data quality.
- **Method:** use a single live copy with `last_verified_at` and `last_verified_by`; update in place and track sources/URLs per program.
- **QA:** require a second reviewer for changes to eligibility thresholds or dues; keep a simple change log (date, change summary, reviewer) in Firestore or versioned JSON.
- **Cadence:** Wave 1 unions reviewed every 6 months; others annually until usage dictates shorter cycles.
- **Action:** create an internal sheet mirroring the DB schema for ingestion; backfill Wave 1 rules with sources and verification dates.

## 3. Work history model (data contract)
Capture consistent inputs for the eligibility engine and finance features:

```ts
interface WorkRecord {
  user_id: string;
  project_name: string;
  project_type: 'series' | 'feature' | 'commercial' | 'short' | 'other';
  union_id: string; // ACTRA, DGC, IATSE, etc.
  union_local_id?: string; // e.g., IATSE_873
  role: string; // Background, Principal, 2nd AD, Grip, etc.
  department?: string; // Camera, Lighting, Transport, etc.
  date: string; // ISO date for single day
  days: number; // or hours if applicable
  paid: boolean;
  signatory_status: 'union' | 'non_union';
  location: { city?: string; province: string };
  evidence_url?: string; // voucher or call sheet screenshot
}
```

- **Action:** add this shape to the shared types module and align ingestion forms; enforce via schema validation (e.g., Zod) before writes.

## 4. Logic game / roadmap UX
- **Tone:** professional and clear; minimal gamification.
- **Phase 1 placement:** dedicated "Union Roadmap" tab with cards per union showing status chips (eligible/percent complete/closed) and a progress bar.
- **Phase 2 placement:** onboarding prompt plus contextual nudges in finance views (e.g., "5 days away from AABP").
- **UI elements:** progress by requirement group, missing items checklist, timeline projection based on recent pace, and "next best action" cards.
- **Action:** design a reusable wizard component that renders questions from Requirement definitions and consumes the eligibility engine output.

## 5. Tax feature MVP
- **Scope:** ship checklist plus numeric estimates for CPP and GST/HST; defer detailed income tax brackets until CPA-reviewed.
- **Inputs:** business profile (type, province, revenue band, GST/HST registration, employees, unions).
- **Outputs:** obligations list with CRA links, CPP estimate, GST/HST collection/remittance estimate; payroll obligations flagged when `has_employees` is true.
- **Action:** seed TaxRule data for federal + ON/BC; build evaluator to generate the checklist and estimates; gate advanced items by plan.

## 6. Disclaimers and compliance
- **Language:** "CineArch provides educational information about taxes and union requirements. It is not tax, legal, or accounting advice. Rules change; confirm details with unions and the Canada Revenue Agency. CineArch does not file taxes or submit applications on your behalf."
- **Placement:** onboarding consent, footer of finance/union pages, and any modal showing eligibility or tax estimates.
- **Action:** add reusable disclaimer components and require their presence in wizard/estimate views before release.

## 7. Plan gating
- **Free:** business profile, basic tax checklist (obligations only), high-level union overview cards.
- **Pro:** CPP/GST-HST estimates, full Union Roadmap wizards, dues projections, work history storage/analysis.
- **Agency:** all Pro features plus multi-member dashboards and roster-level projections/reporting.
- **Action:** register features (`tax_checklist`, `cpp_gst_estimates`, `union_wizard`, `union_dues_projection`, `agency_roster`) with `min_plan` and add upgrade prompts where gated.

## 8. Onboarding and pricing alignment
- **Intake questions:** province, primary role (performer/director/AD/tech/transport/writer), experience band, target unions if known.
- **Personalization:** map responses to Wave 1 unions (Toronto -> ACTRA/DGC/IATSE/NABET/WGC; Vancouver -> UBCP/Teamsters 155, later 891/669/ACFC). Surface relevant cards immediately after signup.
- **Pricing promises:** ensure the pricing page mirrors delivered features (e.g., Pro includes Union Roadmaps + CPP/GST/HST estimators; Free offers obligation awareness).
- **Action:** update onboarding flow to store intake answers in the business profile and drive dashboard card ordering; sync pricing copy with gated features.

## 9. QA and preview
- **Local preview:** `npm run dev` with Firebase config and seeded fixtures for Wave 1 unions + sample work history.
- **Review apps:** per-branch preview with disposable Firebase projects to validate rules and gating.
- **Release gate:** go/no-go checklist covering rule seeds, disclaimers present, gating verified, and emulator tests for eligibility/tax evaluators.
- **Action:** create fixture data and a short test script for PM/QA to validate eligibility paths and tax checklists before launch.
