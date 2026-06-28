import { useState } from 'react';
import { burnReward } from '../../../lib/onchain/inkMath';
import type { KaomojiNft } from '../../../types/nft';
import { Button } from '../../ui/Button';
import { Callout } from '../../ui/Callout';
import styles from './SacrificePanel.module.css';

interface SacrificePanelProps {
  target: KaomojiNft;
  candidates: KaomojiNft[];
  onSacrifice: (burnTokenId: string, targetTokenId: string) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

export function SacrificePanel({
  target,
  candidates,
  onSacrifice,
  disabled,
  compact,
}: SacrificePanelProps) {
  const [burnId, setBurnId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const burnNft = candidates.find((n) => n.tokenId === burnId);
  const reward = burnNft ? burnReward(burnNft.unlockedSymbols) : 0;

  const handleSacrifice = async () => {
    if (!burnId) return;
    setSubmitting(true);
    try {
      await onSacrifice(burnId, target.tokenId);
      setBurnId(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.root}>
      {!compact && (
        <Callout variant="danger" title="Permanent burn">
          Sacrifice destroys one revealed Kaomoji and grants Ink to #{target.tokenId}.
        </Callout>
      )}

      <p className={styles.target}>
        {compact ? (
          <>
            Target: <strong>#{target.tokenId}</strong> (this one) · {target.ink} Ink
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
              className={[
                styles.option,
                burnId === nft.tokenId && styles.optionActive,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setBurnId(nft.tokenId)}
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

      <Button
        variant="danger"
        disabled={disabled || !burnId || candidates.length === 0 || submitting}
        onClick={handleSacrifice}
      >
        {submitting ? '…' : burnId ? `Burn #${burnId} · +${reward} Ink` : 'Sacrifice for Ink'}
      </Button>
    </div>
  );
}
