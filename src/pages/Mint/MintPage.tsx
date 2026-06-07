import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MintGrid } from '../../components/mint/MintGrid';
import {
  MINT_PHASES,
  MOCK_WHITELIST,
  AVAILABLE,
  TOTAL_SUPPLY,
  type MintPhase,
} from '../../data/mock/mintPhases';
import styles from './MintPage.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeAddr(addr: string) {
  return addr.trim().toLowerCase();
}

function checkEligibility(addr: string): Record<string, boolean> {
  const norm = normalizeAddr(addr);
  const result: Record<string, boolean> = {};
  for (const phase of MINT_PHASES) {
    const list = MOCK_WHITELIST[phase.id] ?? [];
    // public phase: eligible if live
    result[phase.id] = phase.id === 'public'
      ? phase.status === 'live'
      : list.map(normalizeAddr).includes(norm);
  }
  return result;
}

function isEthAddress(v: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(v.trim());
}

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
          {phase.status === 'live' && <Badge variant="live" blink />}
          {phase.status === 'upcoming' && <Badge variant="tba" />}
        </div>
        <div className={styles.phaseMeta}>
          {phase.startsAt && <span>{phase.startsAt}</span>}
          {phase.price && <span>Price: {phase.price}</span>}
          <span>Limit: {phase.limitPerWallet} per wallet</span>
        </div>
      </div>

      {eligible !== null && (
        <div className={`${styles.eligBadge} ${eligible ? styles.eligYes : styles.eligNo}`}>
          {eligible ? '✓ ELIGIBLE' : '✗ NOT ELIGIBLE'}
        </div>
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

export function MintPage() {
  const { address, isConnected } = useAccount();
  const [inputAddr, setInputAddr] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean> | null>(null);
  const [error, setError] = useState('');

  const activePhase = MINT_PHASES.find((p) => p.status === 'live') ?? null;

  const handleCheck = () => {
    const val = inputAddr.trim() || (address ?? '');
    if (!isEthAddress(val)) {
      setError('Enter a valid Ethereum address (0x...)');
      setChecked(null);
      return;
    }
    setError('');
    setChecked(checkEligibility(val));
  };

  const handleUseConnected = () => {
    if (address) {
      setInputAddr(address);
      setChecked(checkEligibility(address));
      setError('');
    }
  };

  const eligibleForActive =
    checked && activePhase ? checked[activePhase.id] ?? false : false;

  return (
    <div className={styles.page}>
      {/* ── Art panel ─────────────────────────────────────────────────── */}
      <div className={styles.artPanel}>
        <MintGrid />
        <div className={styles.artStats}>
          <div className={styles.artStat}>
            <span className={styles.artStatVal}>{AVAILABLE}</span>
            <span className={styles.artStatKey}>Available</span>
          </div>
          <div className={styles.artStatDivider} />
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
          <h1 className={styles.mintTitle}>Mint Kaomoji</h1>
          <p className={styles.mintSub}>
            Your personalized on-chain digital companion.
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
              <span>Limit: <strong>{activePhase.limitPerWallet} per wallet</strong></span>
            </div>
          </motion.div>
        )}

        {/* No active phase notice */}
        {!activePhase && (
          <motion.div variants={FADE} className={styles.notYet}>
            <span className={`kao ${styles.notYetKao}`}>(´• ω •`)</span>
            <div>
              <p className={styles.notYetTitle}>Mint not started yet</p>
              <p className={styles.notYetDesc}>All phases are upcoming. Check eligibility below to see if your wallet is on the list.</p>
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
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            />
            <Button onClick={handleCheck}>Check</Button>
          </div>
          {isConnected && address && (
            <button type="button" className={styles.useConnected} onClick={handleUseConnected}>
              Use connected wallet ({address.slice(0, 6)}…{address.slice(-4)})
            </button>
          )}
          {error && <p className={styles.checkerError}>{error}</p>}
        </motion.div>

        {/* Mint schedule */}
        <motion.div variants={FADE} className={styles.schedule}>
          <p className={styles.scheduleTitle}>MINT SCHEDULE</p>
          <div className={styles.scheduleList}>
            {MINT_PHASES.map((phase) => (
              <PhaseRow
                key={phase.id}
                phase={phase}
                active={phase.status === 'live'}
                eligible={checked ? (checked[phase.id] ?? false) : null}
              />
            ))}
          </div>
        </motion.div>

        {/* Mint action */}
        <motion.div variants={FADE} className={styles.mintAction}>
          {!isConnected ? (
            <ConnectKitButton.Custom>
              {({ show }) => (
                <Button onClick={show} className={styles.mintBtn}>
                  Connect Wallet to Mint
                </Button>
              )}
            </ConnectKitButton.Custom>
          ) : eligibleForActive ? (
            <Button className={styles.mintBtn} disabled>
              Mint — coming soon
            </Button>
          ) : (
            <Button variant="ghost" className={styles.mintBtn} disabled>
              {checked ? 'Not eligible for current phase' : 'Check eligibility above'}
            </Button>
          )}
          <p className={styles.mintDisclaimer}>
            Smart contract not yet deployed. Minting is not active.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
