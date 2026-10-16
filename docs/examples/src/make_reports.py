"""Sample CineArch exports: Union Pack, Tax Pack and Wrap Report, each ending in
annotated proof pages. Made-up data (the app's preview account, Jordan Ellis).
Run: python3 make_reports.py  -> ../<name>.html (then render to PDF)."""
from pathlib import Path
from html import escape as e

HERE = Path(__file__).parent
CSS = (HERE / "report.css").read_text()
GENERATED = "Oct 17, 2026"

# ── Sample data (matches ios/CineArch/Data/Sample.swift) ────────────────────
JOBS = [  # dates, production, company, role, union, days, hours, gross, proof id
    ("Oct 14", "Northern Lights (Series)", "Apex Screen Partners", "2nd AC", "IATSE 667", 1, 11, 525.00, "stub-nl-day"),
    ("Sep 8 – Oct 9", "Northern Lights (Series)", "Apex Screen Partners", "2nd AC", "IATSE 667", 20, 220, 10500.00, "stub-nl-block"),
    ("Jun 1 – Jun 19", "Untitled Horror Feature", "Darkfield Productions", "2nd AC", "IATSE 667", 15, 165, 7400.00, "stub-horror"),
    ("May 12 – May 13", "Maple & Main (Commercial)", "Northbound Creative", "Camera Op", None, 2, 24, 1400.00, None),
    ("Apr 20 – Apr 24", "The Long Weekend", "Junction Films", "1st AC", None, 5, 55, 2750.00, None),
]
ENTRIES = [  # date, what, category, before tax, tax, income?, proof id
    ("Oct 14", "Northern Lights · day call", "Service fees", 525.00, 0, True, "stub-nl-day"),
    ("Oct 9", "Northern Lights · block 2", "Service fees", 10500.00, 0, True, "stub-nl-block"),
    ("Oct 9", "Wrap drinks with the camera team", "Meals (50% rule)", 68.00, 8.84, False, None),
    ("Sep 4", "AC pouch, slate markers, lens tissue", "Gear & small tools", 186.00, 24.18, False, "rcpt-vistek"),
    ("Jul 2", "IATSE 667 permit fees", "Union dues", 350.00, 0, False, "rcpt-667"),
    ("Jun 19", "Untitled Horror Feature", "Service fees", 7400.00, 0, True, "stub-horror"),
    ("May 13", "Maple & Main commercial", "Service fees", 1400.00, 0, True, "inv-maple"),
    ("Apr 24", "The Long Weekend", "Service fees", 2750.00, 0, True, "inv-weekend"),
    ("Mar 31", "Phone plan (business share)", "Office supplies", 120.00, 15.60, False, None),
]

