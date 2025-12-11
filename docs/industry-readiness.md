# Industry readiness checklist

Use this checklist to move CineArch from prototype to an industry-grade release. It focuses on stability, compliance, and operational maturity rather than feature ideation.

## 1) Rule and data quality
- **Seed authoritative data**: load the initial union rules, tax obligations, and dues tables into a controlled source (Firestore collections or versioned JSON). Track `effective_from`, `effective_to`, and `last_verified_by`.
- **Versioning**: introduce `rule_version` and a change-log collection so you can audit when business logic changes and roll back if needed.
- **Work history normalization**: standardize the shape for work entries (project, department, signatory union, role, days/hours, locality) so eligibility and tax engines have consistent inputs.
- **Validation & linting**: add schema validation (e.g., Zod) for all rule ingestion pipelines to catch malformed entries before they reach production.

## 2) Security and compliance
- **Access control**: finalize Firestore and Storage rules for members, agencies, and admins. Run automated rule tests (Firebase Emulator Suite) for read/write matrices.
- **PII handling**: ensure sensitive identifiers (licenses, SIN-like numbers) live in a restricted collection with field-level redaction in the UI and logging.
- **Auditing**: log all admin and agency actions (edits to member data, rule changes, document downloads) to a tamper-resistant collection with retention policies.
- **Secrets & environments**: require `.env.local` for local, `env` variables for CI, and per-environment Firebase projects (dev/stage/prod). Never check configs into git.

## 3) Reliability and operations
- **Testing pyramid**: add unit tests for rule evaluators, integration tests for Firebase services via emulators, and minimal smoke E2E for core user journeys (signup, member dashboard, doc upload).
- **Observability**: enable Firebase/Cloud Logging and Errors collection. Add client-side error boundary reporting to surface runtime issues.
- **Backups**: configure automated Firestore and Storage backups. Document restore procedures and run a restoration drill at least once before launch.
- **Performance budgets**: instrument key flows (dashboard load, wizard completion). Add caching/aggregation documents where queries would otherwise be unbounded.

## 4) Product gating and UX clarity
- **Plan enforcement**: ensure every new feature (tax checklist, union wizards, dues projections) is tagged with `min_plan` and surfaces upgrade prompts when gated.
- **Disclaimers**: display legal and tax disclaimers near estimates and eligibility results; confirm language with counsel.
- **Empty states and fallbacks**: design for missing data (no work history yet, incomplete business profile) so users always see actionable next steps.

## 5) Previewing and QA workflows
- **Local preview**: use `npm run dev` with a populated `.env.local` (Firebase config only). Add a small seed script or JSON fixtures for mock data so PMs can click through without live writes.
- **Review apps**: set up per-branch preview deployments (e.g., Vercel or Firebase Hosting channels) tied to disposable Firebase projects for safe evaluation.
- **Release checklist**: document a go/no-go checklist covering migrations, rules deployment, smoke tests, and monitoring alerts before promoting to production.

## 6) Next steps to close gaps
- Prioritize which unions/local rules to seed first (e.g., ACTRA Toronto, UBCP/ACTRA, DGC Ontario, IATSE 873, NABET 700, Teamsters 155, WGC) and assign data owners.
- Implement the eligibility/tax rule evaluators against the new normalized schemas, backed by emulator tests.
- Wire the UI wizards to the rule engine with clear upgrade prompts and disclaimers.
- Stand up monitoring, backups, and audit logging before the first external pilot.
