import { useMemo } from 'react';
import { computeNftStatPreview } from '../../../lib/onchain/nftStatPreview';
import { MAX_UNLOCKED_SYMBOLS } from '../../../lib/onchain/normalize';
import type { DiffResult } from '../../../lib/onchain/symbolDiff';
import type { KaomojiNft } from '../../../types/nft';
import styles from './NftStatsPanel.module.css';

interface NftStatsPanelProps {
  nft: KaomojiNft;
  compositionChanged: boolean;
  editDiff: DiffResult | null;
  editCost: number | null;
  sacrificeInkReward?: number;
  animatedCount?: number;
}

function StatProjection({
  current,
  projected,
  projectedTone,
}: {
  current: number;
  projected: number;
  projectedTone?: 'up' | 'down';
}) {
  if (projected === current) {
    return <span className={styles.value}>{current}</span>;
  }

  const tone =
    projectedTone ??
    (projected > current ? 'up' : projected < current ? 'down' : undefined);

  return (
    <span className={styles.valueWrap}>
      <span className={styles.value}>{current}</span>
      <span className={styles.arrow} aria-hidden="true">
        →
      </span>
      <span
        className={[
          styles.projected,
          tone === 'up' && styles.projectedUp,
          tone === 'down' && styles.projectedDown,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {projected}
      </span>
    </span>
  );
}

function StatProjectionPair({
  currentLabel,
  projectedLabel,
  changed,
}: {
  currentLabel: string;
  projectedLabel: string;
  changed: boolean;
}) {
  if (!changed) {
    return <span className={styles.value}>{currentLabel}</span>;
  }

  return (
    <span className={styles.valueWrap}>
      <span className={styles.value}>{currentLabel}</span>
      <span className={styles.arrow} aria-hidden="true">
        →
      </span>
      <span className={[styles.projected, styles.projectedUp].join(' ')}>{projectedLabel}</span>
    </span>
  );
}

export function NftStatsPanel({
  nft,
  compositionChanged,
  editDiff,
  editCost,
  sacrificeInkReward = 0,
  animatedCount = 0,
}: NftStatsPanelProps) {
  const preview = useMemo(
    () =>
      computeNftStatPreview(nft, {
        compositionChanged,
        editDiff,
        editCost,
        sacrificeInkReward,
      }),
    [nft, compositionChanged, editDiff, editCost, sacrificeInkReward],
  );

  const symbolsCurrent = `${preview.symbols}/${MAX_UNLOCKED_SYMBOLS}`;
  const symbolsProjected = `${preview.symbolsProjected}/${MAX_UNLOCKED_SYMBOLS}`;

  const animatedOverflow = animatedCount > preview.animatedUnlocked;
  const animatedProjected = animatedOverflow
    ? animatedCount
    : preview.animatedProjected;

  return (
    <div className={styles.root} aria-label="NFT traits preview">
      <div className={styles.row}>
        <span className={styles.label}>Level</span>
        <StatProjection current={preview.level} projected={preview.levelProjected} />
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Ink</span>
        <StatProjection current={preview.ink} projected={preview.inkProjected} />
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Unlocked Symbols</span>
        <StatProjectionPair
          currentLabel={symbolsCurrent}
          projectedLabel={symbolsProjected}
          changed={preview.symbolsProjected !== preview.symbols}
        />
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Animated Symbols Unlocked</span>
        <StatProjection
          current={preview.animatedUnlocked}
          projected={animatedProjected}
          projectedTone={animatedOverflow ? 'down' : undefined}
        />
      </div>
    </div>
  );
}
