import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MintGrid } from '../../components/mint/MintGrid';
import { checkWallet, isEthAddress, type PhaseEligibility } from '../../lib/checkWallet';
import {
  MINT_PHASES,
  TOTAL_SUPPLY,
  type MintPhase,
} from '../../data/mock/mintPhases';
import styles from './MintPage.module.css';

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhaseRow({
  phase,
  eligible,
  active,
}: {
  phase: MintPhase;
  eligible: boolean | null;
  active: boolean;
}) {
  return (
    <div className={`${styles.phaseRow} ${active ? styles.phaseRowActive : ''}`}>
      <div className={styles.phaseDot}>
        <span
          className={`${styles.dot} ${
            phase.status === 'live'
              ? styles.dotLive
              : phase.status === 'ended'
                ? styles.dotEnded
                : styles.dotUpcoming
          }`}
        />
      </div>

      <div className={styles.phaseInfo}>
        <div className={styles.phaseTop}>
          <span className={styles.phaseLabel}>{phase.label}</span>
          {/* {phase.status === 'live' && <Badge variant="live" blink />} */}
          {/* {phase.status === 'upcoming' && <Badge variant="tba" />} */}
        </div>
        <div className={styles.phaseMeta}>
          {/* {phase.startsAt && <span>{phase.startsAt}</span>} */}
          {phase.price && <span>Price: {phase.price}</span>}
          {/* <span>Limit: {phase.limitPerWallet} per wallet</span> */}
        </div>
      </div>

      {eligible !== null && (
        <Badge variant={eligible ? 'eligible' : 'notEligible'} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FADE = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] } },
};

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const CHECK_ERRORS: Record<string, string> = {
  invalid_address: 'Enter a valid Ethereum address (0x...)',
  unavailable: 'Checker is temporarily unavailable. Please try again later.',
};

export function MintPage() {
  const { address, isConnected } = useAccount();
  const [inputAddr, setInputAddr] = useState('');
  const [checked, setChecked] = useState<PhaseEligibility | null>(null);
  const [error, setError] = useState('');

  const activePhase = MINT_PHASES.find((p) => p.status === 'live') ?? null;

  const checkMutation = useMutation({
    mutationFn: checkWallet,
    onSuccess: (result) => {
      if ('error' in result) {
        setChecked(null);
        setError(CHECK_ERRORS[result.error] ?? 'Could not check eligibility.');
        return;
      }
      setError('');
      setChecked(result);
    },
    onError: () => {
      setChecked(null);
      setError('Could not check eligibility. Please try again.');
    },
  });

  const runCheck = (addr: string) => {
    const val = addr.trim();
    if (!isEthAddress(val)) {
      setError(CHECK_ERRORS.invalid_address);
      setChecked(null);
      return;
    }
    setError('');
    checkMutation.mutate(val);
  };

  const handleCheck = () => {
    runCheck(inputAddr.trim() || (address ?? ''));
  };

  const handleUseConnected = () => {
    if (address) {
      setInputAddr(address);
      runCheck(address);
    }
  };

  const isChecking = checkMutation.isPending;

  return (
    <div className={styles.page}>
      {/* ── Art panel ─────────────────────────────────────────────────── */}
      <div className={styles.artPanel}>
        <MintGrid />
        <div className={styles.artStats}>
          <div className={styles.artStat}>
            <span className={styles.artStatVal}>{TOTAL_SUPPLY}</span>
            <span className={styles.artStatKey}>Total supply</span>
          </div>
        </div>
      </div>

      {/* ── Mint panel ────────────────────────────────────────────────── */}
      <motion.div
        className={styles.mintPanel}
        variants={STAGGER}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={FADE} className={styles.mintHead}>
          <h1 className={styles.mintTitle}>Eligibility Checker</h1>
          <p className={styles.mintSub}>
            Check if your wallet is on the whitelist for upcoming mint phases.
          </p>
        </motion.div>

        {/* Current phase highlight — shown only when a phase is live */}
        {activePhase && (
          <motion.div variants={FADE} className={styles.currentPhase}>
            <div className={styles.currentPhaseTop}>
              <span className={styles.currentPhaseLabel}>{activePhase.label}</span>
              <Badge variant="live" blink />
            </div>
            <p className={styles.currentPhaseDesc}>{activePhase.description}</p>
            <div className={styles.currentPhaseMeta}>
              <span>Price: <strong>{activePhase.price ?? 'TBA'}</strong></span>
              {/* <span>Limit: <strong>{activePhase.limitPerWallet} per wallet</strong></span> */}
            </div>
          </motion.div>
        )}

        {/* No active phase notice */}
        {!activePhase && (
          <motion.div variants={FADE} className={styles.notYet}>
            <span className={`kao ${styles.notYetKao}`}>(´• ω •`)</span>
            <div>
              <p className={styles.notYetTitle}>Whitelist still updating</p>
              <p className={styles.notYetDesc}>
                We&apos;re still adding wallets from partner collabs. Not everyone is in the checker yet.
                If yours isn&apos;t listed, check back soon. Missing for now doesn&apos;t mean you&apos;re out.
              </p>
            </div>
          </motion.div>
        )}

        {/* Whitelist checker */}
        <motion.div variants={FADE} className={styles.checker}>
          <p className={styles.checkerLabel}>Check eligibility</p>
          <div className={styles.checkerRow}>
            <input
              className={styles.checkerInput}
              type="text"
              placeholder="0x... wallet address"
              value={inputAddr}
              onChange={(e) => { setInputAddr(e.target.value); setChecked(null); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && !isChecking && handleCheck()}
              disabled={isChecking}
            />
            <Button onClick={handleCheck} disabled={isChecking}>
              {isChecking ? 'Checking…' : 'Check'}
            </Button>
          </div>
          {isConnected && address && (
            <button
              type="button"
              className={styles.useConnected}
              onClick={handleUseConnected}
              disabled={isChecking}
            >
              Use connected wallet ({address.slice(0, 6)}…{address.slice(-4)})
            </button>
          )}
          {error && <p className={styles.checkerError}>{error}</p>}
        </motion.div>

        {/* Mint schedule */}
        <motion.div variants={FADE} className={styles.schedule}>
          <p className={styles.scheduleTitle}>PHASE SCHEDULE</p>
          <div className={styles.scheduleList}>
            {MINT_PHASES.map((phase) => (
              <PhaseRow
                key={phase.id}
                phase={phase}
                active={phase.status === 'live'}
                eligible={checked ? (checked[phase.id as keyof PhaseEligibility] ?? false) : null}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
