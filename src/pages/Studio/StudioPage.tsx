import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { CollectionHub } from '../../components/studio/CollectionHub';
import { type StudioGlyphEditorHandle, type StudioEditorMode } from '../../components/studio/StudioGlyphEditor';
import { StudioWorkspace } from '../../components/studio/StudioWorkspace';
import { TxOverlay } from '../../components/studio/TxOverlay';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { COLLECTION } from '../../config/external';
import { useKaomojiWrite } from '../../hooks/useKaomojiWrite';
import { useOwnedKaomoji } from '../../hooks/useOwnedKaomoji';
import {
  animatedSymbolCountFromDocument,
  buildRolePalette,
  findInvalidAnimationSlots,
  flattenSlots,
  getFlatSlot,
  isSlotAnimated,
  loadGlyphData,
  setSlotAlt,
  slotRefFromFlatIndex,
  validateAnimationSlot,
  type Document,
  type GlyphLookup,
  type GlyphPack,
  type PaletteCategory,
} from '../../lib/glyphs';
import {
  LAYOUT_ALIGN_CENTER,
  MAX_MARKS,
  symbolGlyphIds,
} from '../../lib/onchain/compositionCodec';
import {
  documentToOnchainClusters,
  encodeDocument,
  loadLayoutConstants,
  type LayoutConstants,
} from '../../lib/onchain/glyphIndex';
import { burnReward } from '../../lib/onchain/inkMath';
import { editInkCostForDiff, type DiffResult } from '../../lib/onchain/symbolDiff';
import { isRateLimitError } from '../../lib/onchain/baseRpc';
import {
  DEFAULT_MINT_UNLOCKED_SYMBOLS,
  MAX_UNLOCKED_SYMBOLS,
} from '../../lib/onchain/normalize';
import type { KaomojiNft, StudioTxAction } from '../../types/nft';
import styles from './StudioPage.module.css';

const LAST_STUDIO_TOKEN_KEY = 'kao.studio.lastToken';

function charToGlyphKey(char: string, lookup: GlyphLookup): string | null {
  if (char === '␣') return lookup.by_char[' '] ?? null;
  return lookup.by_char[char] ?? null;
}

function countSymbols(clusters: Document): number {
  return clusters.reduce((n, c) => n + 1 + c.marks.length, 0);
}

