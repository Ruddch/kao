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
}

function projectionTone(current: number, projected: number): string {
  if (projected > current) return styles.projectedUp;
  if (projected < current) return styles.projectedDown;
  return styles.projected;
}

function StatProjection({
  current,
  projected,
}: {
  current: number;
  projected: number;
}) {
  if (projected === current) {
    return <span className={styles.value}>{current}</span>;
  }

  return (
    <span className={styles.valueWrap}>
      <span className={styles.value}>{current}</span>
      <span className={styles.arrow} aria-hidden="true">
        →
      </span>
      <span className={[styles.projected, projectionTone(current, projected)].join(' ')}>
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
          projected={preview.animatedProjected}
        />
      </div>
    </div>
  );
}
