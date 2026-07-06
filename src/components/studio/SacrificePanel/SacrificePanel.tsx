import { useMemo, useState } from 'react';
import { burnReward } from '../../../lib/onchain/inkMath';
import type { KaomojiNft } from '../../../types/nft';
import { Button } from '../../ui/Button';
import { Callout } from '../../ui/Callout';
import styles from './SacrificePanel.module.css';

interface SacrificePanelProps {
  target: KaomojiNft;
  candidates: KaomojiNft[];
  selectedBurnIds: string[];
  onSelectionChange: (burnTokenIds: string[]) => void;
  onSacrifice: (burnTokenIds: string[], targetTokenId: string) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

function totalBurnReward(nfts: KaomojiNft[]): number {
  return nfts.reduce((sum, nft) => sum + burnReward(nft.unlockedSymbols), 0);
}

export function SacrificePanel({
  target,
  candidates,
  selectedBurnIds,
  onSelectionChange,
  onSacrifice,
  disabled,
  compact,
}: SacrificePanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const burnIds = useMemo(() => new Set(selectedBurnIds), [selectedBurnIds]);

  const selected = useMemo(
    () => candidates.filter((n) => burnIds.has(n.tokenId)),
    [candidates, burnIds],
  );
  const reward = totalBurnReward(selected);

  const toggleBurn = (tokenId: string) => {
    if (burnIds.has(tokenId)) {
      onSelectionChange(selectedBurnIds.filter((id) => id !== tokenId));
    } else {
      onSelectionChange([...selectedBurnIds, tokenId]);
    }
  };

  const handleSacrifice = async () => {
    if (selectedBurnIds.length === 0) return;
    setSubmitting(true);
    try {
      await onSacrifice(selectedBurnIds, target.tokenId);
      onSelectionChange([]);
    } finally {
      setSubmitting(false);
    }
  };

  const buttonLabel = (() => {
    if (submitting) return '…';
    if (selected.length === 0) return 'Sacrifice for Ink';
    if (selected.length === 1) {
      return `Burn #${selected[0].tokenId} · +${reward} Ink`;
    }
    return `Burn ${selected.length} Kaomoji · +${reward} Ink`;
  })();

  return (
    <div className={styles.root}>
      {!compact && (
        <Callout variant="danger" title="Permanent burn">
          Sacrifice destroys selected revealed Kaomoji and grants Ink to #{target.tokenId}. You can
          select several at once.
        </Callout>
      )}

      <p className={styles.target}>
        {compact ? (
          <>
            Target: <strong>#{target.tokenId}</strong> (this one) · {target.ink} Ink
            {candidates.length > 0 && (
              <>
                <br />
                <span className={styles.hint}>Tap to select one or more to burn</span>
              </>
            )}
          </>
        ) : (
          <>
            Ink recipient: <strong>#{target.tokenId}</strong> (current {target.ink})
          </>
        )}
      </p>

      {candidates.length === 0 ? (
        <p className={styles.empty}>No other revealed Kaomoji to sacrifice.</p>
      ) : (
        <div className={styles.list}>
          {candidates.map((nft) => (
            <button
              key={nft.tokenId}
              type="button"
              aria-pressed={burnIds.has(nft.tokenId)}
              className={[
                styles.option,
                burnIds.has(nft.tokenId) && styles.optionActive,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => toggleBurn(nft.tokenId)}
            >
              <span className={styles.optionPreview}>
                {nft.previewImage ? (
                  <img src={nft.previewImage} alt="" className={styles.optionImg} />
                ) : (
                  <span className={styles.optionFallback}>#{nft.tokenId}</span>
                )}
              </span>
              <span className={styles.optionMeta}>
                #{nft.tokenId} · +{burnReward(nft.unlockedSymbols)} Ink
              </span>
            </button>
          ))}
        </div>
      )}

      {selected.length > 1 && (
        <p className={styles.summary}>
          {selected.length} selected · +{reward} Ink total
        </p>
      )}

      <Button
        variant="danger"
        disabled={disabled || selectedBurnIds.length === 0 || candidates.length === 0 || submitting}
        onClick={handleSacrifice}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