function loadDraftFromNft(nft: KaomojiNft): {
  clusters: Document;
  themeId: number;
  layoutAlign: number;
} {
  if (nft.clusters && nft.clusters.length > 0) {
    return {
      clusters: nft.clusters,
      themeId: nft.themeId ?? 0,
      layoutAlign: nft.layoutAlign ?? LAYOUT_ALIGN_CENTER,
    };
  }
  return { clusters: [], themeId: 0, layoutAlign: LAYOUT_ALIGN_CENTER };
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function hasTooManyMarks(clusters: Document): boolean {
  return clusters.some((cluster) => cluster.marks.length > MAX_MARKS);
}

function pickDefaultTokenId(nfts: KaomojiNft[]): string | null {
  if (!nfts.length) return null;
  const unrevealed = nfts.filter((n) => !n.revealed);
  if (unrevealed.length > 0) return unrevealed[0].tokenId;
  try {
    const last = localStorage.getItem(LAST_STUDIO_TOKEN_KEY);
    if (last && nfts.some((n) => n.tokenId === last)) return last;
  } catch {
    /* ignore */
  }
  return nfts[0].tokenId;
}

function hasUnsavedDraft(
  nft: KaomojiNft | null,
  compositionChanged: boolean,
): boolean {
  if (!nft) return false;
  return compositionChanged;
}

export function StudioPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const editorRef = useRef<StudioGlyphEditorHandle>(null);
  const lastTxActionRef = useRef<StudioTxAction | null>(null);
  const lastSacrificeRewardRef = useRef<number>(0);
  const lastSacrificeBurnIdsRef = useRef<string[]>([]);
  const draftTokenRef = useRef<string | null>(null);

  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [clusters, setClusters] = useState<Document>([]);
  const [themeId, setThemeId] = useState(0);
  const [layoutAlign, setLayoutAlign] = useState(LAYOUT_ALIGN_CENTER);
  const [editCost, setEditCost] = useState<number | null>(null);
  const [editDiff, setEditDiff] = useState<DiffResult | null>(null);
  const [compositionChanged, setCompositionChanged] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [pickAltMode, setPickAltMode] = useState(false);
  const [studioMode, setStudioMode] = useState<StudioEditorMode>('edit');
  const [txSuccessTitle, setTxSuccessTitle] = useState<string | undefined>();
  const [selectedSacrificeIds, setSelectedSacrificeIds] = useState<string[]>([]);

  const [pack, setPack] = useState<GlyphPack | null>(null);
  const [lookup, setLookup] = useState<GlyphLookup | null>(null);
  const [palette, setPalette] = useState<PaletteCategory[]>([]);
  const [layout, setLayout] = useState<LayoutConstants | null>(null);
  const [glyphError, setGlyphError] = useState<string | null>(null);
  const [glyphLoading, setGlyphLoading] = useState(true);

  const {
    data: nfts = [],
    isLoading: nftsLoading,
    isError: nftsError,
    error: nftsQueryError,
    refetch,
    patchFromDraft,
    syncEntry,
    applySacrifice,
  } = useOwnedKaomoji(address);
  const { reveal, edit, sacrifice, status, isPending, resetStatus } = useKaomojiWrite();

  const wrongChain = isConnected && chainId !== COLLECTION.chainId;
  const activeNft = nfts.find((n) => n.tokenId === activeTokenId) ?? null;

  const animatedCount = useMemo(
    () => animatedSymbolCountFromDocument(clusters),
    [clusters],
  );

  useEffect(() => {
    let cancelled = false;
    setGlyphLoading(true);
    Promise.all([loadGlyphData(), loadLayoutConstants()])
      .then(([glyphData, layoutData]) => {
        if (cancelled) return;
        setPack(glyphData.pack);
        setLookup(glyphData.lookup);
        setPalette(buildRolePalette(glyphData.roleCategories, glyphData.pack));
        setLayout(layoutData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setGlyphError(err instanceof Error ? err.message : 'Failed to load editor');
      })
      .finally(() => {
        if (!cancelled) setGlyphLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!nfts.length) {
      setActiveTokenId(null);
      draftTokenRef.current = null;
      return;
    }

    if (activeTokenId && nfts.some((n) => n.tokenId === activeTokenId)) {
      return;
    }

    const defaultId = pickDefaultTokenId(nfts);
    if (!defaultId) return;

    const nft = nfts.find((n) => n.tokenId === defaultId)!;
    const draft = loadDraftFromNft(nft);
    draftTokenRef.current = defaultId;
    setActiveTokenId(defaultId);
    setClusters(draft.clusters);
    setThemeId(draft.themeId);
    setLayoutAlign(draft.layoutAlign);
  }, [nfts, activeTokenId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const draftBytes = await encodeDocument(clusters, themeId, layoutAlign);
        const onchainClusters = await documentToOnchainClusters(clusters);

        if (activeNft?.composition && activeNft.composition.length > 0) {
          if (!cancelled) {
            setCompositionChanged(!bytesEqual(draftBytes, activeNft.composition));
          }
        } else if (!cancelled) {
          setCompositionChanged(countSymbols(clusters) > 0 || themeId !== 0);
        }

        if (!activeNft?.revealed || !activeNft.clusters) {
          if (!cancelled) {
            setEditCost(null);
            setEditDiff(null);
          }
          return;
        }

        const [oldOnchain, newOnchain] = await Promise.all([
          documentToOnchainClusters(activeNft.clusters),
          Promise.resolve(onchainClusters),
        ]);
        const { cost, diffResult } = editInkCostForDiff(
          activeNft.unlockedSymbols,
          symbolGlyphIds(oldOnchain),
          symbolGlyphIds(newOnchain),
        );
        if (!cancelled) {
          setEditCost(cost);
          setEditDiff(diffResult);
        }
      } catch {
        if (!cancelled) {
          setEditCost(null);
          setEditDiff(null);
          setCompositionChanged(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeNft, clusters, themeId, layoutAlign]);

  useEffect(() => {
    if (status.state !== 'success') return;

    const action = lastTxActionRef.current;
    const tokenId = activeTokenId;
    resetStatus();
    lastTxActionRef.current = null;
    lastSacrificeBurnIdsRef.current = [];

    if (action === 'sacrifice') {
      return;
    }

    if (!tokenId || !pack || !layout) return;

    if (action === 'reveal' || action === 'edit') {
      patchFromDraft(tokenId, {
        clusters,
        themeId,
        layoutAlign,
        pack,
        layout,
        revealed: action === 'reveal' ? true : undefined,
      });
    }

    void syncEntry(tokenId);
  }, [
    status.state,
    activeTokenId,
    clusters,
    themeId,
    layoutAlign,
    pack,
    layout,
    patchFromDraft,
    syncEntry,
    resetStatus,
  ]);

  // Editor allows drafting up to MAX_UNLOCKED_SYMBOLS; reveal is capped at mint limit.
  const editorMaxSymbols = activeNft?.revealed
    ? MAX_UNLOCKED_SYMBOLS
    : activeNft?.mintUnlockedSymbols || DEFAULT_MINT_UNLOCKED_SYMBOLS;

  const maxAnimated = activeNft
    ? activeNft.revealed
      ? activeNft.animatedUnlocked
      : 0
    : 0;

  const animationEnabled = Boolean(activeNft?.revealed);
  const animationInvalidReason = pack ? findInvalidAnimationSlots(clusters, pack) : null;

  const selectedSlotRef = selectedSlot !== null ? slotRefFromFlatIndex(clusters, selectedSlot) : null;
  const selectedCluster =
    selectedSlotRef !== null ? clusters[selectedSlotRef.clusterIdx] : null;
  const selectedIsAnimated =
    selectedCluster && selectedSlotRef
      ? isSlotAnimated(selectedCluster, selectedSlotRef.kind, selectedSlotRef.markIdx)
      : false;

  useEffect(() => {
    if (selectedSlot === null) return;
    const flat = flattenSlots(clusters);
    if (!flat.some((slot) => slot.flatIndex === selectedSlot)) {
      setSelectedSlot(null);
      setPickAltMode(false);
    }
  }, [clusters, selectedSlot]);

  const symbolCount = countSymbols(clusters);
  const tooManyMarks = hasTooManyMarks(clusters);
  const newUnlocked =
    activeNft?.revealed && editDiff
      ? activeNft.unlockedSymbols + editDiff.newSlots
      : activeNft?.unlockedSymbols ?? 0;

  const canEdit =
    activeNft?.revealed &&
    compositionChanged &&
    editCost !== null &&
    editCost <= activeNft.ink &&
    symbolCount <= newUnlocked &&
    newUnlocked <= MAX_UNLOCKED_SYMBOLS &&
    animatedCount <= maxAnimated &&
    !tooManyMarks &&
    !animationInvalidReason;

  const sacrificeCandidates = nfts.filter(
    (n) =>
      n.revealed &&
      n.tokenId !== activeTokenId &&
      n.unlockedSymbols >= DEFAULT_MINT_UNLOCKED_SYMBOLS,
  );

  const sacrificeInkReward = useMemo(
    () =>
      selectedSacrificeIds.reduce((sum, id) => {
        const burnNft = sacrificeCandidates.find((n) => n.tokenId === id);
        return sum + (burnNft ? burnReward(burnNft.unlockedSymbols) : 0);
      }, 0),
    [selectedSacrificeIds, sacrificeCandidates],
  );

  const focusEditor = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        editorRef.current?.focus();
        document.getElementById('studio-editor-anchor')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    });
  }, []);

  const selectNft = useCallback(
    (nft: KaomojiNft) => {
      if (
        activeTokenId &&
        activeTokenId !== nft.tokenId &&
        hasUnsavedDraft(activeNft, compositionChanged) &&
        !window.confirm('Discard unsaved changes?')
      ) {
        return;
      }

      const draft = loadDraftFromNft(nft);
      draftTokenRef.current = nft.tokenId;
      setActiveTokenId(nft.tokenId);
      setClusters(draft.clusters);
      setThemeId(draft.themeId);
      setLayoutAlign(draft.layoutAlign);
      setSelectedSlot(null);
      setPickAltMode(false);
      setSelectedSacrificeIds([]);
      setStudioMode('edit');
      try {
        localStorage.setItem(LAST_STUDIO_TOKEN_KEY, nft.tokenId);
      } catch {
        /* ignore */
      }
      focusEditor();
    },
    [activeTokenId, activeNft, compositionChanged, focusEditor],
  );

  const handleReveal = async () => {
    if (!activeNft) return;
    lastTxActionRef.current = 'reveal';
    await reveal(activeNft.tokenId);
  };

  const handleEdit = async () => {
    if (!activeNft?.revealed) return;
    lastTxActionRef.current = 'edit';
    await edit(activeNft.tokenId, clusters, themeId, layoutAlign);
  };

  const handleSacrifice = async (burnIds: string[], targetId: string) => {
    const inkReward = burnIds.reduce((sum, id) => {
      const burnNft = nfts.find((n) => n.tokenId === id);
      return sum + (burnNft ? burnReward(burnNft.unlockedSymbols) : 0);
    }, 0);
    lastSacrificeBurnIdsRef.current = burnIds;
    lastSacrificeRewardRef.current = inkReward;
    lastTxActionRef.current = 'sacrifice';
    await sacrifice(burnIds, targetId);
    applySacrifice(burnIds, targetId, inkReward);
  };

  const handleSymbolPick = (symbol: string) => {
    if (studioMode === 'animate') {
      if (!lookup || !pack || !selectedSlotRef) return;

      const cluster = clusters[selectedSlotRef.clusterIdx];
      const slotAlreadyAnimated = isSlotAnimated(
        cluster,
        selectedSlotRef.kind,
        selectedSlotRef.markIdx,
      );

      // Animate tab never adds symbols — only assigns/changes Frame B on the selected slot.
      if (!pickAltMode && !slotAlreadyAnimated) return;

      const altKey = charToGlyphKey(symbol, lookup);
      if (!altKey) return;

      const frameAKey =
        selectedSlotRef.kind === 'base'
          ? cluster.base
          : cluster.marks[selectedSlotRef.markIdx ?? 0];

      const validation = validateAnimationSlot(pack, frameAKey, altKey);
      if (!validation.ok) return;

      const ref = selectedSlotRef;
      setClusters(setSlotAlt(clusters, ref, altKey));
      setPickAltMode(false);
      return;
    }

    editorRef.current?.insertAtCaret(symbol);
  };

  const handleStudioModeChange = useCallback((mode: StudioEditorMode) => {
    setStudioMode(mode);
    if (mode === 'edit') {
      setSelectedSlot(null);
      setPickAltMode(false);
      requestAnimationFrame(() => editorRef.current?.focus());
    } else {
      setPickAltMode(false);
    }
  }, []);

  const handleSlotSelect = useCallback(
    (flatIndex: number) => {
      setSelectedSlot(flatIndex);

      const ref = slotRefFromFlatIndex(clusters, flatIndex);
      if (!ref) return;

      const cluster = clusters[ref.clusterIdx];
      const alreadyAnimated = isSlotAnimated(cluster, ref.kind, ref.markIdx);
      setPickAltMode(!alreadyAnimated);
    },
    [clusters],
  );

  const handleRemoveAnimation = useCallback(() => {
    if (selectedSlotRef === null) return;
    setClusters(setSlotAlt(clusters, selectedSlotRef, undefined));
    setPickAltMode(false);
  }, [clusters, selectedSlotRef]);

  const handleTxDismiss = useCallback(async () => {
    const action = lastTxActionRef.current;
    resetStatus();
    setTxSuccessTitle(undefined);

    const { data: fresh } = await refetch();

    if (activeTokenId && fresh) {
      const updated = fresh.find((n) => n.tokenId === activeTokenId);
      if (updated && (action === 'edit' || action === 'reveal')) {
        const draft = loadDraftFromNft(updated);
        setClusters(draft.clusters);
        setThemeId(draft.themeId);
        setLayoutAlign(draft.layoutAlign);
        draftTokenRef.current = activeTokenId;
      }
    }

    lastTxActionRef.current = null;
  }, [resetStatus, refetch, activeTokenId]);

  const getActionMeta = (): {
    label: string;
    disabled: boolean;
    reason?: string;
    onPrimary: () => void;
  } => {
    if (!activeNft) {
      return { label: 'Select a Kaomoji', disabled: true, onPrimary: () => {} };
    }

    if (!activeNft.revealed) {
      return {
        label: 'Reveal Kaomoji',
        disabled: isPending || wrongChain,
        onPrimary: handleReveal,
      };
    }

    let reason: string | undefined;
    if (editCost === null) reason = 'Calculating edit cost…';
    else if (!compositionChanged) reason = 'No changes to apply';
    else if (tooManyMarks) {
      reason = `Max ${MAX_MARKS} combining marks per symbol`;
    } else if (newUnlocked > MAX_UNLOCKED_SYMBOLS) {
      reason = `Max ${MAX_UNLOCKED_SYMBOLS} symbol slots on-chain`;
    } else if (symbolCount > newUnlocked) {
      reason = `Composition uses ${symbolCount} symbols but edit unlocks only ${newUnlocked}`;
    } else if (animatedCount > maxAnimated) {
      reason = `Not enough animated symbol slots unlocked (${animatedCount} used, ${maxAnimated} available)`;
    } else if (animationInvalidReason) {
      reason = animationInvalidReason;
    } else if (editCost > activeNft.ink) {
      reason = `Need ${editCost - activeNft.ink} more Ink — sacrifice below`;
    }

    const costLabel =
      editCost !== null && editCost > 0 ? `Apply edit — ${editCost} Ink` : 'Apply edit';

    return {
      label: costLabel,
      disabled: isPending || wrongChain || symbolCount === 0 || !canEdit,
      reason,
      onPrimary: handleEdit,
    };
  };

  const actionMeta = getActionMeta();

  const canRemoveAnimation = selectedSlotRef !== null && selectedIsAnimated;

  const selectedSlotPreview = useMemo(() => {
    if (selectedSlot === null || !pack) return null;
    const slot = getFlatSlot(clusters, selectedSlot);
    if (!slot) return null;
    const frameA = pack.symbols[slot.frameAKey]?.char ?? '?';
    const frameB = slot.frameBKey ? pack.symbols[slot.frameBKey]?.char : null;
    return { frameA, frameB, animated: Boolean(frameB) };
  }, [clusters, pack, selectedSlot]);

  const renderWorkspace = () => {
    if (glyphLoading) {
      return <p className={styles.loading}>Loading editor…</p>;
    }
    if (glyphError) {
      return <p className={styles.error}>{glyphError}</p>;
    }

    if (!isConnected) {
      return (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Kaomoji Studio</h2>
          <p className={styles.emptySubtitle}>
            Connect your wallet in the header to reveal, edit, and upgrade your Kaomoji on Base.
          </p>
        </div>
      );
    }

    if (nftsError) {
      return (
        <Callout variant="danger" title="Could not load Kaomoji">
          {nftsQueryError instanceof Error && isRateLimitError(nftsQueryError)
            ? 'RPC rate limit — loading many Kaomoji takes a moment. Wait a few seconds and hit Retry (reads go through your wallet provider when connected).'
            : nftsQueryError instanceof Error
              ? nftsQueryError.message
              : 'RPC request failed.'}
          <Button variant="secondary" className={styles.chainBtn} onClick={() => refetch()}>
            Retry
          </Button>
        </Callout>
      );
    }

    if (nftsLoading) {
      return <p className={styles.loading}>Loading your Kaomoji…</p>;
    }

    if (nfts.length === 0) {
      return (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Mint your first Kaomoji</h2>
          <p className={styles.emptySubtitle}>
            Studio opens after you own at least one Kaomoji on Base.
          </p>
          <Link to="/checker">
            <Button variant="primary">Go to Checker</Button>
          </Link>
        </div>
      );
    }

    if (!pack || !lookup || !layout || !activeNft) {
      return <p className={styles.loading}>Loading…</p>;
    }

    return (
      <StudioWorkspace
        nft={activeNft}
        editorRef={editorRef}
        pack={pack}
        lookup={lookup}
        layout={layout}
        clusters={clusters}
        onClustersChange={setClusters}
        themeId={themeId}
        onThemeChange={setThemeId}
        palette={palette}
        onSymbolPick={handleSymbolPick}
        maxSymbols={editorMaxSymbols}
        editCost={editCost}
        editDiff={editDiff}
        compositionChanged={compositionChanged}
        sacrificeCandidates={sacrificeCandidates}
        selectedSacrificeIds={selectedSacrificeIds}
        onSacrificeSelectionChange={setSelectedSacrificeIds}
        sacrificeInkReward={sacrificeInkReward}
        onSacrifice={handleSacrifice}
        sacrificeDisabled={isPending || wrongChain}
        primaryLabel={actionMeta.label}
        onPrimary={actionMeta.onPrimary}
        primaryDisabled={actionMeta.disabled}
        actionReason={actionMeta.reason}
        loading={isPending}
        animationEnabled={animationEnabled}
        animatedCount={animatedCount}
        selectedSlot={selectedSlot}
        onSlotSelect={handleSlotSelect}
        pickAltMode={pickAltMode}
        onRemoveAnimation={handleRemoveAnimation}
        canRemoveAnimation={canRemoveAnimation}
        studioMode={studioMode}
        onStudioModeChange={handleStudioModeChange}
        selectedSlotPreview={selectedSlotPreview}
      />
    );
  };

  return (
    <div className={styles.studio}>
      {wrongChain && (
        <div className={styles.banner}>
          <Callout variant="warning" title="Wrong network">
            Switch to Base to manage your Kaomoji.
            <Button
              variant="secondary"
              className={styles.chainBtn}
              onClick={() => switchChain({ chainId: base.id })}
            >
              Switch to Base
            </Button>
          </Callout>
        </div>
      )}

      <div className={styles.main}>
        {isConnected && !nftsError && pack && lookup && layout && (
          <CollectionHub
            nfts={nfts}
            activeTokenId={activeTokenId}
            loading={nftsLoading}
            onSelect={selectNft}
          />
        )}

        <div
          className={[
            styles.workspace,
            status.state !== 'idle' && styles.workspaceScrollLock,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {renderWorkspace()}
          <TxOverlay
            status={status}
            successTitle={txSuccessTitle}
            onDismiss={
              status.state === 'success' || status.state === 'failed'
                ? handleTxDismiss
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
