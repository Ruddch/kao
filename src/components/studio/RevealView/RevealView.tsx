import { AnimatePresence, motion } from 'framer-motion';
import type { KaomojiNft } from '../../../types/nft';
import type { TxStatus } from '../../../types/web3';
import { RevealCard, type RevealCeremonyState } from './RevealCard';
import styles from './RevealView.module.css';

interface RevealViewProps {
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
  onDevReset?: () => void;
}

const ELEVATED_PHASES = new Set(['wallet', 'confirming', 'loading', 'scratch']);

function isElevated(ceremony: RevealCeremonyState | null, txStatus: TxStatus): boolean {
  if (!ceremony) return false;
  if (txStatus.state === 'pending' || txStatus.state === 'confirming') return true;
  return ELEVATED_PHASES.has(ceremony.phase);
}

const cardTransition = {
  duration: 0.65,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function RevealView({
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
  onDevReset,
}: RevealViewProps) {
  const elevated = isElevated(ceremony, txStatus);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Reveal</h1>
        <p className={styles.pageSubtitle}>
          Your Kaomoji is waiting on-chain. Reveal to see what you got.
          {isDevMock && (
            <>
              {' '}
              <span className={styles.devBadge}>Dev mock — no tx</span>
            </>
          )}
        </p>
        {isDevMock && onDevReset && (
          <button type="button" className={styles.devResetBtn} onClick={onDevReset}>
            Reset mock NFT
          </button>
        )}
      </header>

      <AnimatePresence>
        {elevated && (
          <motion.div
            className={styles.backdrop}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className={styles.cardWrap}
        initial={false}
        animate={{
          y: 0,
          scale: elevated ? 1.03 : 1,
          rotateZ: elevated ? -3 : 0,
        }}
        transition={cardTransition}
      >
        <RevealCard
          nft={nft}
          ceremony={ceremony}
          txStatus={txStatus}
          isDevMock={isDevMock}
          revealDisabled={revealDisabled}
          revealLoading={revealLoading}
          onReveal={onReveal}
          onScratchComplete={onScratchComplete}
          onEnterStudio={onEnterStudio}
          onDismissFailed={onDismissFailed}
        />
      </motion.div>
    </div>
  );
}