# Each proof: the "photo" (lines, some pinned) and what CineArch read from it.
# pins: line index -> (number, field, value read, entry value)
PROOFS = {
    "stub-nl-day": dict(kind="Pay stub", title="Apex Screen Partners", lines=[
        "APEX SCREEN PARTNERS INC.", "Northern Lights (Series) · Prod. #NL-204", "PAY STATEMENT", "",
        "Employee: Jordan Ellis", "Position: 2nd Assistant Camera", "Work date: Oct 14, 2026",
        "Union: IATSE Local 667 (permit)", "", "Hours worked        11.0", "Rate               42.00",
        "Gross pay          525.00", "Deductions         -98.41", "Net pay            426.59"],
        pins={6: (1, "Work date", "Oct 14, 2026", "Oct 14, 2026"), 7: (2, "Union set", "IATSE 667", "IATSE 667"),
              9: (3, "Hours", "11.0", "11"), 11: (4, "Gross pay", "$525.00", "$525.00")}),
    "stub-nl-block": dict(kind="Pay stub", title="Apex Screen Partners", lines=[
        "APEX SCREEN PARTNERS INC.", "Northern Lights (Series) · Prod. #NL-204", "PAY STATEMENT", "",
        "Employee: Jordan Ellis", "Position: 2nd Assistant Camera", "Period: Sep 8 – Oct 9, 2026",
        "Union: IATSE Local 667 (permit)", "Days worked          20", "Hours worked       220.0",
        "Rate               42.00", "Gross pay       10,500.00", "Net pay          8,121.77"],
        pins={6: (1, "Period", "Sep 8 – Oct 9, 2026", "Sep 8 – Oct 9"), 8: (2, "Days", "20", "20"),
              9: (3, "Hours", "220.0", "220"), 11: (4, "Gross pay", "$10,500.00", "$10,500.00")}),
    "stub-horror": dict(kind="Pay stub", title="Darkfield Productions", lines=[
        "DARKFIELD PRODUCTIONS LTD.", "Untitled Horror Feature", "STATEMENT OF EARNINGS", "",
        "Jordan Ellis · 2nd AC", "Period: Jun 1 – Jun 19, 2026", "IATSE 667 permit",
        "Days                 15", "Hours              165.0", "Gross            7,400.00", "Net              5,702.10"],
        pins={5: (1, "Period", "Jun 1 – Jun 19, 2026", "Jun 1 – Jun 19"), 7: (2, "Days", "15", "15"),
              8: (3, "Hours", "165.0", "165"), 9: (4, "Gross pay", "$7,400.00", "$7,400.00")}),
    "rcpt-vistek": dict(kind="Receipt", title="Vistek Camera Store", lines=[
        "VISTEK CAMERA STORE", "496 Queen St E, Toronto", "Sep 4, 2026  14:02", "",
        "AC pouch               129.00", "Slate markers x4        38.00", "Lens tissue             19.00", "",
        "SUBTOTAL               186.00", "HST 13%                 24.18", "TOTAL                  210.18", "",
        "VISA ****4417", "Thank you!"],
        pins={0: (1, "Store", "Vistek Camera Store", None), 2: (2, "Date", "Sep 4, 2026", "Sep 4, 2026"),
              9: (3, "GST/HST", "$24.18", "$24.18"), 10: (4, "Total", "$210.18", "$210.18")}),
    "rcpt-667": dict(kind="Receipt", title="IATSE Local 667", lines=[
        "IATSE LOCAL 667", "Permit fee receipt", "Jul 2, 2026", "",
        "Member/permittee: J. Ellis", "Permit fees            350.00", "", "TOTAL PAID             350.00", "", "Receipt #P-88213"],
        pins={2: (1, "Date", "Jul 2, 2026", "Jul 2, 2026"), 7: (2, "Total", "$350.00", "$350.00")}),
    "inv-maple": dict(kind="Invoice", title="Invoice to Northbound Creative", lines=[
        "INVOICE #JE-2026-014", "From: Jordan Ellis", "To: Northbound Creative", "Date: May 13, 2026", "",
        "Maple & Main (Commercial)", "Camera Operator, May 12–13", "2 days @ 700.00     1,400.00", "",
        "TOTAL DUE           1,400.00", "Paid May 28 · e-transfer"],
        pins={3: (1, "Date", "May 13, 2026", "May 13, 2026"), 9: (2, "Total", "$1,400.00", "$1,400.00")}),
    "inv-weekend": dict(kind="Invoice", title="Invoice to Junction Films", lines=[
        "INVOICE #JE-2026-011", "From: Jordan Ellis", "To: Junction Films", "Date: Apr 24, 2026", "",
        "The Long Weekend", "1st AC, Apr 20–24", "5 days @ 550.00     2,750.00", "",
        "TOTAL DUE           2,750.00", "Paid May 9 · cheque"],
        pins={3: (1, "Date", "Apr 24, 2026", "Apr 24, 2026"), 9: (2, "Total", "$2,750.00", "$2,750.00")}),
}

money = lambda n: f"${n:,.2f}"

