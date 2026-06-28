import { hasDocumentAnimation } from '../glyphs/slotAnimation';
import type { Document, GlyphPack } from '../glyphs/types';
import { LAYOUT_ALIGN_CENTER } from './compositionCodec';
import type { LayoutConstants } from './glyphIndex';
import { buildAnimatedPreviewHtml } from './stickerAnimatedSvg';
import { buildDraftPreviewImage } from './stickerSvg';

/** Static `image` + optional animated HTML — same pipeline as on-chain tokenURI. */
export function buildKaomojiPreviewImages(
  clusters: Document,
  pack: GlyphPack,
  layout: LayoutConstants,
  themeId: number,
  layoutAlign = LAYOUT_ALIGN_CENTER,
): { previewImage: string; animatedPreviewImage: string | null } {
  const previewImage = buildDraftPreviewImage(clusters, pack, layout, themeId);
  const animatedPreviewImage = hasDocumentAnimation(clusters)
    ? buildAnimatedPreviewHtml(clusters, pack, layout, themeId, layoutAlign)
    : null;
  return { previewImage, animatedPreviewImage };
}
