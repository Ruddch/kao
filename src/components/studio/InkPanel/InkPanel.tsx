import { useEffect, useState } from 'react';
import { levelThreshold } from '../../../lib/onchain/inkMath';
import { MAX_UNLOCKED_SYMBOLS } from '../../../lib/onchain/normalize';
import type { DiffResult } from '../../../lib/onchain/symbolDiff';
import type { KaomojiNft } from '../../../types/nft';
import { SacrificePanel } from '../SacrificePanel';
import styles from './InkPanel.module.css';

interface InkPanelProps {
  target: KaomojiNft;
  editCost: number | null;
  editDiff: DiffResult | null;
  compositionChanged: boolean;
  candidates: KaomojiNft[];
  onSacrifice: (burnTokenId: string, targetTokenId: string) => Promise<void>;
  sacrificeDisabled?: boolean;
  animatedCount?: number;
  maxAnimated?: number;
}

export function InkPanel({
  target,
  editCost,
  editDiff,
  compositionChanged,
  candidates,
  onSacrifice,
  sacrificeDisabled,
  animatedCount = 0,
  maxAnimated = 0,
}: InkPanelProps) {
  const hasChanges = compositionChanged;
  const cost = editCost ?? 0;
  const deficit = hasChanges && cost > target.ink ? cost - target.ink : 0;
  const enoughInk = hasChanges && deficit === 0;

  const [expanded, setExpanded] = useState(deficit > 0);

  useEffect(() => {
    if (deficit > 0) setExpanded(true);
  }, [deficit]);

  const barPercent =
    hasChanges && cost > 0 ? Math.min(100, Math.round((target.ink / cost) * 100)) : 100;

  const nextLevel = target.level < 50 ? target.level + 1 : null;
  const nextThreshold = nextLevel ? levelThreshold(nextLevel) : null;
  const levelProgress =
    nextThreshold !== null && nextThreshold > target.inkReceived
      ? Math.min(
          100,
          Math.round(
            ((target.inkReceived - levelThreshold(target.level)) /
              (nextThreshold - levelThreshold(target.level))) *
              100,
          ),
        )
      : 100;

  return (
    <div className={styles.root}>
      <div className={styles.meta}>
        <span>
          Level {target.level}
          {nextLevel !== null && nextThreshold !== null && (
            <> · {target.inkReceived}/{nextThreshold} ink received</>
          )}
        </span>
        {maxAnimated > 0 && (
          <span>{animatedCount}/{maxAnimated} animated slot{maxAnimated === 1 ? '' : 's'}</span>
        )}
        <span>{target.unlockedSymbols}/{MAX_UNLOCKED_SYMBOLS} symbol slots</span>
      </div>

      {nextLevel !== null && (
        <div className={styles.levelTrack} aria-hidden="true">
          <div className={styles.levelFill} style={{ width: `${levelProgress}%` }} />
        </div>
      )}

      <div className={styles.head}>
        <span className={styles.title}>Edit cost</span>
        <div className={styles.stats}>
          {!hasChanges ? (
            <span className={styles.noChanges}>No changes to apply</span>
          ) : (
            <>
              <span>{cost > 0 ? `${cost} Ink` : 'Free (theme/metadata)'}</span>
              <span>You have: {target.ink}</span>
              {editDiff && (editDiff.replacements > 0 || editDiff.newSlots > 0) && (
                <span className={styles.diffDetail}>
                  {editDiff.replacements > 0 && `${editDiff.replacements} repl`}
                  {editDiff.replacements > 0 && editDiff.newSlots > 0 && ' · '}
                  {editDiff.newSlots > 0 && `${editDiff.newSlots} unlock`}
                </span>
              )}
              {deficit > 0 ? (
                <span className={styles.statDeficit}>Need: +{deficit}</span>
              ) : (
                <span className={styles.statOk}>Enough Ink</span>
              )}
            </>
          )}
        </div>
      </div>

      {hasChanges && cost > 0 && (
        <div className={styles.barTrack} aria-hidden="true">
          <div
            className={[styles.barFill, deficit > 0 && styles.barFillDeficit]
              .filter(Boolean)
              .join(' ')}
            style={{ width: `${barPercent}%` }}
          />
        </div>
      )}

      {enoughInk && !expanded && (
        <button type="button" className={styles.toggle} onClick={() => setExpanded(true)}>
          Add Ink anyway
        </button>
      )}

      {(expanded || deficit > 0) && (
        <div className={styles.topUp}>
          <span className={styles.topUpLabel}>Add Ink — sacrifice another Kaomoji</span>
          <SacrificePanel
            target={target}
            candidates={candidates}
            onSacrifice={onSacrifice}
            disabled={sacrificeDisabled}
            compact
          />
          {enoughInk && (
            <button type="button" className={styles.toggle} onClick={() => setExpanded(false)}>
              Hide Add Ink
            </button>
          )}
        </div>
      )}
    </div>
  );
}