EXTRA_CSS = """
  .proofs-intro { margin: 6px 0 4px; }
  .proof { display: grid; grid-template-columns: 3.35in 1fr; gap: 0.3in; height: 4.15in; padding: 0.18in 0; border-bottom: 1px dashed #cfcfcf; }
  .proof:last-of-type { border-bottom: 0; }
  .photo-wrap { background: #e9e6df; display: grid; place-items: center; overflow: hidden; position: relative; }
  .photo-wrap .cap { position: absolute; left: 8px; bottom: 6px; font-size: 6.5pt; letter-spacing: .15em; font-weight: 700; color: #7a766d; text-transform: uppercase; }
  .doc { background: #fffdf8; width: 2.75in; padding: 14px 14px 18px; transform: rotate(-1.2deg); box-shadow: 0 6px 16px rgba(0,0,0,.18);
         font-family: 'Courier New', monospace; font-size: 7.3pt; line-height: 1.5; color: #222; }
  .doc.stub, .doc.invoice { border-top: 4px solid #0b0b0b; }
  .doc .l { white-space: pre; position: relative; }
  .doc .l.first { font-weight: 700; }
  .doc .l.pinned { background: rgba(250, 204, 21, .35); outline: 1.5px solid #FACC15; margin: 0 -4px; padding: 0 4px; }
  .pin { display: inline-grid; place-items: center; width: 15px; height: 15px; background: #0b0b0b; color: #FACC15; font: 700 7.5pt 'Spline Sans', sans-serif; }
  .doc .pin { position: absolute; right: -24px; top: 0; }
  .panel h3 { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; font-size: 17pt; line-height: 1.1; margin: 4px 0 2px; }
  .panel .status { display: inline-block; margin-top: 8px; font-size: 7pt; font-weight: 700; letter-spacing: .2em; color: var(--green); border: 1.5px solid var(--green); padding: 2px 6px; }
  .read { width: 100%; margin-top: 12px; font-size: 8.3pt; }
  .read td { padding: 5px 4px; }
  .read th { padding: 5px 4px; }
  .ok { color: var(--green); font-weight: 700; }
  .missing { border: 1.5px dashed #a16207; padding: 10px 14px; margin-top: 12px; }
  .cat td.r { font-variant-numeric: tabular-nums; }
"""


def head(title):
    return f"""<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><title>{e(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Spline+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>{CSS}{EXTRA_CSS}
  .tagsample {{ background: var(--signal); color: var(--ink); font-size: 7pt; font-weight: 700; letter-spacing: 0.2em; padding: 3px 7px; margin-right: 10px; }}
</style></head><body>"""


def footer(n, total, left="Generated " + GENERATED + " · cine-arch.vercel.app"):
    return f'<footer><span class="mark">CINEARCH</span><span>{left}</span><span>Page {n} of {total}</span></footer>'


def cover(report, subtitle, grid):
    cells = "".join(f'<div><span class="label">{k}</span><p>{v}</p></div>' for k, v in grid)
    return f"""<div class="slate"><div class="stripes"></div>
  <div class="slate-top"><span class="wordmark">CINEARCH</span>
    <span><span class="tagsample">SAMPLE · MADE-UP DATA</span> <span class="label" style="color:#9a9a9a">{report}</span></span></div>
  <h1>{subtitle}</h1><div class="slate-grid">{cells}</div></div>"""


def running_head(report):
    return f"""<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.5px solid var(--ink);padding-bottom:8px">
  <span class="wordmark" style="color:var(--ink)">CINEARCH</span>
  <span><span class="tagsample">SAMPLE · MADE-UP DATA</span> <span class="label">{report} · Jordan Ellis · 2026</span></span></div>"""


