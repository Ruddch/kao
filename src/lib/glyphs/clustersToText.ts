import type { Document, GlyphPack } from './types';

export function clustersToText(clusters: Document, pack: GlyphPack): string {
  return clusters
    .map((cluster) => {
      const base = pack.symbols[cluster.base];
      const baseChar = base?.char ?? '';
      const marks = cluster.marks
        .map((key) => pack.symbols[key]?.char ?? '')
        .join('');
      return baseChar + marks;
    })
    .join('');
}

export function clampDocumentText(text: string, max = 20): string {
  return [...text].slice(0, max).join('');
}
