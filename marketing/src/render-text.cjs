// Draws the captions and title cards for both videos as PNGs, in the brand
// fonts (bundled in ios/CineArch/Fonts), with transparent backgrounds where
// they sit over app footage. Needs playwright-core and a Chromium build:
//   node src/render-text.cjs <chromium-executable>
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');

const root = path.resolve(__dirname, '..');
const fonts = path.resolve(root, '../ios/CineArch/Fonts');
const copy = JSON.parse(fs.readFileSync(path.join(__dirname, 'copy.json'), 'utf8'));
const out = path.join(root, 'out/text');
fs.mkdirSync(out, { recursive: true });

// Fonts are embedded in the page, so nothing depends on file access rules.
const face = (family, file, weight, style) =>
  `@font-face { font-family: '${family}'; font-weight: ${weight}; font-style: ${style}; src: url(data:font/ttf;base64,${fs.readFileSync(path.join(fonts, file)).toString('base64')}) format('truetype'); }`;
const css = `
${face('Instrument Serif', 'InstrumentSerif-Italic.ttf', 400, 'italic')}
${face('Spline Sans', 'SplineSans-Regular.ttf', 400, 'normal')}
${face('Spline Sans', 'SplineSans-SemiBold.ttf', 600, 'normal')}
${face('Spline Sans', 'SplineSans-Bold.ttf', 700, 'normal')}
* { margin: 0; box-sizing: border-box; }
html, body { background: transparent; color: #fff; font-family: 'Spline Sans', sans-serif; -webkit-font-smoothing: antialiased; }
.kicker { font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em; color: #FACC15; }
.serif { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; line-height: 1.02; }
.body { color: rgba(255,255,255,0.72); line-height: 1.45; }
`;

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function shot(page, w, h, html, file, opaque = false) {
  await page.setViewportSize({ width: w, height: h });
  // Loaded from a file, not setContent: an about:blank page can't load file:// fonts.
  const tmp = path.join(out, '_page.html');
  fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="width:${w}px;height:${h}px;${opaque ? 'background:#000' : ''}">${html}</body></html>`);
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  const wanted = ['italic 400 40px "Instrument Serif"', '400 20px "Spline Sans"', '600 20px "Spline Sans"', '700 20px "Spline Sans"'];
  await page.evaluate(async fs => { for (const f of fs) await document.fonts.load(f); await document.fonts.ready; }, wanted);
  const missing = await page.evaluate(fs => fs.filter(f => !document.fonts.check(f)), wanted);
  if (missing.length) throw new Error('Brand fonts not loaded: ' + missing.join(', '));
  await page.screenshot({ path: path.join(out, file), omitBackground: !opaque });
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.argv[2] });
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  // App Store preview: a caption band above the app, 886 x 300.
  for (const [i, s] of copy.preview.entries()) {
    await shot(page, 886, 300, `
      <div style="padding:78px 64px 0">
        <div class="kicker" style="font-size:22px">${esc(s.kicker)}</div>
        <div class="serif" style="font-size:${s.title.length > 26 ? 62 : 72}px;margin-top:16px">${esc(s.title)}</div>
      </div>`, `preview-${i}.png`);
  }

  // Explainer: text on the left of a 1920 x 1080 frame; the phone goes on the right.
  const ex = copy.explainer;
  for (const [i, s] of ex.scenes.entries()) {
    await shot(page, 1920, 1080, `
      <div style="position:absolute;left:160px;top:0;bottom:0;width:860px;display:flex;flex-direction:column;justify-content:center">
        <div class="kicker" style="font-size:22px">${esc(s.kicker)}</div>
        <div class="serif" style="font-size:104px;margin-top:22px">${esc(s.title)}</div>
        <div class="body" style="font-size:30px;margin-top:30px;max-width:760px">${esc(s.body)}</div>
      </div>`, `explainer-${i}.png`);
  }
  await shot(page, 1920, 1080, `
    <div style="height:100%;display:flex;flex-direction:column;justify-content:center;padding-left:160px">
      <div class="kicker" style="font-size:24px">Cast &amp; Crew Tracker</div>
      <div class="serif" style="font-size:260px;margin-top:10px">${esc(ex.open.title)}</div>
      <div class="body" style="font-size:36px;margin-top:24px;max-width:1100px">${esc(ex.open.body)}</div>
    </div>`, 'explainer-open.png', true);
  await shot(page, 1920, 1080, `
    <div style="height:100%;display:flex;flex-direction:column;justify-content:center;padding-left:160px">
      <div class="serif" style="font-size:200px">${esc(ex.close.title)}</div>
      ${ex.close.lines.map(l => `<div style="font-size:40px;font-weight:600;margin-top:18px">${esc(l)}</div>`).join('')}
      <div class="kicker" style="font-size:26px;margin-top:48px">${esc(ex.close.url)}</div>
    </div>`, 'explainer-close.png', true);

  fs.unlinkSync(path.join(out, '_page.html'));
  await browser.close();
  console.log('text rendered to', out);
})().catch(e => { console.error(e); process.exit(1); });