def proof_block(i, of, pid, entry_line):
    p = PROOFS[pid]
    cls = {"Pay stub": "stub", "Invoice": "invoice"}.get(p["kind"], "")
    lines = []
    for k, text in enumerate(p["lines"]):
        pin = p["pins"].get(k)
        c = "l" + (" first" if k == 0 else "") + (" pinned" if pin else "")
        lines.append(f'<div class="{c}">{e(text) or "&nbsp;"}{f"<span class=pin>{pin[0]}</span>" if pin else ""}</div>')
    rows = "".join(
        (f'<tr><td><span class="pin">{n}</span></td><td>{field}</td><td>{e(read)}</td><td>{e(want)}</td><td class="ok">✓</td></tr>' if want
         else f'<tr><td><span class="pin">{n}</span></td><td>{field}</td><td>{e(read)}</td><td class="muted">Not in the entry</td><td class="muted">Noted</td></tr>')
        for n, field, read, want in sorted(p["pins"].values()))
    return f"""<div class="proof">
  <div class="photo-wrap"><div class="doc {cls}">{''.join(lines)}</div><span class="cap">Photo · {p['kind']}</span></div>
  <div class="panel">
    <span class="label">Proof {i} of {of} · {p['kind']}</span>
    <h3>{e(entry_line[0])}</h3>
    <div class="muted">{e(entry_line[1])}</div>
    <span class="status">✓ GREEN LIT</span>
    <table class="read"><tr><th></th><th>Read</th><th>On the photo</th><th>Your records</th><th></th></tr>{rows}</table>
    <p class="note">Highlighted on the photo where it was read. ✓ means the figure on the photo matches your records.</p>
  </div></div>"""


def proof_pages(report, items, start, total):
    """items: [(proof id, (title, detail))], two per page."""
    pages = []
    for k in range(0, len(items), 2):
        blocks = "".join(proof_block(k + j + 1, len(items), pid, line) for j, (pid, line) in enumerate(items[k:k + 2]))
        intro = '<h2>The proof <span class="label">Photos attached, annotated</span></h2>' if k == 0 else ""
        pages.append(f'<section class="page">{running_head(report)}{intro}{blocks}{footer(start + len(pages), total)}</section>')
    return pages


def figures():
    return """<div class="figures">
    <div><span class="label">Income</span><div class="big num">$22,575.00</div><span class="muted">5 entries</span></div>
    <div><span class="label">Expenses</span><div class="big num">$724.00</div><span class="muted">$690.00 deductible</span></div>
    <div class="net"><span class="label">Net (after deductions)</span><div class="big num">$21,885.00</div><span style="color:#9a9a9a">Income less deductible expenses</span></div></div>"""


def greenlit(lit, total, what="entries"):
    need = total - lit
    return f"""<div class="greenlit"><div class="seal">✓</div>
    <div style="flex:1"><span class="label">Green Lit</span><div><b>{lit} of {total}</b> {what} backed with proof, attached at the back</div></div>
    {f'<div class="need">{need} need proof</div>' if need else '<div class="lit">All backed</div>'}</div>"""


def set_tag(u):
    return f'<span class="tag u">{u}</span>' if u else '<span class="tag">Non-union</span>'


def slate_table(only_union=False):
    rows = [j for j in JOBS if j[4] or not only_union]
    tr = "".join(
        f'<tr><td class="num">{d}</td><td>{e(p)}<br><span class="muted">{e(c)}</span></td><td>{r}</td>'
        f'<td>{set_tag(u)}</td>'
        f'<td class="r num">{days}</td><td class="r num">{h}</td><td class="r num">{money(g)}</td>'
        f'<td>{"<span class=lit>✓ Pay stub</span>" if pid else "<span class=muted>—</span>"}</td></tr>'
        for d, p, c, r, u, days, h, g, pid in rows)
    tot = (sum(j[5] for j in rows), sum(j[6] for j in rows), sum(j[7] for j in rows))
    return f"""<table><tr><th>Dates</th><th>Production</th><th>Role</th><th>Set</th><th class="r">Days</th><th class="r">Hours</th><th class="r">Gross</th><th>Proof</th></tr>
    {tr}<tr class="total"><td colspan="4">{"On union sets" if only_union else "Worked"}</td><td class="r num">{tot[0]}</td><td class="r num">{tot[1]}</td><td class="r num">{money(tot[2])}</td><td></td></tr></table>"""


