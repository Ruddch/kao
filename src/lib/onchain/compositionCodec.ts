export const ANIM_SYMBOL_SENTINEL = 0xfffe;
export const MAX_CLUSTERS = 20;
export const MAX_MARKS = 4;
export const MAX_THEME_ID = 3;
export const MAX_LAYOUT_ALIGN = 2;
export const LAYOUT_ALIGN_CENTER = 1;

export interface GlyphSlot {
  frameA: number;
  frameB: number;
}

export interface OnchainCluster {
  base: GlyphSlot;
  marks: GlyphSlot[];
}

export function isAnimated(slot: GlyphSlot): boolean {
  return slot.frameB !== 0;
}

function readUint16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function writeUint16(parts: number[], value: number): void {
  parts.push((value >> 8) & 0xff, value & 0xff);
}

function readSlot(bytes: Uint8Array, offset: number): { slot: GlyphSlot; nextOffset: number } {
  const word = readUint16(bytes, offset);
  if (word === ANIM_SYMBOL_SENTINEL) {
    const frameA = readUint16(bytes, offset + 2);
    const frameB = readUint16(bytes, offset + 4);
    return { slot: { frameA, frameB }, nextOffset: offset + 6 };
  }
  if (word === 0xfffd || word === 0xfffc) {
    throw new Error('UnsupportedAnimationMode');
  }
  if (word === 0) {
    throw new Error('InvalidComposition');
  }
  return { slot: { frameA: word, frameB: 0 }, nextOffset: offset + 2 };
}

function writeSlot(parts: number[], slot: GlyphSlot): void {
  if (isAnimated(slot)) {
    writeUint16(parts, ANIM_SYMBOL_SENTINEL);
    writeUint16(parts, slot.frameA);
    writeUint16(parts, slot.frameB);
  } else {
    writeUint16(parts, slot.frameA);
  }
}

export function decodeComposition(bytes: Uint8Array): {
  clusters: OnchainCluster[];
  themeId: number;
  layoutAlign: number;
} {
  if (bytes.length < 2) throw new Error('InvalidComposition');

  const clusterCount = bytes[0];
  if (clusterCount === 0 || clusterCount > MAX_CLUSTERS) {
    throw new Error('MaxClustersExceeded');
  }

  const clusters: OnchainCluster[] = [];
  let offset = 1;

  for (let i = 0; i < clusterCount; i++) {
    const { slot: base, nextOffset: afterBase } = readSlot(bytes, offset);
    offset = afterBase;
    if (offset >= bytes.length) throw new Error('InvalidComposition');

    const markCount = bytes[offset++];
    if (markCount > MAX_MARKS) throw new Error('TooManyMarks');

    const marks: GlyphSlot[] = [];
    for (let m = 0; m < markCount; m++) {
      const { slot, nextOffset } = readSlot(bytes, offset);
      marks.push(slot);
      offset = nextOffset;
    }
    clusters.push({ base, marks });
  }

  if (offset + 1 !== bytes.length) throw new Error('InvalidComposition');

  const flags = bytes[offset];
  const themeId = flags & 0x03;
  const layoutAlign = (flags >> 2) & 0x03;
  if (themeId > MAX_THEME_ID) throw new Error('InvalidThemeId');
  if (layoutAlign > MAX_LAYOUT_ALIGN) throw new Error('InvalidLayoutAlign');

  return { clusters, themeId, layoutAlign };
}

export function encodeComposition(
  clusters: OnchainCluster[],
  themeId: number,
  layoutAlign = LAYOUT_ALIGN_CENTER,
): Uint8Array {
  if (clusters.length === 0 || clusters.length > MAX_CLUSTERS) {
    throw new Error('MaxClustersExceeded');
  }

  const parts: number[] = [clusters.length];
  for (const cluster of clusters) {
    writeSlot(parts, cluster.base);
    if (cluster.marks.length > MAX_MARKS) throw new Error('TooManyMarks');
    parts.push(cluster.marks.length);
    for (const mark of cluster.marks) {
      writeSlot(parts, mark);
    }
  }

  const flags = (themeId & 0x03) | ((layoutAlign & 0x03) << 2);
  parts.push(flags);
  return new Uint8Array(parts);
}

export function compositionToHex(bytes: Uint8Array): `0x${string}` {
  return `0x${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function hexToComposition(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function symbolGlyphIds(clusters: OnchainCluster[]): number[] {
  const ids: number[] = [];
  for (const cluster of clusters) {
    ids.push(cluster.base.frameA);
    for (const mark of cluster.marks) {
      ids.push(mark.frameA);
    }
  }
  return ids;
}

export function symbolCount(clusters: OnchainCluster[]): number {
  let total = 0;
  for (const cluster of clusters) {
    total += 1 + cluster.marks.length;
  }
  return total;
}

export function animatedSymbolCount(clusters: OnchainCluster[]): number {
  let total = 0;
  for (const cluster of clusters) {
    if (isAnimated(cluster.base)) total++;
    for (const mark of cluster.marks) {
      if (isAnimated(mark)) total++;
    }
  }
  return total;
}

export function exceedsMaxMarks(clusters: OnchainCluster[]): boolean {
  return clusters.some((cluster) => cluster.marks.length > MAX_MARKS);
}

export function uniqueGlyphIds(clusters: OnchainCluster[]): number[] {
  const seen = new Set<number>();
  const ids: number[] = [];
  const pushSlot = (slot: GlyphSlot) => {
    if (!seen.has(slot.frameA)) {
      seen.add(slot.frameA);
      ids.push(slot.frameA);
    }
    if (isAnimated(slot) && !seen.has(slot.frameB)) {
      seen.add(slot.frameB);
      ids.push(slot.frameB);
    }
  };
  for (const cluster of clusters) {
    pushSlot(cluster.base);
    for (const mark of cluster.marks) pushSlot(mark);
  }
  return ids;
}
