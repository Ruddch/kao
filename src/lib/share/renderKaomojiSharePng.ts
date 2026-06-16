import { getFontFamilyForChar } from '../glyphs/glyphForChar';
import type { GlyphLookup, GlyphPack } from '../glyphs/types';
import { getThemeColors, resolveFontFamily, type ThemeColors } from './getThemeColors';

const CANVAS_SIZE = 1080;
const STICKER_WIDTH_RATIO = 0.9;
const STICKER_BORDER_BASE = 4;
const STICKER_SHADOW_RATIO = 2;
const STICKER_DECO_REF_FOOTPRINT_W = 320;
const MAX_FONT_SIZE = 120;
const PAD_X_RATIO = 0.45;
const PAD_Y_RATIO = 0.35;

const TOP_LABEL = 'カオモジ';
const BOTTOM_LABEL = 'kaomoji.world';
const LOGO_STICKER_GAP = 60;
const URL_BOTTOM_INSET = 40;
const TOP_LABEL_FONT_SIZE = 78;
const TOP_LABEL_REF_FONT_SIZE = 52;
const TOP_LABEL_YELLOW_OFFSET = 3;
const TOP_LABEL_BLACK_OFFSET = 5;
const URL_BAR_FONT_SIZE = 26;
const URL_BAR_PAD_X = 28;
const URL_BAR_PAD_Y = 12;
const URL_BAR_SHADOW = 6;

interface CharMetric {
  char: string;
  font: string;
  width: number;
}

interface StickerDecoration {
  border: number;
  shadow: number;
}

interface StickerLayout {
  metrics: CharMetric[];
  fontSize: number;
  padX: number;
  padY: number;
  innerW: number;
  innerH: number;
  stickerW: number;
  stickerH: number;
  footprintW: number;
  footprintH: number;
  decoration: StickerDecoration;
}

interface UrlBarMetrics {
  width: number;
  height: number;
  footprintW: number;
  footprintH: number;
}

function buildCharMetrics(
  ctx: CanvasRenderingContext2D,
  chars: string[],
  fontSize: number,
  pack: GlyphPack,
  lookup: GlyphLookup,
  fontKao: string,
): CharMetric[] {
  return chars.map((char) => {
    const family = resolveFontFamily(getFontFamilyForChar(char, pack, lookup), fontKao);
    const font = `700 ${fontSize}px ${family}`;
    ctx.font = font;
    return { char, font, width: ctx.measureText(char).width };
  });
}

function measureTotalWidth(metrics: CharMetric[]): number {
  return metrics.reduce((sum, metric) => sum + metric.width, 0);
}

function getStickerDecoration(footprintW: number): StickerDecoration {
  const scale = footprintW / STICKER_DECO_REF_FOOTPRINT_W;
  const border = Math.max(STICKER_BORDER_BASE, Math.round(STICKER_BORDER_BASE * scale));
  return {
    border,
    shadow: border * STICKER_SHADOW_RATIO,
  };
}

function layoutStickerWithFontSize(
  ctx: CanvasRenderingContext2D,
  chars: string[],
  fontSize: number,
  pack: GlyphPack,
  lookup: GlyphLookup,
  fontKao: string,
  decoration: StickerDecoration,
): StickerLayout {
  const padX = fontSize * PAD_X_RATIO;
  const padY = fontSize * PAD_Y_RATIO;
  const metrics = buildCharMetrics(ctx, chars, fontSize, pack, lookup, fontKao);
  const textWidth = measureTotalWidth(metrics);
  const innerW = textWidth + padX * 2;
  const innerH = fontSize + padY * 2;
  const stickerW = innerW + decoration.border * 2;
  const stickerH = innerH + decoration.border * 2;

  return {
    metrics,
    fontSize,
    padX,
    padY,
    innerW,
    innerH,
    stickerW,
    stickerH,
    footprintW: stickerW + decoration.shadow,
    footprintH: stickerH + decoration.shadow,
    decoration,
  };
}

function layoutStickerForTargetWidth(
  ctx: CanvasRenderingContext2D,
  chars: string[],
  pack: GlyphPack,
  lookup: GlyphLookup,
  fontKao: string,
  targetFootprintW: number,
): StickerLayout {
  const decoration = getStickerDecoration(targetFootprintW);
  const charCount = Math.max(chars.length, 1);
  let fontSize = Math.min(MAX_FONT_SIZE, (700 * 0.85) / charCount);
  let layout = layoutStickerWithFontSize(ctx, chars, fontSize, pack, lookup, fontKao, decoration);

  for (let pass = 0; pass < 3; pass++) {
    if (layout.footprintW <= 0) break;
    fontSize *= targetFootprintW / layout.footprintW;
    layout = layoutStickerWithFontSize(ctx, chars, fontSize, pack, lookup, fontKao, decoration);
  }

  return layout;
}

function measureUrlBar(ctx: CanvasRenderingContext2D, colors: ThemeColors): UrlBarMetrics {
  const font = `700 ${URL_BAR_FONT_SIZE}px ${colors.fontMono}`;
  ctx.font = font;
  const textWidth = ctx.measureText(BOTTOM_LABEL).width;
  const width = textWidth + URL_BAR_PAD_X * 2;
  const height = URL_BAR_FONT_SIZE + URL_BAR_PAD_Y * 2;
  return {
    width,
    height,
    footprintW: width,
    footprintH: height + URL_BAR_SHADOW,
  };
}

