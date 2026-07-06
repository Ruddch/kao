import type { KaomojiNft } from '../../types/nft';
import { animatedSlotsUnlocked, levelThreshold } from './inkMath';

export const DEFAULT_MINT_UNLOCKED_SYMBOLS = 5;
export const MAX_UNLOCKED_SYMBOLS = 20;

/** On-chain fields removed from the public ABI — derived for Studio UI. */
export function derivedKaomojiFields(level: number) {
  return {
    mintUnlockedSymbols: DEFAULT_MINT_UNLOCKED_SYMBOLS,
    animatedUnlocked: animatedSlotsUnlocked(level),
    inkReceived: levelThreshold(level),
  };
}

export function toContractNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'bigint') return Number(value);
  return fallback;
}

export function toContractBool(value: unknown): boolean {
  return Boolean(value);
}

export function normalizeKaomojiNft(
  tokenId: string,
  partial: Omit<KaomojiNft, 'tokenId'>,
): KaomojiNft {
  return {
    tokenId,
    revealed: partial.revealed,
    ink: toContractNumber(partial.ink),
    inkReceived: toContractNumber(partial.inkReceived),
    level: toContractNumber(partial.level, 1),
    unlockedSymbols: toContractNumber(partial.unlockedSymbols),
    mintUnlockedSymbols: toContractNumber(
      partial.mintUnlockedSymbols,
      DEFAULT_MINT_UNLOCKED_SYMBOLS,
    ),
    animatedUnlocked: toContractNumber(partial.animatedUnlocked),
    composition: partial.composition,
    clusters: partial.clusters,
    themeId: partial.themeId,
    layoutAlign: partial.layoutAlign ?? null,
    previewImage: partial.previewImage,
    animatedPreviewImage: partial.animatedPreviewImage ?? null,
  };
}
