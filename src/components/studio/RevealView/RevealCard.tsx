import { useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { basescanTxUrl } from '../../../config/external';
import { DEV_REVEAL_FAKE_TX_HASH } from '../../../lib/dev/devRevealNft';
import type { KaomojiNft } from '../../../types/nft';
import type { TxHash, TxStatus } from '../../../types/web3';
import { Button } from '../../ui/Button';
import { ScratchSection } from './ScratchSection';
import styles from './RevealView.module.css';

export type RevealCeremonyPhase =
  | 'wallet'
  | 'confirming'
  | 'loading'
  | 'scratch'
  | 'revealed'
  | 'failed';

export interface RevealCeremonyState {
  tokenId: string;
  phase: RevealCeremonyPhase;
  previewImage: string | null;
  revealedNft: KaomojiNft | null;
  txHash: TxHash | null;
  error: string | null;
}

interface RevealCardProps {
  nft: KaomojiNft;
  ceremony: RevealCeremonyState | null;
  txStatus: TxStatus;
  isDevMock?: boolean;
  revealDisabled: boolean;
  revealLoading: boolean;
  onReveal: () => void;
  onScratchComplete: () => void;
  onEnterStudio: () => void;
  onDismissFailed: () => void;
}

function phaseFromTxStatus(status: TxStatus['state']): RevealCeremonyPhase | null {
  if (status === 'pending') return 'wallet';
  if (status === 'confirming') return 'confirming';
  return null;
}

const footerMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

export function RevealCard({
  nft,
  ceremony,
  txStatus,
  isDevMock,
  revealDisabled,
  revealLoading,
  onReveal,
  onScratchComplete,
  onEnterStudio,
  onDismissFailed,
}: RevealCardProps) {
  const titleId = useId();

  const txPhase = ceremony ? phaseFromTxStatus(txStatus.state) : null;
  const displayPhase = ceremony ? (txPhase ?? ceremony.phase) : 'idle';

  const txHash = ceremony?.txHash ?? txStatus.hash;
  const previewImage = ceremony?.previewImage;
  const revealedNft = ceremony?.revealedNft;
  const showTxLink = Boolean(txHash && (!isDevMock || txHash !== DEV_REVEAL_FAKE_TX_HASH));

  const showScratch = displayPhase === 'scratch' && previewImage;
  const showStaticPreview =
    displayPhase === 'revealed' ||
    displayPhase === 'idle' ||
    displayPhase === 'wallet' ||
    displayPhase === 'confirming' ||
    displayPhase === 'loading';

  const statusMessage =
    displayPhase === 'wallet'
      ? txStatus.message || 'Confirm reveal in wallet…'
      : displayPhase === 'confirming'
        ? txStatus.message || 'Revealing on-chain…'
        : displayPhase === 'loading'
          ? 'Loading your Kaomoji…'
          : null;

  return (
    <article role="region" aria-labelledby={titleId} className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 id={titleId} className={styles.cardTitle}>
          {displayPhase === 'failed' ? 'Reveal failed' : 'Kaomoji'}
        </h2>
        <span className={styles.tokenId}>
          #{nft.tokenId}
          {isDevMock && <span className={styles.devTag}>DEV</span>}
        </span>
      </header>

      <div className={styles.cardBody}>
        {statusMessage && (
          <p
            className={[
              styles.status,
              displayPhase === 'loading' && styles.statusStatic,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {statusMessage}
          </p>
        )}

        {showScratch && (
          <ScratchSection previewImage={previewImage} onComplete={onScratchComplete} />
        )}

        {showStaticPreview && !showScratch && (
          <div className={styles.previewFrame}>
            {displayPhase === 'revealed' && previewImage && (
              <motion.img
                key="revealed-img"
                src={previewImage}
                alt={`Revealed Kaomoji #${nft.tokenId}`}
                className={styles.previewImg}
                draggable={false}
                initial={{ opacity: 0.6, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            )}

            {displayPhase === 'idle' &&
              (nft.previewImage ? (
                <img
                  src={nft.previewImage}
                  alt={`Kaomoji #${nft.tokenId} placeholder`}
                  className={styles.previewImg}
                  draggable={false}
                />
              ) : (
                <p className={styles.previewPlaceholder}>Unrevealed</p>
              ))}

            {(displayPhase === 'wallet' ||
              displayPhase === 'confirming' ||
              displayPhase === 'loading') && (
              <div className={styles.scratchLocked} aria-hidden="true" />
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {displayPhase === 'idle' && (
            <motion.div key="idle-footer" className={styles.cardFooter} {...footerMotion}>
              <p className={styles.cardHint}>
                Scratch the foil to discover your random on-chain composition.
              </p>
              <Button
                variant="primary"
                className={styles.revealBtn}
                disabled={revealDisabled}
                onClick={onReveal}
              >
                {revealLoading ? '…' : 'Reveal'}
              </Button>
            </motion.div>
          )}

          {displayPhase === 'failed' && ceremony && (
            <motion.div key="failed-footer" className={styles.cardFooter} {...footerMotion}>
              <p className={styles.errorMessage}>{ceremony.error ?? txStatus.message}</p>
              {txHash && showTxLink && (
                <a
                  className={styles.link}
                  href={basescanTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View tx
                </a>
              )}
              <Button variant="secondary" className={styles.revealBtn} onClick={onDismissFailed}>
                Try again
              </Button>
            </motion.div>
          )}

          {(displayPhase === 'wallet' ||
            displayPhase === 'confirming' ||
            displayPhase === 'loading') &&
            txHash &&
            showTxLink && (
              <motion.div key="tx-link" className={styles.cardFooter} {...footerMotion}>
                <a
                  className={styles.link}
                  href={basescanTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View tx
                </a>
              </motion.div>
            )}

          {displayPhase === 'revealed' && previewImage && (
            <motion.div key="revealed-footer" className={styles.cardFooter} {...footerMotion}>
              {revealedNft && (
                <p className={styles.stats}>
                  Level {revealedNft.level} · {revealedNft.ink} Ink ·{' '}
                  {revealedNft.unlockedSymbols} symbols
                </p>
              )}
              {txHash && showTxLink && (
                <a
                  className={styles.link}
                  href={basescanTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View tx
                </a>
              )}
              <Button variant="primary" className={styles.revealBtn} onClick={onEnterStudio}>
                Studio
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
