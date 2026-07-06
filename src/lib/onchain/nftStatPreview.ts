import {
  animatedSlotsUnlocked,
  levelFromInkReceived,
} from './inkMath';
import { MAX_UNLOCKED_SYMBOLS } from './normalize';
import type { DiffResult } from './symbolDiff';
import type { KaomojiNft } from '../../types/nft';

/** On-chain / OpenSea trait preview for the active NFT. */
export interface NftStatPreview {
  level: number;
  levelProjected: number;
  ink: number;
  inkProjected: number;
  symbols: number;
  symbolsProjected: number;
  animatedUnlocked: number;
  animatedProjected: number;
}

/**
 * Ink credited toward Level in the stats preview.
 *
 * - Edit affordable from balance → edit spends `_ink` only, no level change (unless burning).
 * - Edit needs more ink than balance → preview level from full `editCost` (must fund the edit).
 * - Sacrifice selected with reward ≥ edit deficit → preview from actual burn reward
 *   (matches on-chain `_inkReceived += reward`).
 */
export function inkTowardLevelPreview(
  nft: KaomojiNft,
  compositionChanged: boolean,
  editCost: number | null,
  sacrificeInkReward: number,
): number {
  if (!compositionChanged || editCost === null || editCost <= 0) {
    return sacrificeInkReward;
  }

  const editDeficit = Math.max(0, editCost - nft.ink);

  if (editDeficit === 0) {
    return sacrificeInkReward;
  }

  if (sacrificeInkReward >= editDeficit) {
    return sacrificeInkReward;
  }

  return Math.max(sacrificeInkReward, editCost);
}

/** Net `_ink` balance change: sacrifice reward minus pending edit cost. */
export function inkBalanceDeltaPreview(
  compositionChanged: boolean,
  editCost: number | null,
  sacrificeInkReward: number,
): number {
  const editSpend =
    compositionChanged && editCost !== null && editCost > 0 ? editCost : 0;
  return sacrificeInkReward - editSpend;
}

/**
 * Project traits after pending changes:
 * - Unlocked Symbols: +newSlots from an unsaved edit
 * - Level / Animated Symbols Unlocked: from inkTowardLevelPreview
 * - Ink: balance after sacrifice and edit
 */
export function computeNftStatPreview(
  nft: KaomojiNft,
  options: {
    compositionChanged: boolean;
    editDiff: DiffResult | null;
    editCost: number | null;
    sacrificeInkReward?: number;
  },
): NftStatPreview {
  const { compositionChanged, editDiff, editCost, sacrificeInkReward = 0 } = options;

  const symbolsDelta =
    compositionChanged && editDiff && editDiff.newSlots > 0 ? editDiff.newSlots : 0;

  const inkForLevel = inkTowardLevelPreview(
    nft,
    compositionChanged,
    editCost,
    sacrificeInkReward,
  );

  const projectedInkReceived = nft.inkReceived + inkForLevel;
  const levelProjected = levelFromInkReceived(projectedInkReceived);
  const animatedProjected = animatedSlotsUnlocked(levelProjected);
  const inkDelta = inkBalanceDeltaPreview(compositionChanged, editCost, sacrificeInkReward);
  const symbolsProjected = Math.min(
    nft.unlockedSymbols + symbolsDelta,
    MAX_UNLOCKED_SYMBOLS,
  );

  return {
    level: nft.level,
    levelProjected,
    symbols: nft.unlockedSymbols,
    symbolsProjected,
    animatedUnlocked: nft.animatedUnlocked,
    animatedProjected,
    ink: nft.ink,
    inkProjected: nft.ink + inkDelta,
  };
}