def wallet_table():
    tr = "".join(
        f'<tr><td class="num">{d}</td><td>{e(w)}</td><td>{c}</td><td class="r num">{money(a)}</td>'
        f'<td class="r num">{money(t) if t else "—"}</td><td class="r num">{"+" if inc else "−"}{money(a + t)}</td>'
        f'<td>{"<span class=lit>✓ Green Lit</span>" if pid else "<span class=need>Needs proof</span>"}</td></tr>'
        for d, w, c, a, t, inc, pid in ENTRIES)
    return f"""<table><tr><th>Date</th><th>What</th><th>Category</th><th class="r">Before tax</th><th class="r">GST/HST</th><th class="r">Total</th><th>Proof</th></tr>{tr}</table>"""


def setaside_gst():
    return """<div class="two" style="margin-top:18px">
    <div><h2 style="margin-top:0">GST/HST</h2><div class="box">
      <div class="row"><span>Collected</span><span class="num">$0.00</span></div>
      <div class="row"><span>Paid on expenses</span><span class="num">$48.62</span></div>
      <div class="row"><span>Small-supplier line</span><span class="num">$30,000.00</span></div>
      <div class="bar signal"><span style="width:75.25%"></span></div>
      <span class="muted">$22,575 of $30,000 · $7,425 until you must register</span></div></div>
    <div><h2 style="margin-top:0">Set aside <span class="label">Estimates</span></h2><div class="box">
      <div class="row"><span>CPP (self-employed)</span><span class="num">$2,187.82</span></div>
      <div class="row"><span>Income tax</span><span class="num">$4,377.00</span></div>
      <div class="row"><b>Total to set aside</b><b class="num">$6,564.82</b></div>
      <p class="note">CPP at 11.9% above $3,500; income tax at a flat 20% of net. Rough estimates, not tax advice. Check with an accountant.</p></div></div></div>"""


def card_box():
    return """<h2>Getting your card <span class="label">Days on union sets</span></h2><div class="box">
    <div class="row" style="border:0"><span><b>IATSE 667</b> · Member</span><span class="num"><b>42</b> of 60 days · 18 to go</span></div>
    <div class="bar"><span style="width:70%"></span></div>
    <span class="muted">36 days logged on IATSE 667 sets in CineArch + 6 banked before. Permit and non-member days on a union set count.</span></div>"""


def build(name, report, subtitle, grid, body_pages, proof_items):
    n_proof = (len(proof_items) + 1) // 2
    total = len(body_pages) + n_proof
    html = [head(f"CineArch {report} — Sample")]
    for i, (content, first) in enumerate(body_pages):
        top = cover(report, subtitle, grid) if first else running_head(report)
        html.append(f'<section class="page">{top}{content}{footer(i + 1, total)}</section>')
    html += proof_pages(report, proof_items, len(body_pages) + 1, total)
    html.append("</body></html>")
    (HERE.parent / f"{name}.html").write_text("".join(html))
    return total


entry_line = lambda d, w, c, a, t, inc: (w, f"{d}, 2026 · {c} · {'+' if inc else '−'}{money(a + t)}")
job_line = lambda j: (j[1], f"{j[0]}, 2026 · {j[3]} · {j[4] or 'Non-union'} · {j[5]} day{'s' if j[5] > 1 else ''}")

