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
| A-List Pro | Sync Online: works offline on iPhone, and syncs with iPad and the website | True | The iPhone app keeps a copy of the Slate, union tracking and Wallet on the phone and queues changes made with no signal (ios/CineArch/Data/Sync.swift; queue rules tested in CineArchKit OutboxTests). They're sent when the connection returns, the app reopens or the screen loads; rows show "Waiting to sync" until then. Proof uploads need a connection. Pro accounts see the same Slate, Wrap and Wallet on the iPhone app and the website (the website needs a connection). On iPad it runs as the iPhone app (phone-sized window, not an iPad layout). Free accounts keep data on one phone; the database refuses their online saves. Checked 2026-10-23. |
| A-List Pro | Wrap Wallet: an income and expense ledger with Canadian tax rules | Partly | Ledger on web and iPhone; locked to Pro in the database. Each entry can be backed with proof (photo, file, or iPhone camera scan); entries with proof are Green Lit. Free accounts see their total from the Slate only. Rules applied: meals 50% deductible, fines not deductible. The GST/HST suggestion is 5% in every province. |
| A-List Pro | Your $30k GST/HST line, tracked as you earn | Partly | Tracks income entered in the ledger. Job pay is not added automatically. |
| A-List Pro | What to set aside for CPP and income tax | Partly | Estimates only: CPP 11.9% above $3,500, income tax a flat 20% of net, not by province. Labelled as estimates. |
| A-List Pro | Green Lit: back every Wallet entry with proof (up to 5 GB) | True | Web and iPhone. Photo, file or iPhone camera scan per entry; a notice shows how many are Green Lit. 1 MB per file (photos shrunk to fit), 5 GB per account, enforced in the database. |
| A-List Pro | Read receipts and pay stubs with your camera | True | iPhone only, read on the phone with Apple's text recognition (English and French). Fills in store, total, GST/HST and date; employer, dates, hours, rate and gross pay. Leaves a field empty when it can't read it; the person checks before saving. |
| A-List Pro | Bulk upload: up to 20 receipts or pay stubs at a time | True | iPhone only. Receipts become draft Wallet entries with proof attached; pay stubs become draft jobs on the Slate. Nothing is saved until checked. |
| A-List Pro | Export your Wrap Wallet as a spreadsheet | True | Web and iPhone: a CSV with date, type, category, amounts, deductible and Green Lit status. |
| A-List Pro | Union joining fees, ahead of time | Partly | Website Wallet shows the application fee for each union you track (17 of 25 unions have a fee on file). Not on iPhone. |
| A-List Pro | The Vault: pay stubs and proof for your union application | Partly | Website Settings; locked to Pro in the database. Not on iPhone. |
| A-List Pro | Your Ledger: PDF and CSV reports for applications and tax time | True | iPhone: Union Pack, Tax Pack and Wrap Report PDFs, each with proof photos attached and annotated (where each figure was read, and whether it matches); CSV spreadsheet. Website: Reports page (locked for free) and CSV. The website Reports page still shows hard-coded statuses ("Residency Check: Verified", "Voucher Sync", "Provenance Score") that are not checked. |
| Agency Command | Everything in A-List Pro | True | |
| Agency Command | Your Roster: every client's days and progress in one place | True | Website only (Your Roster). |
| Agency Command | Bulk upload for the whole roster | True | Website only. |
| Agency Command | Priority support | Not built | No support channel or queue exists. |

Benefits added 2026-10-17 at Dean's request: Sync Online, Green Lit, reading receipts and pay stubs, bulk upload, spreadsheet export.

Payments: no plan can be bought yet. Upgrade buttons say "Upgrades open soon".
