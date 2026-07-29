import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { CollectionHub } from '../../components/studio/CollectionHub';
import { TxOverlay } from '../../components/studio/TxOverlay';
import {
  ScratchRevealCard,
  type ScratchPhase,
  type ScratchRevealCardHandle,
} from '../../components/reveal/ScratchRevealCard';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { COLLECTION } from '../../config/external';
import { useKaomojiWrite } from '../../hooks/useKaomojiWrite';
import { useOwnedKaomoji } from '../../hooks/useOwnedKaomoji';
import { isRateLimitError } from '../../lib/onchain/baseRpc';
import type { KaomojiNft } from '../../types/nft';
import styles from './RevealPage.module.css';

function pickDefaultTokenId(nfts: KaomojiNft[]): string | null {
  if (!nfts.length) return null;
  return nfts[0].tokenId;
}

export function RevealPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const wrongChain = isConnected && chainId !== COLLECTION.chainId;
  const sessionTokenRef = useRef<string | null>(null);
  const batchRevealRef = useRef(false);
  const batchPartialRef = useRef(false);
  const scratchRef = useRef<ScratchRevealCardHandle>(null);
  /** From Studio `/reveal?token=` — consumed once when the NFT appears in the list. */
  const preferTokenRef = useRef<string | null>(searchParams.get('token'));

  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  /** Keeps focus on a token even after it leaves the unrevealed list. */
  const [sessionTokenId, setSessionTokenId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ScratchPhase>('locked');
  /** Hide tokens the moment their reveal tx confirms (before refetch catches up). */
  const [optimisticallyRevealed, setOptimisticallyRevealed] = useState<Set<string>>(
    () => new Set(),
  );

  const {
    data: nfts = [],
    isLoading: nftsLoading,
    isError: nftsError,
    error: nftsQueryError,
    refetch,
  } = useOwnedKaomoji(address);
  const { reveal, revealAll, status, isPending, resetStatus } = useKaomojiWrite();

  const unrevealedNfts = useMemo(
    () =>
      nfts.filter((n) => !n.revealed && !optimisticallyRevealed.has(n.tokenId)),
    [nfts, optimisticallyRevealed],
  );

  // Keep preferToken in sync if the query arrives/changes before NFTs load.
  useEffect(() => {
    const fromQuery = searchParams.get('token');
    if (fromQuery) preferTokenRef.current = fromQuery;
  }, [searchParams]);

  const clearTokenQuery = useCallback(() => {
    setSearchParams(
      (prev) => {
        if (!prev.has('token')) return prev;
        const next = new URLSearchParams(prev);
        next.delete('token');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  // Drop optimistic ids once chain data confirms them revealed.
  useEffect(() => {
    setOptimisticallyRevealed((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        const nft = nfts.find((n) => n.tokenId === id);
        if (nft && !nft.revealed) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [nfts]);

  const sessionNft: KaomojiNft | null = useMemo(() => {
    if (!sessionTokenId) return null;
    return nfts.find((n) => n.tokenId === sessionTokenId) ?? null;
  }, [nfts, sessionTokenId]);

  const activeUnrevealed =
    unrevealedNfts.find((n) => n.tokenId === activeTokenId) ?? null;

  // Prefer the live session NFT (may already be revealed); else selected unrevealed.
  const displayNft = sessionNft ?? activeUnrevealed;

  // Single selection owner: deep-link first, else keep current, else default to first.
  useEffect(() => {
    if (nftsLoading) return;

    const preferred = preferTokenRef.current;
    if (preferred) {
      const match = unrevealedNfts.find((n) => n.tokenId === preferred);
      if (match) {
        preferTokenRef.current = null;
        setPhase('locked');
        setActiveTokenId(match.tokenId);
        setSessionTokenId(match.tokenId);
        sessionTokenRef.current = match.tokenId;
        clearTokenQuery();
        return;
      }
      // Still loading ownership / list empty — wait. If list is loaded and token
      // isn't unrevealed, drop the preference.
      if (!nftsLoading) {
        preferTokenRef.current = null;
        clearTokenQuery();
      }
    }

    if (!unrevealedNfts.length) {
      if (!sessionTokenId) setActiveTokenId(null);
      return;
    }
    if (activeTokenId && unrevealedNfts.some((n) => n.tokenId === activeTokenId)) return;
    if (sessionTokenId && unrevealedNfts.some((n) => n.tokenId === sessionTokenId)) {
      setActiveTokenId(sessionTokenId);
      return;
    }
    if (sessionTokenId) return;
    const next = pickDefaultTokenId(unrevealedNfts);
    setActiveTokenId(next);
  }, [
    unrevealedNfts,
    activeTokenId,
    sessionTokenId,
    nftsLoading,
    clearTokenQuery,
  ]);

  // Sync session to selection while still locked / choosing.
  useEffect(() => {
    if (phase !== 'locked') return;
    if (!activeTokenId) return;
    // Don't clobber a preferred deep-link mid-apply.
    if (preferTokenRef.current && preferTokenRef.current !== activeTokenId) return;
    setSessionTokenId(activeTokenId);
    sessionTokenRef.current = activeTokenId;
  }, [activeTokenId, phase]);

  // After preparing: wait until revealed + previewImage exists, then unlock scratch.
  useEffect(() => {
    if (phase !== 'preparing' || !sessionTokenId) return;
    const nft = nfts.find((n) => n.tokenId === sessionTokenId);
    if (nft?.revealed && nft.previewImage) {
      setPhase('ready');
    }
  }, [phase, nfts, sessionTokenId]);

  // Single reveal success → pin session and prepare scratch card.
  // Batch reveal success skips scratch (all unveiled on-chain).
  useEffect(() => {
    if (status.state !== 'success') return;
    if (batchRevealRef.current) {
      void refetch();
      return;
    }
    const tokenId = sessionTokenRef.current;
    if (!tokenId) return;
    setSessionTokenId(tokenId);
    setPhase('preparing');
    void refetch();
  }, [status.state, refetch]);

  const markRevealed = (tokenId: string) => {
    setOptimisticallyRevealed((prev) => {
      if (prev.has(tokenId)) return prev;
      const next = new Set(prev);
      next.add(tokenId);
      return next;
    });
    setActiveTokenId((current) => (current === tokenId ? null : current));
    setSessionTokenId((current) => (current === tokenId ? null : current));
    if (sessionTokenRef.current === tokenId) {
      sessionTokenRef.current = null;
    }
  };

  const handleSelect = (nft: KaomojiNft) => {
    if (phase === 'preparing' || phase === 'ready') {
      if (!window.confirm('Leave this reveal session and pick another Kaomoji?')) return;
    }
    // Always leave scratch session fully — foil must remount for the next NFT.
    setPhase('locked');
    setActiveTokenId(nft.tokenId);
    setSessionTokenId(nft.tokenId);
    sessionTokenRef.current = nft.tokenId;
  };

  const handleReveal = async () => {
    if (!displayNft || displayNft.revealed) return;
    batchRevealRef.current = false;
    batchPartialRef.current = false;
    sessionTokenRef.current = displayNft.tokenId;
    setSessionTokenId(displayNft.tokenId);
    setPhase('locked');
    await reveal(displayNft.tokenId);
  };

  const handleRevealAll = async () => {
    const ids = unrevealedNfts.map((n) => n.tokenId);
    if (!ids.length) return;
    batchRevealRef.current = true;
    batchPartialRef.current = false;
    sessionTokenRef.current = null;
    setPhase('locked');
    setSessionTokenId(null);
    try {
      const result = await revealAll(ids, {
        onRevealed: markRevealed,
        onPartialStop: () => {
          batchPartialRef.current = true;
        },
      });
      batchPartialRef.current = !result.complete;
      await refetch();
    } catch {
      // Nothing confirmed — still refresh in case of stale list.
      await refetch();
    }
  };

  const handleScratchFast = () => {
    scratchRef.current?.scratchFast();
  };

  const handleTxDismiss = async () => {
    const state = status.state;
    const wasBatch = batchRevealRef.current;
    const tokenId = sessionTokenRef.current;
    resetStatus();

    if (wasBatch) {
      batchRevealRef.current = false;
      batchPartialRef.current = false;
      setPhase('locked');
      setSessionTokenId(null);
      sessionTokenRef.current = null;
      await refetch();
      // Pick next unrevealed after partial stop.
      return;
    }

    if (state === 'failed') {
      await refetch();
      return;
    }

    if (state !== 'success') return;

    if (!tokenId) return;

    setPhase('preparing');
    setSessionTokenId(tokenId);

    const { data: fresh } = await refetch();
    const updated = fresh?.find((n) => n.tokenId === tokenId);
    if (updated?.revealed && updated.previewImage) {
      setPhase('ready');
      return;
    }

    window.setTimeout(() => {
      void refetch().then(({ data }) => {
        const again = data?.find((n) => n.tokenId === tokenId);
        if (again?.revealed && again.previewImage) {
          setPhase('ready');
        }
      });
    }, 1200);
  };

  const showEmptyUnrevealed =
    isConnected &&
    !nftsError &&
    !nftsLoading &&
    unrevealedNfts.length === 0 &&
    phase === 'locked' &&
    !displayNft;

  const hubNfts = useMemo(() => {
    if (!sessionNft) return unrevealedNfts;
    if (unrevealedNfts.some((n) => n.tokenId === sessionNft.tokenId)) return unrevealedNfts;
    // Keep the in-progress reveal token visible in the rail so it doesn't "vanish".
    if (phase === 'preparing' || phase === 'ready' || phase === 'complete') {
      return [sessionNft, ...unrevealedNfts];
    }
    return unrevealedNfts;
  }, [unrevealedNfts, sessionNft, phase]);

  const scratchImage = displayNft?.previewImage ?? null;
  const canScratchFast = phase === 'ready';
  const showRevealBtn = phase === 'locked' || phase === 'preparing';
  const batchCount = unrevealedNfts.length;
  const overlaySuccessTitle = batchRevealRef.current
    ? batchPartialRef.current
      ? 'Partially revealed'
      : 'Batch reveal confirmed'
    : 'Reveal confirmed';

  return (
    <div className={styles.page}>
      {wrongChain && (
        <div className={styles.banner}>
          <Callout variant="warning" title="Wrong network">
            Switch to Ethereum to reveal Kaomoji.
            <Button
              variant="secondary"
              className={styles.chainBtn}
              onClick={() => switchChain({ chainId: mainnet.id })}
            >
              Switch to Ethereum
            </Button>
          </Callout>
        </div>
      )}

      <div className={styles.main}>
        {isConnected && !nftsError && (
          <CollectionHub
            nfts={hubNfts}
            activeTokenId={sessionTokenId ?? activeTokenId}
            loading={nftsLoading}
            onSelect={handleSelect}
            footer={
              batchCount > 0 ? (
                <Button
                  variant="secondary"
                  className={styles.revealAllBtn}
                  onClick={handleRevealAll}
                  disabled={isPending || wrongChain || phase === 'preparing' || phase === 'ready'}
                >
                  Reveal all ({batchCount})
                </Button>
              ) : null
            }
          />
        )}

        <section
          className={[
            styles.workspace,
            status.state !== 'idle' && styles.workspaceScrollLock,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <header className={styles.header}>
            <h1 className={styles.title}>Reveal</h1>
            <p className={styles.subtitle}>
              Select unrevealed Kaomoji, confirm on-chain reveal, then scratch the foil to unveil.
            </p>
          </header>

          {!isConnected && (
            <div className={styles.empty}>
              <h2 className={styles.emptyTitle}>Connect wallet to reveal</h2>
              <p className={styles.emptySubtitle}>
                You need at least one unrevealed Kaomoji on Ethereum.
              </p>
            </div>
          )}

          {isConnected && nftsError && (
            <Callout variant="danger" title="Could not load Kaomoji">
              {nftsQueryError instanceof Error && isRateLimitError(nftsQueryError)
                ? 'RPC rate limit. Wait a few seconds and retry.'
                : nftsQueryError instanceof Error
                  ? nftsQueryError.message
                  : 'RPC request failed.'}
              <Button variant="secondary" className={styles.chainBtn} onClick={() => refetch()}>
                Retry
              </Button>
            </Callout>
          )}

          {showEmptyUnrevealed && (
            <div className={styles.empty}>
              <h2 className={styles.emptyTitle}>No unrevealed Kaomoji</h2>
              <p className={styles.emptySubtitle}>
                All your NFTs are already revealed. Go to Studio to edit them.
              </p>
              <Link to="/studio">
                <Button variant="primary">Open Studio</Button>
              </Link>
            </div>
          )}

          {isConnected && !nftsError && displayNft && (
            <div className={styles.revealPanel}>
              <ScratchRevealCard
                key={displayNft.tokenId}
                ref={scratchRef}
                tokenId={displayNft.tokenId}
                imageSrc={scratchImage}
                phase={phase}
                onComplete={() => setPhase('complete')}
              />

              <div className={styles.controls}>
                <p className={styles.tokenLabel}>Selected: #{displayNft.tokenId}</p>
                {showRevealBtn && (
                  <Button
                    variant="primary"
                    className={styles.revealBtn}
                    onClick={handleReveal}
                    disabled={
                      isPending ||
                      wrongChain ||
                      displayNft.revealed ||
                      phase === 'preparing'
                    }
                  >
                    {phase === 'preparing' ? 'Loading…' : 'Reveal Kaomoji'}
                  </Button>
                )}
                {canScratchFast && (
                  <Button
                    variant="primary"
                    className={styles.revealBtn}
                    onClick={handleScratchFast}
                  >
                    Scratch fast
                  </Button>
                )}
                {phase === 'complete' && (
                  <Button variant="primary" className={styles.revealBtn} disabled>
                    Fully scratched
                  </Button>
                )}
                <p className={styles.help}>
                  {phase === 'locked' &&
                    'Scratch foil is locked. Confirm reveal in your wallet first.'}
                  {phase === 'preparing' &&
                    'Stay here — fetching your on-chain sticker for the scratch card…'}
                  {phase === 'ready' &&
                    'Scratch the silver coating, or tap Scratch fast to peel it instantly.'}
                  {phase === 'complete' && 'Done — your Kaomoji is fully unveiled.'}
                </p>
              </div>
            </div>
          )}

          <TxOverlay
            status={status}
            successTitle={overlaySuccessTitle}
            onDismiss={
              status.state === 'success' || status.state === 'failed'
                ? handleTxDismiss
                : undefined
            }
          />
        </section>
      </div>
    </div>
  );
}

