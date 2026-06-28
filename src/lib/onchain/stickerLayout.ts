import type { Document, GlyphPack, GlyphSymbol } from '../glyphs/types';
import { documentLayoutVariant, hasDocumentAnimation } from '../glyphs/slotAnimation';
import type { OnchainLayoutConstants } from './glyphIndex';
import { LAYOUT_ALIGN_CENTER } from './compositionCodec';

/** Layout + typography metrics aligned with KaomojiSVGRenderer. */
export interface StickerLayout {
  canvas: number;
  themeHex: string;
  cardW: number;
  cardH: number;
  cardX: number;
  cardY: number;
  shadowX: number;
  shadowY: number;
  fitBps: number;
  /** CSS font-size in canvas units (1000 UPEM × path scale). */
  fontSize: number;
  contentW: number;
  contentH: number;
  isEmpty: boolean;
}

function truncDiv(numerator: number, denominator: number): number {
  if (numerator >= 0) return Math.trunc(numerator / denominator);
  return -Math.trunc(-numerator / denominator);
}

function targetCardWidth(layout: OnchainLayoutConstants): number {
  return truncDiv(layout.canvas * layout.cardWidthBps, layout.fitScaleBps);
}

function bboxAt(
  bbox: GlyphSymbol['bbox'],
  x: number,
  y0: number,
  glyphScale: number,
): [number, number, number, number] {
  const bx0 = x + truncDiv(bbox[0] * glyphScale, 1000);
  const by0 = y0 - truncDiv(bbox[3] * glyphScale, 1000);
  const bx1 = x + truncDiv(bbox[2] * glyphScale, 1000);
  const by1 = y0 - truncDiv(bbox[1] * glyphScale, 1000);
  return [
    Math.min(bx0, bx1),
    Math.min(by0, by1),
    Math.max(bx0, bx1),
    Math.max(by0, by1),
  ];
}

function measureClusterBounds(
  cluster: Document[number],
  pack: GlyphPack,
  x: number,
  y0: number,
  glyphScale: number,
): [number, number, number, number] {
  const base = pack.symbols[cluster.base];
  if (!base) return [x, y0, x, y0];

  let [cMinX, cMinY, cMaxX, cMaxY] = bboxAt(base.bbox, x, y0, glyphScale);
  for (const markKey of cluster.marks) {
    const mark = pack.symbols[markKey];
    if (!mark) continue;
    const [mMinX, mMinY, mMaxX, mMaxY] = bboxAt(mark.bbox, x, y0, glyphScale);
    cMinX = Math.min(cMinX, mMinX);
    cMinY = Math.min(cMinY, mMinY);
    cMaxX = Math.max(cMaxX, mMaxX);
    cMaxY = Math.max(cMaxY, mMaxY);
  }
  return [cMinX, cMinY, cMaxX, cMaxY];
}

export function measureCompositionBounds(
  clusters: Document,
  pack: GlyphPack,
  glyphScale: number,
): [number, number, number, number] {
  const y0 = 0;
  let x = 0;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const cluster of clusters) {
    const base = pack.symbols[cluster.base];
    if (!base) continue;

    const [cMinX, cMinY, cMaxX, cMaxY] = measureClusterBounds(cluster, pack, x, y0, glyphScale);
    x += truncDiv(base.advance * glyphScale, 1000);
    minX = Math.min(minX, cMinX);
    minY = Math.min(minY, cMinY);
    maxX = Math.max(maxX, cMaxX);
    maxY = Math.max(maxY, cMaxY);
  }

  if (!Number.isFinite(minX)) return [0, 0, 200, 120];
  return [minX, minY, maxX, maxY];
}

function unionBounds(
  a: [number, number, number, number],
  b: [number, number, number, number],
): [number, number, number, number] {
  return [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.max(a[3], b[3]),
  ];
}

export function layoutAlignOffset(
  clusters: Document,
  pack: GlyphPack,
  glyphScale: number,
  useSecondFrame: boolean,
  cardMinX: number,
  cardMaxX: number,
  layoutAlign: number,
): number {
  if (layoutAlign === 0) return 0;

  const variant = useSecondFrame ? documentLayoutVariant(clusters, true) : clusters;
  const [vMinX, , vMaxX] = measureCompositionBounds(variant, pack, glyphScale);
  const cardW = cardMaxX - cardMinX;
  const variantW = vMaxX - vMinX;
  if (variantW >= cardW) return 0;

  const gap = cardW - variantW;
  const base = cardMinX - vMinX;
  if (layoutAlign === LAYOUT_ALIGN_CENTER) return base + truncDiv(gap, 2);
  return base + gap;
}

