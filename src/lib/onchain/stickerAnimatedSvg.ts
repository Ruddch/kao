import type { Document, GlyphPack, GlyphSymbol } from '../glyphs/types';
import { documentLayoutVariant, hasDocumentAnimation } from '../glyphs/slotAnimation';
import type { OnchainLayoutConstants } from './glyphIndex';
import {
  computeStickerLayout,
  layoutAlignOffset,
  measureCompositionBounds,
  ratioToScaleString,
} from './stickerLayout';

import { buildOnchainStickerSvg, stickerSvgToDataUrl } from './stickerSvg';

/** Matches KaomojiSVGRenderer.ANIM_DUR */
export const ONCHAIN_ANIM_DUR = '1.2s';

const ONCHAIN_ANIM_KEYTIMES = '0;0.49;0.5;0.99;1';
const ONCHAIN_ANIM_VALUES_A = '1;1;0;0;1';
const ONCHAIN_ANIM_VALUES_B = '0;0;1;1;0';

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

function renderDocumentPaths(
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

function renderStickerFrame(
  sticker: ReturnType<typeof computeStickerLayout>,
  layout: OnchainLayoutConstants,
  themeHex: string,
): string {
  const { canvas, cardW, cardH, cardX, cardY, shadowX, shadowY, isEmpty } = sticker;
  const { stroke, cardFill, cardStroke, shadowFill } = layout;

  if (isEmpty) {
    const textX = cardX + truncDiv(cardW, 2);
    const textY = cardY + truncDiv(cardH, 2) + 10;
    return `<rect width="${canvas}" height="${canvas}" fill="${themeHex}"/><rect x="${shadowX}" y="${shadowY}" width="${cardW}" height="${cardH}" fill="${shadowFill}"/><rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" fill="${cardFill}" stroke="${cardStroke}" stroke-width="${stroke}"/><text x="${textX}" y="${textY}" text-anchor="middle" font-size="36" font-family="sans-serif" fill="#999999">KAO</text>`;
  }

  return `<rect width="${canvas}" height="${canvas}" fill="${themeHex}"/><rect x="${shadowX}" y="${shadowY}" width="${cardW}" height="${cardH}" fill="${shadowFill}"/><rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" fill="${cardFill}" stroke="${cardStroke}" stroke-width="${stroke}"/>`;
}

function renderAnimationGroup(
  paths: string,
  startVisible: boolean,
): string {
  const opacity = startVisible ? '1' : '0';
  const values = startVisible ? ONCHAIN_ANIM_VALUES_A : ONCHAIN_ANIM_VALUES_B;
  return `<g opacity="${opacity}"><animate attributeName="opacity" values="${values}" keyTimes="${ONCHAIN_ANIM_KEYTIMES}" dur="${ONCHAIN_ANIM_DUR}" repeatCount="indefinite"/>${paths}</g>`;
}

/** On-chain animated sticker — two layout variants crossfading like KaomojiSVGRenderer.renderAnimated. */
export function buildOnchainAnimatedStickerSvg(
  clusters: Document,
  pack: GlyphPack,
  layout: OnchainLayoutConstants,
  themeId: number,
  layoutAlign: number,
): string {
  const sticker = computeStickerLayout(clusters, pack, layout, themeId);
  const {
    canvas,
    themeHex,
    cardX,
    cardY,
    fitBps,
    shiftX,
    shiftY,
    isEmpty,
  } = sticker;
  const { glyphFill, glyphScale } = layout;

  const frame = renderStickerFrame(sticker, layout, themeHex);
  if (isEmpty) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}">${frame}</svg>`;
  }

  const variantA = clusters;
  const variantB = documentLayoutVariant(clusters, true);

  const boundsA = measureCompositionBounds(clusters, pack, glyphScale);
  const boundsB = measureCompositionBounds(variantB, pack, glyphScale);
  const unionMinX = Math.min(boundsA[0], boundsB[0]);
  const unionMaxX = Math.max(boundsA[2], boundsB[2]);

  const alignA = layoutAlignOffset(clusters, pack, glyphScale, false, unionMinX, unionMaxX, layoutAlign);
  const alignB = layoutAlignOffset(clusters, pack, glyphScale, true, unionMinX, unionMaxX, layoutAlign);

  const pathsA = renderDocumentPaths(
    variantA,
    pack,
    cardX,
    cardY,
    shiftX + alignA,
    shiftY,
    fitBps,
    layout,
    glyphFill,
  );
  const pathsB = renderDocumentPaths(
    variantB,
    pack,
    cardX,
    cardY,
    shiftX + alignB,
    shiftY,
    fitBps,
    layout,
    glyphFill,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}">${frame}${renderAnimationGroup(pathsA, true)}${renderAnimationGroup(pathsB, false)}</svg>`;
}

/** Static or animated SVG — matches tokenURI image / animation_url rendering. */
export function buildOnchainPreviewSvg(
  clusters: Document,
  pack: GlyphPack,
  layout: OnchainLayoutConstants,
  themeId: number,
  layoutAlign: number,
): string {
  if (hasDocumentAnimation(clusters)) {
    return buildOnchainAnimatedStickerSvg(clusters, pack, layout, themeId, layoutAlign);
  }
  return buildOnchainStickerSvg(clusters, pack, layout, themeId);
}

export function buildAnimatedPreviewImage(
  clusters: Document,
  pack: GlyphPack,
  layout: OnchainLayoutConstants,
  themeId: number,
  layoutAlign: number,
): string {
  return stickerSvgToDataUrl(buildOnchainPreviewSvg(clusters, pack, layout, themeId, layoutAlign));
}

const ANIMATION_HTML_STYLE =
  'html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:transparent}svg{display:block;width:100%;height:100%}';

function wrapAnimatedSvgInHtml(svg: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${ANIMATION_HTML_STYLE}</style></head><body>${svg}</body></html>`;
}

function htmlToDataUrl(html: string): string {
  const bytes = new TextEncoder().encode(html);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:text/html;base64,${btoa(binary)}`;
}

/** tokenURI `animation_url` — HTML page with inline animated SVG (SMIL plays in iframe). */
export function buildAnimatedPreviewHtml(
  clusters: Document,
  pack: GlyphPack,
  layout: OnchainLayoutConstants,
  themeId: number,
  layoutAlign: number,
): string {
  const svg = buildOnchainAnimatedStickerSvg(clusters, pack, layout, themeId, layoutAlign);
  return htmlToDataUrl(wrapAnimatedSvgInHtml(svg));
}

export function isAnimatedPreviewHtml(url: string): boolean {
  return url.startsWith('data:text/html');
}

export { stickerSvgToDataUrl };