# ── Union Pack ──────────────────────────────────────────────────────────────
union_jobs = [j for j in JOBS if j[4]]
pages = {}
pages["cinearch-union-pack-sample"] = build(
    "cinearch-union-pack-sample", "Union Pack", "Jordan Ellis · IATSE 667",
    [("Role", "2nd Assistant Camera"), ("Based in", "Toronto, Ontario"), ("Applying to", "IATSE 667"), ("Period", "Jan 1 – Oct 17, 2026")],
    [(card_box() + greenlit(3, 3, "union jobs")
      + '<h2>Days on IATSE 667 sets <span class="label">Each backed by a pay stub</span></h2>' + slate_table(only_union=True)
      + '<p class="note">Plus 6 days banked before using CineArch (entered by Jordan, no proof attached). Non-union work is left out of this pack.</p>', True)],
    [(j[8], job_line(j)) for j in union_jobs])

# ── Tax Pack ────────────────────────────────────────────────────────────────
cats = {}
for d, w, c, a, t, inc, pid in ENTRIES:
    if not inc:
        ded = a * 0.5 if "50%" in c else a
        x = cats.setdefault(c, [0, 0, 0]); x[0] += a; x[1] += t; x[2] += ded
cat_rows = "".join(f'<tr><td>{c}</td><td class="r">{money(a)}</td><td class="r">{money(t)}</td><td class="r">{money(dd)}</td></tr>' for c, (a, t, dd) in cats.items())
missing = [x for x in ENTRIES if not x[6]]
miss = "".join(f"<li>{d} · {e(w)} · {money(a + t)}</li>" for d, w, c, a, t, inc, pid in missing)
pages["cinearch-tax-pack-sample"] = build(
    "cinearch-tax-pack-sample", "Tax Pack", "Jordan Ellis · Tax year 2026",
    [("Business", "Self-employed, film crew"), ("Province", "Ontario"), ("GST/HST", "Not registered"), ("Period", "Jan 1 – Oct 17, 2026")],
    [(f"""<h2>The money <span class="label">From the Wrap Wallet</span></h2>{figures()}{greenlit(7, 9)}{setaside_gst()}
       <h2>Expenses by category</h2><table class="cat"><tr><th>Category</th><th class="r">Before tax</th><th class="r">GST/HST paid</th><th class="r">Deductible</th></tr>{cat_rows}
       <tr class="total"><td>Total</td><td class="r">$724.00</td><td class="r">$48.62</td><td class="r">$690.00</td></tr></table>""", True),
     (f"""<h2>Every entry <span class="label">Income and expenses</span></h2>{wallet_table()}
       <p class="note">Meals and entertainment are 50% deductible ($34.00 of $68.00).</p>
       <div class="missing"><span class="label" style="color:#a16207">Still needs proof</span><ul style="margin:6px 0 0 16px">{miss}</ul>
       <p class="note">Add a receipt to each in CineArch and export again to include it.</p></div>""", False)],
    [(x[6], entry_line(*x[:6])) for x in ENTRIES if x[6]])

# ── Wrap Report (overview) ──────────────────────────────────────────────────
pages["cinearch-wrap-report-sample"] = build(
    "cinearch-wrap-report-sample", "Wrap Report", "Jordan Ellis · 2026 so far",
    [("Role", "2nd Assistant Camera"), ("Based in", "Toronto, Ontario"), ("Working toward", "IATSE 667"), ("Period", "Jan 1 – Oct 17, 2026")],
    [(f'<h2>The money <span class="label">From the Wrap Wallet</span></h2>{figures()}{greenlit(7, 9)}{setaside_gst()}{card_box()}', True),
     (f'<h2>Your Slate <span class="label">Worked, 2026</span></h2>{slate_table()}'
      '<p class="note">Pencilled in, not counted: Harbour Lights (Season 2), Nov 2–27; Night Market (Short), Oct 11.</p>'
      f'<h2>Wrap Wallet <span class="label">Every entry, with its proof</span></h2>{wallet_table()}', False)],
    [(x[6], entry_line(*x[:6])) for x in ENTRIES if x[6]])

for k, v in pages.items():
    print(k, v)
