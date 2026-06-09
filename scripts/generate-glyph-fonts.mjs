import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pack = JSON.parse(
  fs.readFileSync(path.join(root, 'public/glyphs/editor_glyph_pack.json'), 'utf8'),
);

const fonts = [...new Set(Object.values(pack.symbols).map((s) => s.font_used))].sort();

const SPECIAL_GF = {
  NotoSansCJKsc: 'Noto Sans SC',
  NotoSansOriya: 'Noto Sans Oriya',
  NotoSansSymbols: 'Noto Sans Symbols 2',
  NotoSansSymbols2: 'Noto Sans Symbols 2',
};

const SPECIAL_CSS = {
  NotoSansCJKsc: "'Noto Sans SC', 'Noto Sans', sans-serif",
  NotoSansSymbols: "'Noto Sans Symbols 2', sans-serif",
  NotoSansSymbols2: "'Noto Sans Symbols 2', sans-serif",
  NotoSansOriya: "'Noto Sans Oriya', 'Noto Sans', sans-serif",
  custom_scan_lines: 'var(--font-kao)',
  editor_space: 'inherit',
};

function normalize(fontUsed) {
  return fontUsed.replace(/-Regular$/, '');
}

function splitCamelCase(value) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function notoFamily(prefix, tail) {
  if (!tail) return prefix;
  return `${prefix} ${splitCamelCase(tail)}`;
}

function toCssFamily(fontUsed) {
  const key = normalize(fontUsed);
  if (SPECIAL_CSS[key]) return SPECIAL_CSS[key];
  if (key === 'NotoEmoji') return "'Noto Emoji', sans-serif";
  if (key === 'NotoMusic') return "'Noto Music', sans-serif";
  if (key === 'NotoSans') return "'Noto Sans', sans-serif";
  if (key.startsWith('NotoSans')) {
    const family = notoFamily('Noto Sans', key.slice('NotoSans'.length));
    return `'${family}', 'Noto Sans', sans-serif`;
  }
  if (key.startsWith('NotoSerif')) {
    const family = notoFamily('Noto Serif', key.slice('NotoSerif'.length));
    return `'${family}', 'Noto Serif', serif`;
  }
  return 'var(--font-kao)';
}

function toGoogleFamily(fontUsed) {
  const key = normalize(fontUsed);
  if (key === 'custom_scan_lines' || key === 'editor_space') return null;
  if (SPECIAL_GF[key]) return SPECIAL_GF[key];
  if (key === 'NotoEmoji') return 'Noto Emoji';
  if (key === 'NotoMusic') return 'Noto Music';
  if (key === 'NotoSans') return 'Noto Sans';
  if (key.startsWith('NotoSans')) return notoFamily('Noto Sans', key.slice('NotoSans'.length));
  if (key.startsWith('NotoSerif')) return notoFamily('Noto Serif', key.slice('NotoSerif'.length));
  return null;
}

const mapLines = fonts
  .map((f) => `  ${JSON.stringify(normalize(f))}: ${JSON.stringify(toCssFamily(f))},`)
  .join('\n');

const fontMapTs = `/** Auto-generated from editor_glyph_pack.json — run: node scripts/generate-glyph-fonts.mjs */
const FONT_MAP: Record<string, string> = {
${mapLines}
};

export function getFontFamily(fontUsed: string): string {
  const key = fontUsed.replace(/-Regular$/, '');
  return FONT_MAP[key] ?? 'var(--font-kao)';
}
`;

const gfFamilies = [...new Set(fonts.map(toGoogleFamily).filter(Boolean))].sort();
const gfParams = gfFamilies.map((name) => {
  const enc = name.replace(/ /g, '+');
  if (['Noto+Sans', 'Noto+Sans+JP', 'Noto+Sans+KR', 'Noto+Sans+SC', 'Noto+Sans+Math', 'Noto+Sans+Symbols+2'].includes(enc)) {
    return `family=${enc}:wght@400;700`;
  }
  return `family=${enc}`;
});

const chunks = [];
for (let i = 0; i < gfParams.length; i += 25) {
  chunks.push(`${gfParams.slice(i, i + 25).join('&')}&display=swap`);
}

const css = `/* Auto-generated — run: node scripts/generate-glyph-fonts.mjs */
${chunks.map((chunk) => `@import url('https://fonts.googleapis.com/css2?${chunk}');`).join('\n')}
`;

fs.writeFileSync(path.join(root, 'src/lib/glyphs/fontMap.ts'), fontMapTs);
fs.mkdirSync(path.join(root, 'public/fonts'), { recursive: true });
fs.writeFileSync(path.join(root, 'public/fonts/glyph-fonts.css'), css);

console.log(`Generated ${fonts.length} font mappings, ${gfFamilies.length} Google Font families in ${chunks.length} chunks.`);
