import type { DiffResult } from '../../../lib/onchain/symbolDiff';
import type { KaomojiNft } from '../../../types/nft';
import styles from './EditCostSummary.module.css';

interface EditCostSummaryProps {
  target: KaomojiNft;
  editCost: number | null;
  editDiff: DiffResult | null;
  compositionChanged: boolean;
  sacrificeInkReward?: number;
}

export function EditCostSummary({
  target,
  editCost,
  editDiff,
  compositionChanged,
  sacrificeInkReward = 0,
}: EditCostSummaryProps) {
  if (!compositionChanged) return null;

  const cost = editCost ?? 0;
  const effectiveInk = target.ink + sacrificeInkReward;
  const deficit = cost > effectiveInk ? cost - effectiveInk : 0;
  const canAffordNow = cost <= target.ink;
  const needsSacrificeFirst = sacrificeInkReward > 0 && !canAffordNow && deficit === 0;
  const barPercent = cost > 0 ? Math.min(100, Math.round((effectiveInk / cost) * 100)) : 100;

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span className={styles.title}>Edit cost</span>
        <div className={styles.stats}>
          <span>{cost > 0 ? `${cost} Ink` : 'Free (theme/metadata)'}</span>
          {sacrificeInkReward > 0 ? (
            <span>
              You have: {target.ink} → {effectiveInk}
            </span>
          ) : (
            <span>You have: {target.ink}</span>
          )}
          {editDiff && (editDiff.replacements > 0 || editDiff.newSlots > 0) && (
            <span className={styles.diffDetail}>
              {editDiff.replacements > 0 && `${editDiff.replacements} repl`}
              {editDiff.replacements > 0 && editDiff.newSlots > 0 && ' · '}
              {editDiff.newSlots > 0 && `${editDiff.newSlots} unlock`}
            </span>
          )}
          {deficit > 0 ? (
            <span className={styles.statDeficit}>Need: +{deficit}</span>
          ) : needsSacrificeFirst ? (
            <span className={styles.statPending}>Sacrifice first, then apply</span>
          ) : (
            <span className={styles.statOk}>Enough Ink</span>
          )}
        </div>
      </div>

      {cost > 0 && (
        <div className={styles.barTrack} aria-hidden="true">
          <div
            className={[styles.barFill, deficit > 0 && styles.barFillDeficit]
              .filter(Boolean)
              .join(' ')}
            style={{ width: `${barPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
