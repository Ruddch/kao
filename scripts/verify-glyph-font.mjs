/**
 * Compare pack path vs source TTF for a glyph.
 * Usage: node scripts/verify-glyph-font.mjs U+203F /path/to/NotoSans-Regular.ttf
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const hexKey = process.argv[2] ?? 'U+203F';
const ttfPath = process.argv[3] ?? '/tmp/NotoSans-Regular.ttf';

const pack = JSON.parse(fs.readFileSync(path.join(root, 'data/editor_glyph_pack.json'), 'utf8'));
const glyph = pack.symbols[hexKey];
if (!glyph) {
  console.error('Unknown glyph', hexKey);
  process.exit(1);
}

const font = opentype.parse(fs.readFileSync(ttfPath).buffer);
const char = glyph.char;
const otGlyph = font.charToGlyph(char);
const otPath = otGlyph.getPath(0, 0, font.unitsPerEm);

function flattenSvgPath(d, steps = 32) {
  const tokens = d.match(/[MLQCZ]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const out = [];
  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[MLQCZ]$/.test(t)) {
      cmd = t;
      i++;
      if (cmd === 'Z') {
        cx = sx;
        cy = sy;
      }
      continue;
    }
    if (cmd === 'M') {
      cx = parseFloat(tokens[i++]);
      cy = parseFloat(tokens[i++]);
      sx = cx;
      sy = cy;
      out.push({ x: cx, y: cy });
    } else if (cmd === 'L') {
      const nx = parseFloat(tokens[i++]);
      const ny = parseFloat(tokens[i++]);
      for (let s = 1; s <= steps; s++) {
        const tt = s / steps;
        out.push({ x: cx + (nx - cx) * tt, y: cy + (ny - cy) * tt });
      }
      cx = nx;
      cy = ny;
    } else if (cmd === 'Q') {
      const x1 = parseFloat(tokens[i++]);
      const y1 = parseFloat(tokens[i++]);
      const x2 = parseFloat(tokens[i++]);
      const y2 = parseFloat(tokens[i++]);
      for (let s = 1; s <= steps; s++) {
        const tt = s / steps;
        const u = 1 - tt;
        out.push({
          x: u * u * cx + 2 * u * tt * x1 + tt * tt * x2,
          y: u * u * cy + 2 * u * tt * y1 + tt * tt * y2,
        });
      }
      cx = x2;
      cy = y2;
    } else if (cmd === 'C') {
      const x1 = parseFloat(tokens[i++]);
      const y1 = parseFloat(tokens[i++]);
      const x2 = parseFloat(tokens[i++]);
      const y2 = parseFloat(tokens[i++]);
      const x3 = parseFloat(tokens[i++]);
      const y3 = parseFloat(tokens[i++]);
      for (let s = 1; s <= steps; s++) {
        const tt = s / steps;
        const u = 1 - tt;
        out.push({
          x: u ** 3 * cx + 3 * u ** 2 * tt * x1 + 3 * u * tt ** 2 * x2 + tt ** 3 * x3,
          y: u ** 3 * cy + 3 * u ** 2 * tt * y1 + 3 * u * tt ** 2 * y2 + tt ** 3 * y3,
        });
      }
      cx = x3;
      cy = y3;
    } else {
      i++;
    }
  }
  return out;
}

function flattenOpentype(commands, steps = 32) {
  const out = [];
  let cx = 0;
  let cy = 0;
  for (const c of commands) {
    if (c.type === 'M') {
      cx = c.x;
      cy = -c.y;
      out.push({ x: cx, y: cy });
    } else if (c.type === 'L') {
      const nx = c.x;
      const ny = -c.y;
      for (let s = 1; s <= steps; s++) {
        const tt = s / steps;
        out.push({ x: cx + (nx - cx) * tt, y: cy + (ny - cy) * tt });
      }
      cx = nx;
      cy = ny;
    } else if (c.type === 'Q') {
      const x1 = c.x1;
      const y1 = -c.y1;
      const x2 = c.x;
      const y2 = -c.y;
      for (let s = 1; s <= steps; s++) {
        const tt = s / steps;
        const u = 1 - tt;
        out.push({
          x: u * u * cx + 2 * u * tt * x1 + tt * tt * x2,
          y: u * u * cy + 2 * u * tt * y1 + tt * tt * y2,
        });
      }
      cx = x2;
      cy = y2;
    } else if (c.type === 'C') {
      const x1 = c.x1;
      const y1 = -c.y1;
      const x2 = c.x2;
      const y2 = -c.y2;
      const x3 = c.x;
      const y3 = -c.y;
      for (let s = 1; s <= steps; s++) {
        const tt = s / steps;
        const u = 1 - tt;
        out.push({
          x: u ** 3 * cx + 3 * u ** 2 * tt * x1 + 3 * u * tt ** 2 * x2 + tt ** 3 * x3,
          y: u ** 3 * cy + 3 * u ** 2 * tt * y1 + 3 * u * tt ** 2 * y2 + tt ** 3 * y3,
        });
      }
      cx = x3;
      cy = y3;
    }
  }
  return out;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestDist(p, others) {
  let min = Infinity;
  for (const o of others) min = Math.min(min, dist(p, o));
  return min;
}

function hausdorff(a, b) {
  let max = 0;
  for (const p of a) max = Math.max(max, nearestDist(p, b));
  return max;
}

const packPoly = flattenSvgPath(glyph.path);
const otPoly = flattenOpentype(otPath.commands);
const haus = Math.max(hausdorff(packPoly, otPoly), hausdorff(otPoly, packPoly));

console.log(`Glyph ${hexKey} (${char}) font_used=${glyph.font_used}`);
console.log(`TTF: ${ttfPath}`);
console.log(`advance pack=${glyph.advance} font=${otGlyph.advanceWidth}`);
console.log(`bbox pack=${JSON.stringify(glyph.bbox)} font=[${otGlyph.xMin},${otGlyph.yMin},${otGlyph.xMax},${otGlyph.yMax}]`);
console.log(`path d-strings equal: ${glyph.path === otPath.toPathData()}`);
console.log(`hausdorff (curve samples): ${haus.toFixed(3)} font units`);

const THRESH = 2;
const ok =
  glyph.advance === otGlyph.advanceWidth &&
  glyph.bbox[0] === otGlyph.xMin &&
  glyph.bbox[1] === otGlyph.yMin &&
  glyph.bbox[2] === otGlyph.xMax &&
  glyph.bbox[3] === otGlyph.yMax &&
  haus <= THRESH;

console.log(ok ? 'VERDICT: matches source font (within 2 units)' : 'VERDICT: does NOT match source font');
