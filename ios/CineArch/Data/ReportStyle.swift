import Foundation

// The report design (same as docs/examples/src). Generated from report.css; keep them in step.
enum ReportStyle {
    /// The brand fonts from the app bundle, embedded so reports look right with no signal.
    static let fontFaces: String = {
        let faces: [(file: String, family: String, weight: Int, style: String)] = [
            ("SplineSans-Regular", "Spline Sans", 400, "normal"), ("SplineSans-Medium", "Spline Sans", 500, "normal"),
            ("SplineSans-SemiBold", "Spline Sans", 600, "normal"), ("SplineSans-Bold", "Spline Sans", 700, "normal"),
            ("InstrumentSerif-Regular", "Instrument Serif", 400, "normal"), ("InstrumentSerif-Italic", "Instrument Serif", 400, "italic"),
        ]
        return faces.compactMap { f in
            guard let url = Bundle.main.url(forResource: f.file, withExtension: "ttf"), let data = try? Data(contentsOf: url) else { return nil }
            return "@font-face { font-family: '\(f.family)'; font-weight: \(f.weight); font-style: \(f.style); src: url(data:font/ttf;base64,\(data.base64EncodedString())) format('truetype'); }"
        }
        .joined(separator: "\n")
    }()

    static let css = """

  @page { size: Letter; margin: 0; }
  :root { --ink: #0b0b0b; --paper: #ffffff; --signal: #FACC15; --muted: #6b6b6b; --rule: #e4e4e4; --green: #15803d; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Spline Sans', -apple-system, sans-serif; color: var(--ink); background: var(--paper); font-size: 10pt; line-height: 1.45; }
  .page { width: 8.5in; height: 11in; position: relative; padding: 0.55in 0.6in 0.8in; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
  .serif { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; }
  .label { font-size: 7pt; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); }

  /* Slate header: black band with clapper stripes */
  .slate { background: var(--ink); color: #fff; margin: -0.55in -0.6in 0.35in; padding: 0 0.6in 0.3in; }
  .stripes { height: 0.22in; margin: 0 -0.6in 0.28in; background: repeating-linear-gradient(-45deg, var(--signal) 0 0.22in, var(--ink) 0.22in 0.44in); }
  .slate-top { display: flex; justify-content: space-between; align-items: flex-end; }
  .wordmark { font-size: 9pt; font-weight: 700; letter-spacing: 0.45em; color: var(--signal); }
  .slate h1 { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; font-size: 40pt; line-height: 1; margin-top: 10px; }
  .slate-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 18px; border-top: 1px solid #333; }
  .slate-grid div { padding: 9px 12px 0 0; }
  .slate-grid .label { color: #9a9a9a; }
  .slate-grid p { font-size: 10.5pt; margin-top: 2px; }

  .tagsample { background: var(--signal); color: var(--ink); font-size: 7pt; font-weight: 700; letter-spacing: 0.2em; padding: 3px 7px; margin-right: 10px; }
  .sample { position: absolute; top: 0.33in; right: 0.6in; background: var(--signal); color: var(--ink); font-size: 7pt; font-weight: 700; letter-spacing: 0.2em; padding: 4px 8px; }

  h2 { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; font-size: 20pt; margin: 22px 0 10px; display: flex; align-items: baseline; gap: 10px; }
  h2 .label { font-family: 'Spline Sans', sans-serif; font-style: normal; }

  .figures { display: grid; grid-template-columns: repeat(3, 1fr); border: 1.5px solid var(--ink); }
  .figures > div { padding: 12px 14px; border-right: 1px solid var(--rule); }
  .figures > div:last-child { border-right: 0; }
  .figures .big { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 24pt; line-height: 1.1; margin-top: 4px; }
  .figures .net { background: var(--ink); color: #fff; }
  .figures .net .big { color: var(--signal); }
  .figures .net .label { color: #9a9a9a; }

  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .box { border: 1px solid var(--rule); padding: 12px 14px; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--rule); }
  .row:last-child { border-bottom: 0; }
  .num { font-variant-numeric: tabular-nums; }

  .bar { height: 10px; background: #efefef; margin: 8px 0 6px; position: relative; }
  .bar span { position: absolute; inset: 0 auto 0 0; background: var(--ink); }
  .bar.signal span { background: var(--signal); }

  .greenlit { display: flex; align-items: center; gap: 12px; border: 1.5px solid var(--green); padding: 10px 14px; margin-top: 14px; }
  .seal { width: 26px; height: 26px; border: 2px solid var(--green); display: grid; place-items: center; color: var(--green); font-weight: 700; }
  .greenlit .label { color: var(--green); }

  table { width: 100%; border-collapse: collapse; font-size: 8.8pt; }
  th { text-align: left; font-size: 6.8pt; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); padding: 6px 6px; border-bottom: 1.5px solid var(--ink); }
  td { padding: 6px 6px; border-bottom: 1px solid var(--rule); vertical-align: top; }
  td.r, th.r { text-align: right; }
  tr.total td { border-top: 1.5px solid var(--ink); border-bottom: 0; font-weight: 600; }
  .lit { color: var(--green); font-weight: 600; white-space: nowrap; }
  .need { color: #a16207; font-weight: 600; white-space: nowrap; }
  .tag { font-size: 6.8pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 1px 5px; border: 1px solid var(--ink); }
  .tag.u { background: var(--signal); border-color: var(--signal); }
  .muted { color: var(--muted); }

  footer { position: absolute; left: 0.6in; right: 0.6in; bottom: 0.4in; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--ink); padding-top: 8px; font-size: 7.5pt; color: var(--muted); }
  footer .mark { font-weight: 700; letter-spacing: 0.4em; color: var(--ink); }
  .note { font-size: 7.8pt; color: var(--muted); margin-top: 8px; }

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

  .tagsample { background: var(--signal); color: var(--ink); font-size: 7pt; font-weight: 700; letter-spacing: 0.2em; padding: 3px 7px; margin-right: 10px; }
  .shot { position: relative; box-shadow: 0 6px 16px rgba(0,0,0,.18); transform: rotate(-0.8deg); background: #fff; }
  .shot img { width: 100%; height: 100%; display: block; object-fit: fill; }
  .hl { position: absolute; background: rgba(250, 204, 21, .28); outline: 1.5px solid #FACC15; }
  .hl .pin { position: absolute; right: -19px; top: 50%; transform: translateY(-50%); }
  .photo-missing { color: #7a766d; font-size: 8pt; padding: 20px; text-align: center; }

"""
}
