import type { Document, GlyphPack, GlyphSymbol } from '../glyphs/types';
import type { OnchainLayoutConstants } from './glyphIndex';
import { computeStickerLayout, ratioToScaleString } from './stickerLayout';

function truncDiv(numerator: number, denominator: number): number {
  if (numerator >= 0) return Math.trunc(numerator / denominator);
  return -Math.trunc(-numerator / denominator);
}

function pathElement(
  path: string,
  x: number,
  y0: number,
  cardX: number,
  cardY: number,
  shiftX: number,
  shiftY: number,
  fitBps: number,
  layout: OnchainLayoutConstants,
  fill: string,
): string {
  if (!path) return '';
  const translateX = cardX + truncDiv((x + shiftX) * fitBps, layout.fitScaleBps);
  const translateY = cardY + truncDiv((y0 + shiftY) * fitBps, layout.fitScaleBps);
  const scaleStr = ratioToScaleString(
    layout.glyphScale * fitBps,
    layout.pathScaleDenom,
  );
  return `<path transform="translate(${translateX},${translateY}) scale(${scaleStr},-${scaleStr})" d="${path}" fill="${fill}"/>`;
}

function renderPrimaryLayer(
  clusters: Document,
  pack: GlyphPack,
  cardX: number,
  cardY: number,
  shiftX: number,
  shiftY: number,
  fitBps: number,
  layout: OnchainLayoutConstants,
  fill: string,
): string {
  let x = 0;
  const y0 = 0;
  const paths: string[] = [];

  for (const cluster of clusters) {
    const base = pack.symbols[cluster.base];
    if (!base) continue;

    const draw = (glyph: GlyphSymbol) => {
      paths.push(
        pathElement(glyph.path, x, y0, cardX, cardY, shiftX, shiftY, fitBps, layout, fill),
      );
    };

    draw(base);
    for (const markKey of cluster.marks) {
      const mark = pack.symbols[markKey];
      if (mark) draw(mark);
    }
    x += truncDiv(base.advance * layout.glyphScale, 1000);
  }

  return paths.join('');
}

/** On-chain sticker SVG — same layout as KaomojiSVGRenderer / tokenURI image. */
export function buildOnchainStickerSvg(
  clusters: Document,
  pack: GlyphPack,
  layout: OnchainLayoutConstants,
  themeId: number,
): string {
  const sticker = computeStickerLayout(clusters, pack, layout, themeId);
  const {
    canvas,
    themeHex,
    cardW,
    cardH,
    cardX,
    cardY,
    shadowX,
    shadowY,
    fitBps,
    shiftX,
    shiftY,
    isEmpty,
  } = sticker;
  const { stroke, cardFill, cardStroke, shadowFill, glyphFill } = layout;

  const frame = `<rect width="${canvas}" height="${canvas}" fill="${themeHex}"/><rect x="${shadowX}" y="${shadowY}" width="${cardW}" height="${cardH}" fill="${shadowFill}"/><rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" fill="${cardFill}" stroke="${cardStroke}" stroke-width="${stroke}"/>`;

  if (isEmpty) {
    const textX = cardX + truncDiv(cardW, 2);
    const textY = cardY + truncDiv(cardH, 2) + 10;
    const placeholder = `<text x="${textX}" y="${textY}" text-anchor="middle" font-size="36" font-family="sans-serif" fill="#999999">KAO</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}">${frame}${placeholder}</svg>`;
  }

  const paths = renderPrimaryLayer(
    clusters,
    pack,
    cardX,
    cardY,
    shiftX,
    shiftY,
    fitBps,
    layout,
    glyphFill,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}">${frame}${paths}</svg>`;
}

export function stickerSvgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function buildDraftPreviewImage(
  clusters: Document,
  pack: GlyphPack,
  layout: OnchainLayoutConstants,
  themeId: number,
): string {
  return stickerSvgToDataUrl(buildOnchainStickerSvg(clusters, pack, layout, themeId));
}
