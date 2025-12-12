# CineArch product specification (finance + union logic)

## Product goal
CineArch should ship with two pillars from day one: a finance platform that applies the right Canadian tax logic for crew (sole proprietors and incorporated businesses), and a union intelligence engine that understands entry paths, permit rules, and membership requirements for the major Canadian film unions. Both rule sets must be data-driven (not hard-coded) and extensible so new unions or updated tax guidance can be added without rewriting core logic. Features must be gated by plan and clearly indicate when an upgrade is required.

## Tax logic engine
### Business profile model
Capture the inputs a tax obligation engine needs:
- `business_type`: `sole_proprietor` | `corporation`
- `province_or_territory`: codes like `ON`, `BC`, `MB`
- `has_employees`: boolean
- `union_memberships`: list of union/local/program identifiers (e.g., `ACTRA_Toronto_AABP`, `IATSE_873_Permittee`)
- `annual_revenue_estimate`
- `is_gst_hst_registered`: boolean

### Tax rule model
Represent CRA obligations as data so they can be maintained without code edits:
- `id`
- `business_type`: `sole_proprietor` | `corporation` | `both`
- `jurisdiction_level`: `federal` | `provincial` | `municipal`
- `jurisdiction_code`: `CA`, `CA-ON`, `CA-BC`, etc.
- `name`: e.g., `Personal Income Tax on Business Income`, `CPP on Self Employment`, `Corporate Income Tax`, `GST_HST_Registration`, `Payroll Deductions`
- `applies_if`: JSON condition such as `revenue > 30000`, `has_employees = true`, `business_type = sole_proprietor`
- `calculation_type`: `checklist_only` | `percentage_of_base` | `bracketed_rate` | `external_reference`
- `base_amount_definition`: e.g., `net_self_employment_income`, `corporate_taxable_income`, `gross_payroll`, `taxable_supplies`
- `effective_from`, `effective_to`

### Evaluation flow
1. Read the user’s Business Profile.
2. Evaluate all `TaxRule.applies_if` conditions.
3. Produce a checklist of obligations plus estimated amounts where a `calculation_type` is defined.
4. Use official CRA links for references; do not file taxes for the user.

### Initial coverage expectations
- Sole proprietors: personal income tax on business profit (T1/T2125), CPP on self-employment income, GST/HST registration when over the small supplier threshold (~30k CAD over four consecutive quarters), payroll remittances if employees exist.
- Corporations: T2 corporate income tax, GST/HST registration with the same small supplier logic, payroll remittances for employees.

## Union knowledge engine
### Core entities
- **Union**: `union_id`, `name`, `craft_type`, `national_or_regional`
- **UnionLocal**: `union_local_id`, `union_id`, `name`, `region`, `notes`
- **Program**: `program_id`, `union_local_id`, `name`, `program_type` (`permittee`, `apprentice`, `trainee`, `member`, `associate`), `is_default_entry_path`
- **Requirement**: `requirement_id`, `program_id`, `req_type` (`min_days`, `min_hours`, `min_credits`, `course_completed`, `document_provided`, `license`, `residency`, `references`), `value`, `time_window`, `notes_for_user`, `notes_for_admin`, optional `department`
- **RequirementGroup**: groups requirements with `group_type` (`ALL`, `ANY`) to express “A or B” logic.

### Unions and locals to support
Schema must cover performers (ACTRA, UBCP/ACTRA), directors/logistics (DGC national + Ontario GAP, BC, Manitoba MAP), technicians (IATSE locals 891, 669, 212, 210, 295, 856, 873, 667, 411, 634, 849), Quebec (AQTIS 514 IATSE), alternative unions (NABET 700-M UNIFOR, ACFC West), Teamsters (155, 362, 879), and WGC. Patterns include credits or day thresholds, department-specific requirements, course and license checks, residency rules, application status (open/closed/waitlist), and alternative paths like “1 speaking credit OR 1,600 hours.”

## Eligibility and logic games
- Build an eligibility engine that evaluates `RequirementGroup` logic against a user’s work history and completed courses to return eligibility state and missing items.
- Generate wizard questions automatically from requirements (e.g., “How many ACTRA background days in the last 12 months?”) and surface progress plus “next best action.”
- Use the same rules to power insights such as projected timelines to eligibility based on current pace.

## Finance integration
- Model union fees as financial rules: `fee_type` (`initiation`, `annual`, `working_dues`), `calculation_type` (`flat`, `percentage_of_union_income`), `payment_frequency` (`one_time`, `annual`, `per_project`).
- Include dues in cash-flow projections and mark them as potentially deductible (with disclaimers).
- Tie Business Profile and union status into tax insights (e.g., self-employed ACTRA member in Ontario owes personal income tax + CPP + GST/HST when above threshold).

## Plan gating
Register new features in the feature/plan config with minimum plan requirements:
- `tax_checklist` (Free basics, Pro detailed)
- `union_wizard` (Pro)
- `union_dues_projection` (Pro/Agency as decided)
- Agency plan should enable multi-member dashboards and planning.