function drawSticker(
  ctx: CanvasRenderingContext2D,
  layout: StickerLayout,
  colors: ThemeColors,
): void {
  const { metrics, fontSize, padX, padY, stickerW, stickerH, decoration } = layout;
  const { border, shadow } = decoration;

  ctx.fillStyle = colors.fg;
  ctx.fillRect(shadow, shadow, stickerW, stickerH);

  ctx.fillStyle = colors.surface;
  ctx.fillRect(0, 0, stickerW, stickerH);

  ctx.strokeStyle = colors.fg;
  ctx.lineWidth = border;
  ctx.strokeRect(border / 2, border / 2, stickerW - border, stickerH - border);

  ctx.fillStyle = colors.fg;
  ctx.textBaseline = 'alphabetic';

  let x = border + padX;
  const y = border + padY + fontSize * 0.85;

  for (const metric of metrics) {
    ctx.font = metric.font;
    ctx.fillText(metric.char, x, y);
    x += metric.width;
  }
}

function getBrandLabelOffsets(fontSize: number): { yellow: number; black: number } {
  const scale = fontSize / TOP_LABEL_REF_FONT_SIZE;
  return {
    yellow: Math.round(TOP_LABEL_YELLOW_OFFSET * scale),
    black: Math.round(TOP_LABEL_BLACK_OFFSET * scale),
  };
}

function measureBrandLabelHeight(fontSize: number): number {
  const { black } = getBrandLabelOffsets(fontSize);
  return fontSize * 1.05 + black;
}

function drawBrandLabel(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  colors: ThemeColors,
  fontSize = TOP_LABEL_FONT_SIZE,
): void {
  const font = `900 ${fontSize}px ${colors.fontDisplay}`;
  const { yellow, black } = getBrandLabelOffsets(fontSize);

  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Match banner CSS: color red, then yellow outline, then black outline.
  // text-shadow: 3px 3px 0 yellow, 5px 5px 0 fg — paint back to front.
  ctx.fillStyle = colors.fg;
  ctx.fillText(TOP_LABEL, centerX + black, y + black);

  ctx.fillStyle = colors.popYellow;
  ctx.fillText(TOP_LABEL, centerX + yellow, y + yellow);

  ctx.fillStyle = colors.popRed;
  ctx.fillText(TOP_LABEL, centerX, y);

  ctx.textAlign = 'left';
}

function drawUrlBar(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  colors: ThemeColors,
  metrics: UrlBarMetrics,
): void {
  const barX = centerX - metrics.width / 2;

  ctx.fillStyle = colors.popRed;
  ctx.fillRect(barX + URL_BAR_SHADOW, y + URL_BAR_SHADOW, metrics.width, metrics.height);

  ctx.fillStyle = colors.fg;
  ctx.fillRect(barX, y, metrics.width, metrics.height);

  const font = `700 ${URL_BAR_FONT_SIZE}px ${colors.fontMono}`;
  ctx.font = font;
  ctx.fillStyle = colors.popYellow;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(BOTTOM_LABEL, centerX, y + metrics.height / 2);
  ctx.textAlign = 'left';
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export PNG'));
    }, 'image/png');
  });
}

export async function renderKaomojiSharePng(
  text: string,
  pack: GlyphPack,
  lookup: GlyphLookup,
): Promise<Blob> {
  await document.fonts.ready;

  const colors = getThemeColors();
  const chars = [...text];
  const centerX = CANVAS_SIZE / 2;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported');

  ctx.fillStyle = colors.popYellow;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) throw new Error('Canvas is not supported');

  const targetFootprintW = CANVAS_SIZE * STICKER_WIDTH_RATIO;
  const layout = layoutStickerForTargetWidth(
    measureCtx,
    chars,
    pack,
    lookup,
    colors.fontKao,
    targetFootprintW,
  );
  const urlBarMetrics = measureUrlBar(measureCtx, colors);

  const stickerY = (CANVAS_SIZE - layout.footprintH) / 2;

  const brandLabelH = measureBrandLabelHeight(TOP_LABEL_FONT_SIZE);
  const brandY = stickerY - LOGO_STICKER_GAP - brandLabelH;
  const urlBarY = CANVAS_SIZE - URL_BOTTOM_INSET - urlBarMetrics.footprintH;

  const stickerCanvas = document.createElement('canvas');
  stickerCanvas.width = layout.footprintW;
  stickerCanvas.height = layout.footprintH;
  const stickerCtx = stickerCanvas.getContext('2d');
  if (!stickerCtx) throw new Error('Canvas is not supported');

  drawSticker(stickerCtx, layout, colors);

  ctx.drawImage(
    stickerCanvas,
    0,
    0,
    layout.footprintW,
    layout.footprintH,
    centerX - layout.footprintW / 2,
    stickerY,
    layout.footprintW,
    layout.footprintH,
  );

  drawBrandLabel(ctx, centerX, brandY, colors);
  drawUrlBar(ctx, centerX, urlBarY, colors, urlBarMetrics);

  return canvasToBlob(canvas);
}
