# Plan benefits: what each claim actually does

Every benefit in `PLANS` (types.ts) and `Plan` (ios/CineArch/Data/Plans.swift)
is listed here with where it lives and whether it is true today.
`tests/plans.test.ts` fails if a benefit is added, removed or reworded
without updating this table, and if the web and iPhone wording drift apart.

Status: **True** = works as written on both apps unless noted.
**Partly** = works, but the wording promises more. **Not built** = no feature behind it.
Wording changes are Dean's call; this table only reports.

Checked 2026-10-17 against the live database (25 unions, 13 provinces and territories,
rate cards for 4 unions, pay rules for 3).

| Plan | Benefit | Status | What's true today |
| --- | --- | --- | --- |
| Indie Log | Union guide and rate cards for every province | Partly | The guide covers all 13 provinces and territories. Rate cards exist for 4 unions only: ACTRA, IATSE 212, IATSE 873, UBCP/ACTRA. |
| Indie Log | Pay calculator with overtime and minimum calls | Partly | Overtime and minimum calls apply for ACTRA, IATSE 873 and UBCP/ACTRA (the unions with pay rules). Other unions are rate × hours. |
| Indie Log | Your Slate: mark every day you work | True | iPhone app, kept on the phone. Free accounts can't use the website (Sync Online is Pro). |
| Indie Log | Your Wrap: count your days toward your union card | True | iPhone app, kept on the phone. Days on union sets count before membership. |
| A-List Pro | Everything in Indie Log | True | |
| A-List Pro | Wrap Wallet: an income and expense ledger with Canadian tax rules | Partly | Ledger on web and iPhone; locked to Pro in the database. Each entry can be backed with proof (photo, file, or iPhone camera scan); entries with proof are Green Lit. Free accounts see their total from the Slate only. Rules applied: meals 50% deductible, fines not deductible. The GST/HST suggestion is 5% in every province. |
| A-List Pro | Your $30k GST/HST line, tracked as you earn | Partly | Tracks income entered in the ledger. Job pay is not added automatically. |
| A-List Pro | What to set aside for CPP and income tax | Partly | Estimates only: CPP 11.9% above $3,500, income tax a flat 20% of net, not by province. Labelled as estimates. |
| A-List Pro | Union joining fees, ahead of time | Partly | Website Wallet shows the application fee for each union you track (17 of 25 unions have a fee on file). Not on iPhone. |
| A-List Pro | The Vault: pay stubs and proof for your union application | Partly | Website Settings; locked to Pro in the database. Not on iPhone. |
| A-List Pro | Your Ledger: PDF and CSV reports for applications and tax time | Partly | Website Reports, locked on screen for free accounts. Wrap Wallet exports a CSV spreadsheet on both apps; no PDF on iPhone. The page also shows hard-coded statuses ("Residency Check: Verified", "Voucher Sync", "Provenance Score") that are not checked. |
| Agency Command | Everything in A-List Pro | True | |
| Agency Command | Your Roster: every client's days and progress in one place | True | Website only (Your Roster). |
| Agency Command | Bulk upload for the whole roster | True | Website only. |
| Agency Command | Priority support | Not built | No support channel or queue exists. |

**Not on the list yet:** proof and Green Lit, camera scanning, reading receipts and pay stubs (iPhone, on the phone), bulk receipts and pay stubs (iPhone), and Sync Online (the website, iPad or another phone), Pro-only since 2026-10-17 and enforced in the database. Uploads: 1 MB per file, 5 GB per account. These are Pro-only, but no A-List Pro benefit names them. Wording is Dean's call.

Payments: no plan can be bought yet. Upgrade buttons say "Upgrades open soon".