## V1 launch decisions
- **Launch cohort:** Wave 1 covers ACTRA Toronto, UBCP/ACTRA, DGC Ontario, IATSE 873, NABET 700, Teamsters 155, and WGC. Waves 2–3 add the remaining IATSE locals, Teamsters 362/879, ACFC West, DGC BC/MB, and AQTIS 514.
- **Data stewardship:** maintain a single live copy of rules with `last_verified_at/by`, tracked sources, and a lightweight change log; Wave 1 reviewed every 6 months.
- **Work history contract:** use the shared `WorkRecord` shape (project, role, department, signatory status, days, location, evidence) as the input to eligibility and finance modules.
- **Logic game UX:** Phase 1 ships a dedicated "Union Roadmap" tab with progress, missing items, and projections; Phase 2 adds onboarding/contextual prompts.
- **Tax MVP:** ship checklist plus CPP and GST/HST estimates first; deeper income tax calculations wait for CPA review.
- **Plan gating:** Free = business profile + basic obligations; Pro = estimators, full roadmaps, dues projections, work history; Agency = Pro + multi-member dashboards.

## Firestore data model (launch baseline)
The backend should be structured around explicit top-level collections with user-scoped subcollections so queries stay predictable and indexes are minimal.

### Top-level collections
- **`users/{userId}`** – Core profile linked to Firebase Auth UID and high-level aggregates updated by Functions.
  ```ts
  type MemberStatus = "ASPIRING" | "MEMBER";

  interface UserDoc {
    id: string;            // auth UID
    email: string;
    name: string;
    role: string;          // e.g., "Actor", "Director"
    accountType: "INDIVIDUAL" | "AGENT";
    province: string;      // e.g., "ON", "BC"
    isOnboarded: boolean;
    isPremium: boolean;
    memberStatus: MemberStatus;
    primaryIndustry?: string; // for agents
    activeViewId?: string;    // which client an agent is viewing
    stats: {
      totalHours: number;
      totalEarnings: number;
      totalDeductions: number;
      lastUpdated: Timestamp;
    };
  }
  ```

- **`agency_assignments/{assignmentId}`** – Agent ↔ Member links with permissions for roster access.
  ```ts
  interface AgencyAssignmentDoc {
    agentId: string;   // ref users/{agentId}
    memberId: string;  // ref users/{memberId}
    memberEmail: string;
    status: "ACTIVE" | "PENDING" | "ARCHIVED";
    createdAt: Timestamp;
    permissions: {
      canViewFinancials: boolean;
      canEditJobs: boolean;
    };
  }
  ```

- **`tax_rules/{province_year}`** – Admin-managed reference rules to avoid hardcoding CRA logic.
  ```ts
  interface TaxRuleDoc {
    province: string;   // e.g., "ON"
    year: number;       // e.g., 2024
    basicPersonalAmount: number;
    brackets: { threshold: number; rate: number }[];
  }
  ```

### Subcollections under `users/{userId}`
- **`jobs/{jobId}`** – Work history entries that drive eligibility, earnings, and projections.
  ```ts
  interface JobDoc {
    productionName: string;
    companyName: string;
    status: "CONFIRMED" | "TENTATIVE";
    startDate: string;   // ISO date
    endDate?: string;
    totalHours: number;
    isUnion: boolean;
    unionTypeId?: string;
    unionName?: string;
    role: string;
    department?: string;
    hourlyRate: number;
    grossEarnings: number;
    unionDeductions: number;
    documentCount: number;
    notes?: string;
    createdAt: Timestamp;
  }
  ```

- **`trackers/{trackerId}`** – Eligibility progress toward union tiers.
  ```ts
  interface TrackerDoc {
    unionTypeId: string;
    unionName: string;
    tierLabel: string;
    targetType: "HOURS" | "DAYS" | "CREDITS" | "EARNINGS";
    targetValue: number;
    startingValue: number;
    department?: string;
  }
  ```

- **`documents/{docId}`** – Metadata for files stored in Firebase Storage.
  ```ts
  type DocumentType = "LICENSE" | "PAY_STUB" | "CONTRACT";

  interface DocumentDoc {
    fileName: string;
    fileType: string;
    docType: DocumentType;
    storagePath: string;
    url: string;           // signed URL
    uploadedAt: Timestamp;
    verified: boolean;
  }
  ```

- **`calculations/{calcId}`** (optional) – Cached heavy computations like annual tax reports.
  ```ts
  interface CalculationDoc {
    type: string;           // e.g., "TAX_REPORT_2024"
    generatedAt: Timestamp;
    data: Record<string, unknown>; // structured payload with totals/breakdowns
  }
  ```

### Required indexes
- **Jobs by date:** collection `jobs` with `userId` (asc) + `startDate` (desc) to power dashboards.
- **Agency roster:** collection `agency_assignments` with `agentId` (asc) + `status` (asc) for roster filtering.

The Firestore emulator or production console will prompt for composite index creation the first time these queries run; capture the generated links in infra runbooks once available.

See `docs/v1-launch-plan.md` for the full task list and assignments that implement these decisions.
