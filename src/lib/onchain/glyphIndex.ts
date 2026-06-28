import type { Document } from '../glyphs/types';
import {
  decodeComposition,
  encodeComposition,
  LAYOUT_ALIGN_CENTER,
  type OnchainCluster,
} from './compositionCodec';

const ONCHAIN_BASE = `${import.meta.env.BASE_URL}onchain`.replace(/\/?$/, '');

export interface GlyphIndex {
  version: number;
  glyphCount: number;
  byKey: Record<string, number>;
  byGlyphId: Record<string, string>;
}

export interface MerklePackMeta {
  packVersion: number;
  glyphCount: number;
  packRoot: string;
  warmupGlyphIds: number[];
  proofs: Record<string, string[]>;
}

export interface OnchainLayoutConstants {
  canvas: number;
  cardPadX: number;
  cardPadY: number;
  cardWidthBps: number;
  shadowDx: number;
  shadowDy: number;
  stroke: number;
  cardFill: string;
  cardStroke: string;
  shadowFill: string;
  glyphFill: string;
  glyphScale: number;
  fitScaleBps: number;
  pathScaleDenom: number;
  themes: Array<{ id: number; name: string; hex: string; oklch?: string }>;
}

export type LayoutConstants = OnchainLayoutConstants;

let indexPromise: Promise<GlyphIndex> | null = null;
let glyphDataPromise: Promise<Record<string, string>> | null = null;
let merklePromise: Promise<MerklePackMeta> | null = null;
let layoutPromise: Promise<LayoutConstants> | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export function loadGlyphIndex(): Promise<GlyphIndex> {
  if (!indexPromise) {
    indexPromise = fetchJson(`${ONCHAIN_BASE}/glyph_index.json`);
  }
  return indexPromise;
}

export function loadGlyphDataMap(): Promise<Record<string, string>> {
  if (!glyphDataPromise) {
    glyphDataPromise = fetchJson(`${ONCHAIN_BASE}/glyph_data.json`);
  }
  return glyphDataPromise;
}

export function loadMerklePack(): Promise<MerklePackMeta> {
  if (!merklePromise) {
    merklePromise = fetchJson(`${ONCHAIN_BASE}/merkle_pack.json`);
  }
  return merklePromise;
}

export function loadLayoutConstants(): Promise<LayoutConstants> {
  if (!layoutPromise) {
    layoutPromise = fetchJson(`${ONCHAIN_BASE}/layout_constants.json`);
  }
  return layoutPromise;
}

export async function keyToGlyphId(key: string): Promise<number | null> {
  const index = await loadGlyphIndex();
  return index.byKey[key] ?? null;
}

export async function glyphIdToKey(glyphId: number): Promise<string | null> {
  const index = await loadGlyphIndex();
  return index.byGlyphId[String(glyphId)] ?? null;
}

export async function documentToOnchainClusters(
  clusters: Document,
): Promise<OnchainCluster[]> {
  const index = await loadGlyphIndex();
  const out: OnchainCluster[] = [];

  for (const cluster of clusters) {
    const baseId = index.byKey[cluster.base];
    if (baseId === undefined) throw new Error(`Missing glyphId for ${cluster.base}`);
    let baseFrameB = 0;
    if (cluster.baseAlt) {
      const altId = index.byKey[cluster.baseAlt];
      if (altId === undefined) throw new Error(`Missing glyphId for ${cluster.baseAlt}`);
      baseFrameB = altId;
    }

    const marks: OnchainCluster['marks'] = [];
    for (let i = 0; i < cluster.marks.length; i++) {
      const markKey = cluster.marks[i];
      const markId = index.byKey[markKey];
      if (markId === undefined) throw new Error(`Missing glyphId for ${markKey}`);
      let markFrameB = 0;
      const markAlt = cluster.markAlts?.[i];
      if (markAlt) {
        const altId = index.byKey[markAlt];
        if (altId === undefined) throw new Error(`Missing glyphId for ${markAlt}`);
        markFrameB = altId;
      }
      marks.push({ frameA: markId, frameB: markFrameB });
    }
    out.push({ base: { frameA: baseId, frameB: baseFrameB }, marks });
  }
  return out;
}

export async function onchainClustersToDocument(
  clusters: OnchainCluster[],
): Promise<Document> {
  const index = await loadGlyphIndex();
  const out: Document = [];

  for (const cluster of clusters) {
    const baseKey = index.byGlyphId[String(cluster.base.frameA)];
    if (!baseKey) throw new Error(`Missing key for glyph ${cluster.base.frameA}`);

    const marks: string[] = [];
    const markAlts: (string | undefined)[] = [];
    for (const mark of cluster.marks) {
      const markKey = index.byGlyphId[String(mark.frameA)];
      if (!markKey) throw new Error(`Missing key for glyph ${mark.frameA}`);
      marks.push(markKey);
      if (mark.frameB !== 0) {
        const altKey = index.byGlyphId[String(mark.frameB)];
        if (!altKey) throw new Error(`Missing key for glyph ${mark.frameB}`);
        markAlts.push(altKey);
      } else {
        markAlts.push(undefined);
      }
    }

    const docCluster: Document[number] = { base: baseKey, marks };
    if (cluster.base.frameB !== 0) {
      const baseAlt = index.byGlyphId[String(cluster.base.frameB)];
      if (!baseAlt) throw new Error(`Missing key for glyph ${cluster.base.frameB}`);
      docCluster.baseAlt = baseAlt;
    }
    if (markAlts.some(Boolean)) {
      docCluster.markAlts = markAlts;
    }
    out.push(docCluster);
  }
  return out;
}

export async function encodeDocument(
  clusters: Document,
  themeId: number,
  layoutAlign = LAYOUT_ALIGN_CENTER,
): Promise<Uint8Array> {
  const onchain = await documentToOnchainClusters(clusters);
  return encodeComposition(onchain, themeId, layoutAlign);
}

export async function decodeToDocument(bytes: Uint8Array): Promise<{
  clusters: Document;
  themeId: number;
  layoutAlign: number;
}> {
  const { clusters: onchain, themeId, layoutAlign } = decodeComposition(bytes);
  const clusters = await onchainClustersToDocument(onchain);
  return { clusters, themeId, layoutAlign };
}

export interface GlyphEntry {
  glyphId: number;
  glyphData: `0x${string}`;
  proof: `0x${string}`[];
}

export async function getGlyphEntry(glyphId: number): Promise<GlyphEntry | null> {
  const [dataMap, merkle] = await Promise.all([loadGlyphDataMap(), loadMerklePack()]);
  const glyphData = dataMap[String(glyphId)];
  const proof = merkle.proofs[String(glyphId)];
  if (!glyphData || !proof) return null;
  return {
    glyphId,
    glyphData: glyphData as `0x${string}`,
    proof: proof as `0x${string}`[],
  };
}

export async function buildGlyphsToCache(
  glyphIds: number[],
  cachedGlyphIds: Set<number>,
): Promise<GlyphEntry[]> {
  const unique = [...new Set(glyphIds)].filter((id) => !cachedGlyphIds.has(id));
  const entries: GlyphEntry[] = [];
  for (const glyphId of unique) {
    const entry = await getGlyphEntry(glyphId);
    if (entry) entries.push(entry);
  }
  return entries;
}
