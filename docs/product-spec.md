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

## Open decisions / next steps
- Prioritize which unions/locals seed at launch (e.g., ACTRA Toronto, UBCP/ACTRA, DGC Ontario, IATSE 873, NABET 700, Teamsters 155, WGC).
- Decide who enters and maintains rule data and whether to version by year.
- Define the work history model consistently (days worked, role, signatory status, department, union mapping).
- Finalize UX for the “logic game” (onboarding vs dedicated tab) and where to surface legal/tax disclaimers.
- Lock MVP scope for tax outputs (checklist-only vs simple estimates) and plan gating for each feature.
