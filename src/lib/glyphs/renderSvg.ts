import { type CSSProperties, type ReactNode, createElement } from 'react';
import type { Document, GlyphPack, GlyphSymbol } from './types';

export interface LayoutMetrics {
  width: number;
  height: number;
  minY: number;
  maxY: number;
  scale: number;
}

const DEFAULT_SCALE = 0.05;
const BASELINE_Y = 0;

export function computeTotalAdvance(clusters: Document, pack: GlyphPack): number {
  return clusters.reduce((sum, cluster) => {
    const base = pack.symbols[cluster.base];
    return sum + (base?.advance ?? 0);
  }, 0);
}

export function computeFitScale(
  clusters: Document,
  pack: GlyphPack,
  targetWidthPx: number,
): number {
  const totalAdvance = computeTotalAdvance(clusters, pack);
  if (totalAdvance <= 0 || targetWidthPx <= 0) return DEFAULT_SCALE;
  return targetWidthPx / totalAdvance;
}

export function computeLayout(
  clusters: Document,
  pack: GlyphPack,
  scale = DEFAULT_SCALE,
): LayoutMetrics {
  let x = 0;
  let minY = 0;
  let maxY = 0;

  for (const cluster of clusters) {
    const base = pack.symbols[cluster.base];
    if (!base) continue;

    const glyphs: GlyphSymbol[] = [base];
    for (const markKey of cluster.marks) {
      const mark = pack.symbols[markKey];
      if (mark) glyphs.push(mark);
    }

    for (const glyph of glyphs) {
      const [, y0, , y1] = glyph.bbox;
      minY = Math.min(minY, y0 * scale);
      maxY = Math.max(maxY, y1 * scale);
    }

    x += base.advance * scale;
  }

  const height = Math.max(maxY - minY, 40);
  return { width: Math.max(x, 1), height, minY, maxY, scale };
}

export function getGlyphViewBox(glyph: GlyphSymbol, padding = 40): string {
  const [x0, y0, x1, y1] = glyph.bbox;
  const w = Math.max(x1 - x0, 1);
  const h = Math.max(y1 - y0, 1);
  return `${x0 - padding} ${-y1 - padding} ${w + padding * 2} ${h + padding * 2}`;
}

interface RenderPathsOptions {
  clusters: Document;
  pack: GlyphPack;
  scale?: number;
  x0?: number;
  y0?: number;
}

export function renderGlyphPaths({
  clusters,
  pack,
  scale = DEFAULT_SCALE,
  x0 = 0,
  y0 = BASELINE_Y,
}: RenderPathsOptions): { paths: ReactNode[]; width: number } {
  let x = x0;
  const paths: ReactNode[] = [];

  clusters.forEach((cluster, clusterIndex) => {
    const base = pack.symbols[cluster.base];
    if (!base) return;

    const drawGlyph = (glyph: GlyphSymbol, suffix: string) => {
      if (!glyph.path) return;
      paths.push(
        createElement('path', {
          key: `${clusterIndex}-${suffix}`,
          d: glyph.path,
          fill: 'currentColor',
          transform: `translate(${x},${y0}) scale(${scale},${-scale})`,
        }),
      );
    };

    drawGlyph(base, 'base');
    cluster.marks.forEach((markKey, markIndex) => {
      const mark = pack.symbols[markKey];
      if (mark) drawGlyph(mark, `mark-${markIndex}`);
    });

    x += base.advance * scale;
  });

  return { paths, width: x };
}

export function getSvgViewBox(metrics: LayoutMetrics, padding = 20): string {
  const { width, minY, maxY } = metrics;
  const h = maxY - minY;
  return `${-padding} ${minY - padding} ${width + padding * 2} ${h + padding * 2}`;
}

export function getSvgStyle(): CSSProperties {
  return {
    width: '100%',
    height: 'auto',
    maxHeight: '120px',
    display: 'block',
    overflow: 'visible',
  };
}
