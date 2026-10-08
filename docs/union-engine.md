# Union engine

The union engine is the source of truth for every union, its requirements, fees, dues and rates, the role catalog, and which union covers which role where. It lives in Supabase. Edit it in **Supabase → Table Editor**. The app picks up changes the next time it starts, and the guide picks them up on its next build.

## Tables

| Table | What a row is |
|---|---|
| `unions` | One union, guild or local: name, description, website, contact, application fee and notes, dues rate (`0.0225` = 2.25%) and notes, residency rule, `needs_verification`, `source_urls`, `last_verified`. Set `is_active = false` to hide a union without deleting its history. |
| `union_jurisdictions` | Where a union operates: one row per province, plus `region` for Ontario sub-regions (`TORONTO`, `NORTHERN_ON`, `OTTAWA`). Holds district council or branch contacts. |
| `union_tiers` | Membership steps in order (Permittee → Member), each with a target: `HOURS`, `DAYS`, `CREDITS` or `EARNINGS`. Progress tracking counts toward the first tier. |
| `union_requirements` | Requirements (`kind = requirement`) and application steps (`kind = application_step`). `province` and `caucus` scope an item, such as DGC BC permittee rules or the 411 Craftservice caucus. |
| `union_departments` | Departments as the union lists them, shown on its guide page. |
| `departments`, `roles` | The role catalog people pick from. `roles.aliases` catch other titles for the same job. |
| `role_coverage` | **The engine's answer.** Which union covers a role in a province. A row with a `region` replaces that province's rows for that region. `relationship = shared` marks competing jurisdiction ("873 or NABET"). `notes` is shown next to the answer. |
| `department_coverage` | The fallback for job titles that aren't in the catalog. |
| `rate_schedules`, `rate_lines` | Published minimum rates. `rates[i]` is the rate for `columns[i]`; `null` means negotiable. |

To check the data, use the read-only view `union_roles`: the roles each union covers, by province.

## Common edits

- **Change a fee or dues rate:** edit the row in `unions`, update `last_verified`, and remove the item from `needs_verification`.
- **Add a role:** insert it into `roles`, then copy coverage from a similar role in the SQL editor with `select copy_role_coverage('key-grip', 'new-role-id');` and adjust the copied rows.
- **Change who covers a role:** edit, add or delete rows in `role_coverage`. Each row's union must have a matching row in `union_jurisdictions`; the smoke test checks this.
- **Add a union:** insert it into `unions`, add its `union_jurisdictions`, `union_tiers` and `union_requirements` rows, then add `role_coverage` rows.

Never invent a number. If a fact isn't published, leave it empty and add it to `needs_verification`; the guide shows it as "awaiting confirmation".

## Checks

```
npm run db:test:engine
```

The test confirms the tables are publicly readable but not writable through the API, that edits bump the version, and that coverage never points at a union outside its jurisdictions.

## How it's read

- `union_engine_snapshot()` returns everything as JSON in one call.
- `union_engine_version()` changes on every insert, update or delete.
- The app caches the snapshot in the browser and re-downloads it only when the version changes (`services/engine_loader.ts`).
- The guide fetches the snapshot when it builds (`site/src/lib/guide.ts`). After editing, rebuild and redeploy the guide.
