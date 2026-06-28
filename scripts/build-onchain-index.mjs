import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const outDir = path.join(root, 'public/onchain');

fs.mkdirSync(outDir, { recursive: true });

const records = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'generated/glyph_records.json'), 'utf8'),
);
const merklePack = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'generated/merkle_pack.json'), 'utf8'),
);

const byKey = {};
const byGlyphId = {};
const glyphData = {};

for (const record of records) {
  byKey[record.key] = record.glyphId;
  byGlyphId[String(record.glyphId)] = record.key;
  glyphData[String(record.glyphId)] = record.glyphData;
}

fs.writeFileSync(
  path.join(outDir, 'glyph_index.json'),
  JSON.stringify({ version: 1, glyphCount: records.length, byKey, byGlyphId }),
);

fs.writeFileSync(path.join(outDir, 'glyph_data.json'), JSON.stringify(glyphData));

fs.writeFileSync(
  path.join(outDir, 'merkle_pack.json'),
  JSON.stringify({
    packVersion: merklePack.packVersion,
    glyphCount: merklePack.glyphCount,
    packRoot: merklePack.packRoot,
    warmupGlyphIds: merklePack.warmupGlyphIds,
    proofs: merklePack.proofs,
  }),
);

fs.copyFileSync(
  path.join(dataDir, 'layout_constants.json'),
  path.join(outDir, 'layout_constants.json'),
);

console.log(`Built onchain assets → ${outDir}`);
console.log(`  glyphs: ${records.length}`);
