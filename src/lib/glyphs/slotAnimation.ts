import { clustersToText } from './clustersToText';
import type { Cluster, Document, GlyphPack } from './types';

export type SlotKind = 'base' | 'mark';

export interface SlotRef {
  clusterIdx: number;
  kind: SlotKind;
  markIdx?: number;
}

export interface FlatSlot extends SlotRef {
  flatIndex: number;
  frameAKey: string;
  frameBKey?: string;
}

export function hasDocumentAnimation(clusters: Document): boolean {
  return animatedSymbolCountFromDocument(clusters) > 0;
}

/** Layout variant B: animated slots use frameB keys, others stay frameA. */
export function documentLayoutVariant(clusters: Document, useSecondFrame: boolean): Document {
  if (!useSecondFrame) return clusters;
  return clusters.map((cluster) => ({
    base: cluster.baseAlt ?? cluster.base,
    marks: cluster.marks.map((mark, i) => cluster.markAlts?.[i] ?? mark),
  }));
}

export function getFlatSlot(
  clusters: Document,
  flatIndex: number,
): FlatSlot | null {
  return flattenSlots(clusters).find((slot) => slot.flatIndex === flatIndex) ?? null;
}

export function flattenSlots(clusters: Document): FlatSlot[] {
  const out: FlatSlot[] = [];
  let flatIndex = 0;
  for (let clusterIdx = 0; clusterIdx < clusters.length; clusterIdx++) {
    const cluster = clusters[clusterIdx];
    out.push({
      flatIndex,
      clusterIdx,
      kind: 'base',
      frameAKey: cluster.base,
      frameBKey: cluster.baseAlt,
    });
    flatIndex++;
    for (let markIdx = 0; markIdx < cluster.marks.length; markIdx++) {
      out.push({
        flatIndex,
        clusterIdx,
        kind: 'mark',
        markIdx,
        frameAKey: cluster.marks[markIdx],
        frameBKey: cluster.markAlts?.[markIdx],
      });
      flatIndex++;
    }
  }
  return out;
}

export function isSlotAnimated(
  cluster: Cluster,
  kind: SlotKind,
  markIdx?: number,
): boolean {
  if (kind === 'base') return Boolean(cluster.baseAlt);
  if (markIdx === undefined) return false;
  return Boolean(cluster.markAlts?.[markIdx]);
}

export function getSlotAlt(cluster: Cluster, kind: SlotKind, markIdx?: number): string | undefined {
  if (kind === 'base') return cluster.baseAlt;
  if (markIdx === undefined) return undefined;
  return cluster.markAlts?.[markIdx];
}

export function animatedSymbolCountFromDocument(clusters: Document): number {
  let total = 0;
  for (const cluster of clusters) {
    if (cluster.baseAlt) total++;
    if (cluster.markAlts) {
      for (const alt of cluster.markAlts) {
        if (alt) total++;
      }
    }
  }
  return total;
}

export function validateAnimationSlot(
  pack: GlyphPack,
  frameAKey: string,
  frameBKey: string | undefined,
): { ok: true } | { ok: false; reason: string } {
  if (!frameBKey) return { ok: false, reason: 'No alternate frame selected' };
  if (frameBKey === frameAKey) return { ok: false, reason: 'Alternate must differ from current symbol' };
  if (!pack.symbols[frameAKey]) return { ok: false, reason: 'Invalid base symbol' };
  if (!pack.symbols[frameBKey]) return { ok: false, reason: 'Invalid alternate symbol' };
  return { ok: true };
}

export function slotRefFromFlatIndex(clusters: Document, flatIndex: number): SlotRef | null {
  const flat = flattenSlots(clusters);
  const slot = flat.find((s) => s.flatIndex === flatIndex);
  if (!slot) return null;
  return {
    clusterIdx: slot.clusterIdx,
    kind: slot.kind,
    markIdx: slot.markIdx,
  };
}

export function setSlotAlt(
  clusters: Document,
  ref: SlotRef,
  altKey: string | undefined,
): Document {
  return clusters.map((cluster, clusterIdx) => {
    if (clusterIdx !== ref.clusterIdx) return cluster;

    if (ref.kind === 'base') {
      if (!altKey) {
        const { baseAlt: _removed, ...rest } = cluster;
        return rest;
      }
      return { ...cluster, baseAlt: altKey };
    }

    const markIdx = ref.markIdx ?? 0;
    const markAlts = [...(cluster.markAlts ?? Array(cluster.marks.length).fill(undefined))];
    while (markAlts.length < cluster.marks.length) markAlts.push(undefined);

    if (!altKey) {
      markAlts[markIdx] = undefined;
      const hasAny = markAlts.some(Boolean);
      if (!hasAny) {
        const { markAlts: _removed, ...rest } = cluster;
        return rest;
      }
      return { ...cluster, markAlts };
    }

    markAlts[markIdx] = altKey;
    return { ...cluster, markAlts };
  });
}

/** Map caret offset in rendered text to flat slot index. */
export function caretOffsetToSlotIndex(
  caret: number,
  clusters: Document,
  pack: GlyphPack,
): number | null {
  const text = clustersToText(clusters, pack);
  const chars = [...text];
  const clamped = Math.min(Math.max(0, caret), chars.length);
  if (clamped === 0 && chars.length === 0) return null;

  let offset = 0;
  const flat = flattenSlots(clusters);
  for (const slot of flat) {
    const glyph = pack.symbols[slot.frameAKey];
    const charLen = glyph ? [...glyph.char].length : 1;
    if (clamped >= offset && clamped < offset + charLen) {
      return slot.flatIndex;
    }
    offset += charLen;
  }

  if (clamped === chars.length && flat.length > 0) {
    return flat[flat.length - 1].flatIndex;
  }
  return null;
}

/** Start caret offset for a flat slot index. */
export function slotIndexToCaretOffset(
  flatIndex: number,
  clusters: Document,
  pack: GlyphPack,
): number {
  const flat = flattenSlots(clusters);
  let offset = 0;
  for (const slot of flat) {
    if (slot.flatIndex === flatIndex) return offset;
    const glyph = pack.symbols[slot.frameAKey];
    offset += glyph ? [...glyph.char].length : 1;
  }
  return offset;
}

export function normalizeClusterAlts(cluster: Cluster): Cluster {
  if (!cluster.markAlts?.length) {
    const { markAlts: _removed, ...rest } = cluster;
    return rest;
  }
  const markAlts = cluster.markAlts.slice(0, cluster.marks.length);
  while (markAlts.length < cluster.marks.length) markAlts.push(undefined);
  const hasAny = markAlts.some(Boolean);
  if (!hasAny) {
    const { markAlts: _removed, ...rest } = cluster;
    return rest;
  }
  return { ...cluster, markAlts };
}

export function findInvalidAnimationSlots(
  clusters: Document,
  pack: GlyphPack,
): string | null {
  for (const cluster of clusters) {
    if (cluster.baseAlt) {
      const result = validateAnimationSlot(pack, cluster.base, cluster.baseAlt);
      if (!result.ok) return result.reason;
    }
    if (cluster.markAlts) {
      for (let i = 0; i < cluster.marks.length; i++) {
        const alt = cluster.markAlts[i];
        if (alt) {
          const result = validateAnimationSlot(pack, cluster.marks[i], alt);
          if (!result.ok) return result.reason;
        }
      }
    }
  }
  return null;
}
