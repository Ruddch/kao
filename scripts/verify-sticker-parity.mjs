import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pack = JSON.parse(fs.readFileSync(path.join(root, 'data/editor_glyph_pack.json'), 'utf8'));
const lookup = JSON.parse(fs.readFileSync(path.join(root, 'data/editor_lookup.json'), 'utf8'));
const layout = JSON.parse(fs.readFileSync(path.join(root, 'public/onchain/layout_constants.json'), 'utf8'));
const parity = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/parity_fixtures.json'), 'utf8'));

function parseText(text) {
  const clusters = [];
  let pendingMarks = [];
  for (const char of text) {
    const key = lookup.by_char[char];
    if (!key) return { ok: false };
    const g = pack.symbols[key];
    if (!g) return { ok: false };
    if (g.glyph_type === 'combining') pendingMarks.push(key);
    else {
      clusters.push({ base: key, marks: pendingMarks });
      pendingMarks = [];
    }
  }
  if (pendingMarks.length) return { ok: false };
  return { ok: true, clusters };
}

function truncDiv(n, d) {
  if (n >= 0) return Math.trunc(n / d);
  return -Math.trunc(-n / d);
}

function targetCardWidth(l) {
  return truncDiv(l.canvas * l.cardWidthBps, l.fitScaleBps);
}

function bboxAt(bbox, x, y0, gs) {
  const bx0 = x + truncDiv(bbox[0] * gs, 1000);
  const by0 = y0 - truncDiv(bbox[3] * gs, 1000);
  const bx1 = x + truncDiv(bbox[2] * gs, 1000);
  const by1 = y0 - truncDiv(bbox[1] * gs, 1000);
  return [
    Math.min(bx0, bx1),
    Math.min(by0, by1),
    Math.max(bx0, bx1),
    Math.max(by0, by1),
  ];
}

function measureBounds(clusters, gs) {
  let x = 0;
  const y0 = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const c of clusters) {
    const base = pack.symbols[c.base];
    if (!base) continue;
    let [cMinX, cMinY, cMaxX, cMaxY] = bboxAt(base.bbox, x, y0, gs);
    for (const mk of c.marks) {
      const m = pack.symbols[mk];
      if (!m) continue;
      const b = bboxAt(m.bbox, x, y0, gs);
      cMinX = Math.min(cMinX, b[0]);
      cMinY = Math.min(cMinY, b[1]);
      cMaxX = Math.max(cMaxX, b[2]);
      cMaxY = Math.max(cMaxY, b[3]);
    }
    x += truncDiv(base.advance * gs, 1000);
    minX = Math.min(minX, cMinX);
    minY = Math.min(minY, cMinY);
    maxX = Math.max(maxX, cMaxX);
    maxY = Math.max(maxY, cMaxY);
  }

  if (!Number.isFinite(minX)) return [0, 0, 200, 120];
  return [minX, minY, maxX, maxY];
}

function ratioToScaleString(num, den) {
  const whole = truncDiv(num, den);
  const frac = Math.abs(num % den);
  if (!frac) return String(whole);
  const fracStr = String(frac).padStart(6, '0').replace(/0+$/, '');
  if (whole === 0) return fracStr ? `0.${fracStr}` : '0';
  return fracStr ? `${whole}.${fracStr}` : String(whole);
}

function buildSvg(clusters, themeId = 0) {
  const gs = layout.glyphScale;
  const fsBps = layout.fitScaleBps;
  const psd = layout.pathScaleDenom;
  const theme = layout.themes.find((t) => t.id === themeId) ?? layout.themes[0];
  const [minX, minY, maxX, maxY] = measureBounds(clusters, gs);
  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const cardW0 = contentW + 2 * layout.cardPadX;
  const cardH0 = contentH + 2 * layout.cardPadY;
  const targetW = targetCardWidth(layout);
  let fitBps = truncDiv(targetW * fsBps, cardW0);
  let finalCardH = truncDiv(cardH0 * fitBps, fsBps);
  if (finalCardH + layout.shadowDy > layout.canvas) {
    fitBps = Math.min(fitBps, truncDiv((layout.canvas - layout.shadowDy) * fsBps, cardH0));
    finalCardH = truncDiv(cardH0 * fitBps, fsBps);
  }
  const finalCardW = truncDiv(cardW0 * fitBps, fsBps);
  const cardX = truncDiv(layout.canvas - finalCardW - layout.shadowDx, 2);
  const cardY = truncDiv(layout.canvas - finalCardH - layout.shadowDy, 2);
  const shiftX = layout.cardPadX - minX;
  const shiftY = layout.cardPadY - minY;
  let paths = '';
  let x = 0;
  const y0 = 0;

  for (const c of clusters) {
    const base = pack.symbols[c.base];
    if (!base) continue;
    const draw = (g) => {
      if (!g.path) return;
      const tx = cardX + truncDiv((x + shiftX) * fitBps, fsBps);
      const ty = cardY + truncDiv((y0 + shiftY) * fitBps, fsBps);
      const sc = ratioToScaleString(gs * fitBps, psd);
      paths += `<path transform="translate(${tx},${ty}) scale(${sc},-${sc})" d="${g.path}" fill="#000000"/>`;
    };
    draw(base);
    for (const mk of c.marks) {
      const m = pack.symbols[mk];
      if (m) draw(m);
    }
    x += truncDiv(base.advance * gs, 1000);
  }

  const frame = `<rect width="${layout.canvas}" height="${layout.canvas}" fill="${theme.hex}"/><rect x="${cardX + layout.shadowDx}" y="${cardY + layout.shadowDy}" width="${finalCardW}" height="${finalCardH}" fill="#000000"/><rect x="${cardX}" y="${cardY}" width="${finalCardW}" height="${finalCardH}" fill="#ffffff" stroke="#000000" stroke-width="${layout.stroke}"/>`;
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.canvas} ${layout.canvas}">${frame}${paths}</svg>`,
    fitBps,
    fontSize: truncDiv(gs * fitBps * 1000, psd),
    scaledPadX: truncDiv(layout.cardPadX * fitBps, fsBps),
    scaledPadY: truncDiv(layout.cardPadY * fitBps, fsBps),
  };
}

function themeFromComposition(hex) {
  const bytes = Buffer.from(hex.startsWith('0x') ? hex.slice(2) : hex, 'hex');
  return bytes[bytes.length - 1] & 3;
}

let fail = 0;
for (const c of parity.cases) {
  const parsed = parseText(c.text);
  if (!parsed.ok) {
    console.error('parse fail', c.text);
    fail++;
    continue;
  }
  const themeId = themeFromComposition(c.composition);
  const got = buildSvg(parsed.clusters, themeId).svg;
  const hash = createHash('sha256').update(got).digest('hex');
  if (hash !== c.svgSha256) {
    console.error('MISMATCH', JSON.stringify(c.text), hash.slice(0, 16), '!=', c.svgSha256.slice(0, 16));
    fail++;
  }
}

if (fail) {
  console.error(`${fail}/${parity.cases.length} SVG mismatches`);
  process.exit(1);
}

console.log(`All ${parity.cases.length} SVG parity fixtures OK`);