function measureBoundsForSticker(
  clusters: Document,
  pack: GlyphPack,
  glyphScale: number,
): [number, number, number, number] {
  const boundsA = measureCompositionBounds(clusters, pack, glyphScale);
  if (!hasDocumentAnimation(clusters)) return boundsA;
  const boundsB = measureCompositionBounds(documentLayoutVariant(clusters, true), pack, glyphScale);
  return unionBounds(boundsA, boundsB);
}

function emptyPlaceholderLayout(
  layout: OnchainLayoutConstants,
): Omit<StickerLayout, 'themeHex'> & { shiftX: number; shiftY: number } {
  const cardW0 = 120;
  const cardH0 = 68;
  const targetW = targetCardWidth(layout);
  const fitBps = truncDiv(targetW * layout.fitScaleBps, cardW0);
  const finalCardW = truncDiv(cardW0 * fitBps, layout.fitScaleBps);
  const finalCardH = truncDiv(cardH0 * fitBps, layout.fitScaleBps);
  const cardX = truncDiv(layout.canvas - finalCardW - layout.shadowDx, 2);
  const cardY = truncDiv(layout.canvas - finalCardH - layout.shadowDy, 2);

  return {
    canvas: layout.canvas,
    cardW: finalCardW,
    cardH: finalCardH,
    cardX,
    cardY,
    shadowX: cardX + layout.shadowDx,
    shadowY: cardY + layout.shadowDy,
    fitBps,
    fontSize: truncDiv(layout.glyphScale * fitBps * 1000, layout.pathScaleDenom),
    contentW: 0,
    contentH: 0,
    isEmpty: true,
    shiftX: 0,
    shiftY: 0,
  };
}

export function computeStickerLayout(
  clusters: Document,
  pack: GlyphPack,
  layout: OnchainLayoutConstants,
  themeId: number,
): StickerLayout & { shiftX: number; shiftY: number } {
  const theme = layout.themes.find((t) => t.id === themeId) ?? layout.themes[0];
  const { glyphScale, fitScaleBps, pathScaleDenom, cardPadX, cardPadY, shadowDx, shadowDy, canvas } =
    layout;

  if (clusters.length === 0) {
    return { themeHex: theme.hex, ...emptyPlaceholderLayout(layout) };
  }

  const [minX, minY, maxX, maxY] = measureBoundsForSticker(clusters, pack, glyphScale);
  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const cardW0 = contentW + 2 * cardPadX;
  const cardH0 = contentH + 2 * cardPadY;
  const targetW = targetCardWidth(layout);

  let fitBps = truncDiv(targetW * fitScaleBps, cardW0);
  let finalCardH = truncDiv(cardH0 * fitBps, fitScaleBps);
  if (finalCardH + shadowDy > canvas) {
    const fitH = truncDiv((canvas - shadowDy) * fitScaleBps, cardH0);
    fitBps = Math.min(fitBps, fitH);
    finalCardH = truncDiv(cardH0 * fitBps, fitScaleBps);
  }

  const finalCardW = truncDiv(cardW0 * fitBps, fitScaleBps);
  const totalGroupW = finalCardW + shadowDx;
  const totalGroupH = finalCardH + shadowDy;
  const cardX = truncDiv(canvas - totalGroupW, 2);
  const cardY = truncDiv(canvas - totalGroupH, 2);
  const shiftX = cardPadX - minX;
  const shiftY = cardPadY - minY;
  const fontSize = truncDiv(glyphScale * fitBps * 1000, pathScaleDenom);

  return {
    canvas,
    themeHex: theme.hex,
    cardW: finalCardW,
    cardH: finalCardH,
    cardX,
    cardY,
    shadowX: cardX + shadowDx,
    shadowY: cardY + shadowDy,
    fitBps,
    fontSize,
    contentW,
    contentH,
    isEmpty: false,
    shiftX,
    shiftY,
  };
}

export function pathScaleFromFitBps(
  layout: OnchainLayoutConstants,
  fitBps: number,
): number {
  return (layout.glyphScale * fitBps) / layout.pathScaleDenom;
}

export function ratioToScaleString(numerator: number, denominator: number): string {
  const whole = truncDiv(numerator, denominator);
  const frac = Math.abs(numerator % denominator);
  if (frac === 0) return String(whole);

  const fracDigits = 6;
  const fracStr = String(frac).padStart(fracDigits, '0').replace(/0+$/, '');
  if (whole === 0) return fracStr.length > 0 ? `0.${fracStr}` : '0';
  return fracStr.length > 0 ? `${whole}.${fracStr}` : String(whole);
}
