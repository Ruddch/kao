import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const fixtures = JSON.parse(
  fs.readFileSync(path.join(root, 'data/generated/parity_fixtures.json'), 'utf8'),
);

function hexToBytes(hex) {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes) {
  return `0x${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

// Inline minimal encode/decode for test (mirrors compositionCodec.ts)
const ANIM = 0xfffe;

function readU16(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readSlot(bytes, offset) {
  const word = readU16(bytes, offset);
  if (word === ANIM) {
    return {
      slot: { frameA: readU16(bytes, offset + 2), frameB: readU16(bytes, offset + 4) },
      next: offset + 6,
    };
  }
  if (word === 0) throw new Error('InvalidComposition');
  return { slot: { frameA: word, frameB: 0 }, next: offset + 2 };
}

function decode(bytes) {
  const count = bytes[0];
  let offset = 1;
  const clusters = [];
  for (let i = 0; i < count; i++) {
    const base = readSlot(bytes, offset);
    offset = base.next;
    const markCount = bytes[offset++];
    const marks = [];
    for (let m = 0; m < markCount; m++) {
      const mark = readSlot(bytes, offset);
      marks.push(mark.slot);
      offset = mark.next;
    }
    clusters.push({ base: base.slot, marks });
  }
  const flags = bytes[offset];
  return { clusters, themeId: flags & 3, layoutAlign: (flags >> 2) & 3 };
}

function writeU16(parts, v) {
  parts.push((v >> 8) & 0xff, v & 0xff);
}

function writeSlot(parts, slot) {
  if (slot.frameB) {
    writeU16(parts, ANIM);
    writeU16(parts, slot.frameA);
    writeU16(parts, slot.frameB);
  } else {
    writeU16(parts, slot.frameA);
  }
}

function encode(clusters, themeId, layoutAlign = 1) {
  const parts = [clusters.length];
  for (const c of clusters) {
    writeSlot(parts, c.base);
    parts.push(c.marks.length);
    for (const m of c.marks) writeSlot(parts, m);
  }
  parts.push((themeId & 3) | ((layoutAlign & 3) << 2));
  return new Uint8Array(parts);
}

let failed = 0;
for (const c of fixtures.cases) {
  const bytes = hexToBytes(c.composition);
  const decoded = decode(bytes);
  const reencoded = encode(decoded.clusters, decoded.themeId, decoded.layoutAlign);
  const got = bytesToHex(reencoded);
  if (got.toLowerCase() !== c.composition.toLowerCase()) {
    console.error(`FAIL ${c.text}: expected ${c.composition}, got ${got}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`${failed}/${fixtures.cases.length} parity cases failed`);
  process.exit(1);
}

console.log(`All ${fixtures.cases.length} parity fixtures passed`);

// Animated slot encode/decode roundtrip (no SVG parity)
const animatedCases = [
  {
    label: 'single animated base',
    clusters: [{ base: { frameA: 8, frameB: 9 }, marks: [] }],
    themeId: 0,
    layoutAlign: 1,
    expected: '0x01fffe000800090004',
  },
  {
    label: 'static base + animated mark',
    clusters: [{ base: { frameA: 8, frameB: 0 }, marks: [{ frameA: 811, frameB: 812 }] }],
    themeId: 1,
    layoutAlign: 1,
    expected: '0x01000801fffe032b032c05',
  },
];

for (const c of animatedCases) {
  const bytes = encode(c.clusters, c.themeId, c.layoutAlign);
  const got = bytesToHex(bytes);
  if (got.toLowerCase() !== c.expected.toLowerCase()) {
    console.error(`FAIL animated ${c.label}: expected ${c.expected}, got ${got}`);
    process.exit(1);
  }
  const decoded = decode(bytes);
  const reencoded = encode(decoded.clusters, decoded.themeId, decoded.layoutAlign);
  if (bytesToHex(reencoded).toLowerCase() !== c.expected.toLowerCase()) {
    console.error(`FAIL animated reencode ${c.label}`);
    process.exit(1);
  }
}

console.log(`All ${animatedCases.length} animated roundtrip cases passed`);
