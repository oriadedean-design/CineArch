// The CineArch engine: the one place every part of CineArch asks about
// unions — the public guide (site/), the personal app, and Agency Mode.
//
// Layers, each built on the one before:
//   union_engine  data from Supabase: unions, coverage, rate cards, pay rules
//   pay           how a day is paid (minimum call, overtime, time units)
//   job_pay       a job priced against its union's rate card and pay rule
//   job_import    spreadsheets turned into priced jobs
//   career        a person's standing: progress, hours, earnings, below-scale pay
//
// Import from here, not from the layers, so the engine can grow without
// touching every page. New union facts go in the Supabase tables
// (docs/union-engine.md); new reasoning goes in a layer above.

export * from './union_engine';
export * from './pay';
export * from './job_pay';
export * from './job_import';
export * from './career';

// Hosts connect the engine to its data: the app through services/engine_loader.ts
// (Supabase client, cached snapshot), the guide in site/src/lib/guide.ts (build-time fetch).
