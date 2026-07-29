import { getRandomTemplate } from '../../data/mock/kaomojiEditor';
import { parseText } from '../glyphs/parseText';
import type { GlyphLookup, GlyphPack } from '../glyphs/types';
import { buildKaomojiPreviewImages } from '../onchain/buildKaomojiPreviewImages';
import { LAYOUT_ALIGN_CENTER } from '../onchain/compositionCodec';
import type { LayoutConstants } from '../onchain/glyphIndex';
import { derivedKaomojiFields, normalizeKaomojiNft } from '../onchain/normalize';
import type { KaomojiNft } from '../../types/nft';
import type { TxHash } from '../../types/web3';

export const DEV_REVEAL_TOKEN_ID = 'dev-reveal';

export const DEV_REVEAL_FAKE_TX_HASH =
  '0xdev000000000000000000000000000000000000000000000000000000000001' as TxHash;

const DEV_UNREVEALED_PREVIEW = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#ecece8"/>
    <rect x="32" y="32" width="336" height="336" fill="#f8f8f4" stroke="#111" stroke-width="6"/>
    <text x="200" y="188" text-anchor="middle" font-family="ui-monospace,monospace" font-size="72" font-weight="700" fill="#111">?</text>
    <text x="200" y="248" text-anchor="middle" font-family="ui-monospace,monospace" font-size="14" font-weight="700" fill="#555">DEV MOCK</text>
  </svg>`,
)}`;

export function isDevRevealToken(tokenId: string): boolean {
  return import.meta.env.DEV && tokenId === DEV_REVEAL_TOKEN_ID;
}

export function devRevealEnabled(): boolean {
  return import.meta.env.DEV;
}

export function createDevUnrevealedNft(): KaomojiNft {
  const derived = derivedKaomojiFields(1);
  return normalizeKaomojiNft(DEV_REVEAL_TOKEN_ID, {
    revealed: false,
    ink: 50,
    inkReceived: derived.inkReceived,
    level: 1,
    unlockedSymbols: 5,
    mintUnlockedSymbols: derived.mintUnlockedSymbols,
    animatedUnlocked: derived.animatedUnlocked,
    composition: null,
    clusters: null,
    themeId: null,
    layoutAlign: null,
    previewImage: DEV_UNREVEALED_PREVIEW,
    animatedPreviewImage: null,
  });
}

export function buildDevRevealedNft(
  pack: GlyphPack,
  lookup: GlyphLookup,
  layout: LayoutConstants,
): KaomojiNft {
  const template = getRandomTemplate();
  const parsed = parseText(template.label, pack, lookup);
  if (!parsed.ok) {
    throw new Error(`Dev mock parse failed: ${parsed.error}`);
  }

  const themeId =
    layout.themes.length > 0 ? Math.floor(Math.random() * layout.themes.length) : 0;

  const { previewImage, animatedPreviewImage } = buildKaomojiPreviewImages(
    parsed.clusters,
    pack,
    layout,
    themeId,
    LAYOUT_ALIGN_CENTER,
  );

  const derived = derivedKaomojiFields(1);

  return normalizeKaomojiNft(DEV_REVEAL_TOKEN_ID, {
    revealed: true,
    ink: 50,
    inkReceived: derived.inkReceived,
    level: 1,
    unlockedSymbols: 5,
    mintUnlockedSymbols: derived.mintUnlockedSymbols,
    animatedUnlocked: derived.animatedUnlocked,
    composition: null,
    clusters: parsed.clusters,
    themeId,
    layoutAlign: LAYOUT_ALIGN_CENTER,
    previewImage,
    animatedPreviewImage,
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resetDevRevealInList(nfts: KaomojiNft[]): KaomojiNft[] {
  const without = nfts.filter((n) => n.tokenId !== DEV_REVEAL_TOKEN_ID);
  return [createDevUnrevealedNft(), ...without];
}
