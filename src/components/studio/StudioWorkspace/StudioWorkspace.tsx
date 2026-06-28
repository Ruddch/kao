import type { RefObject } from 'react';
import { RoleSymbolPalette } from '../../home/RoleSymbolPalette';
import type { Document, GlyphLookup, GlyphPack, PaletteCategory } from '../../../lib/glyphs';
import type { DiffResult } from '../../../lib/onchain/symbolDiff';
import type { LayoutConstants } from '../../../lib/onchain/glyphIndex';
import { MAX_UNLOCKED_SYMBOLS } from '../../../lib/onchain/normalize';
import type { KaomojiNft } from '../../../types/nft';
import { Button } from '../../ui/Button';
import { InkPanel } from '../InkPanel';
import {
  StudioGlyphEditor,
  type StudioEditorMode,
  type StudioGlyphEditorHandle,
} from '../StudioGlyphEditor';
import { ThemePicker } from '../ThemePicker';
import styles from './StudioWorkspace.module.css';

interface SelectedSlotPreview {
  frameA: string;
  frameB: string | null;
  animated: boolean;
}

interface StudioWorkspaceProps {
  nft: KaomojiNft;
  editorRef: RefObject<StudioGlyphEditorHandle | null>;
  pack: GlyphPack;
  lookup: GlyphLookup;
  layout: LayoutConstants;
  clusters: Document;
  onClustersChange: (clusters: Document) => void;
  themeId: number;
  onThemeChange: (themeId: number) => void;
  palette: PaletteCategory[];
  onSymbolPick: (symbol: string) => void;
  maxSymbols: number;
  symbolCount: number;
  editCost: number | null;
  editDiff: DiffResult | null;
  compositionChanged: boolean;
  sacrificeCandidates: KaomojiNft[];
  onSacrifice: (burnTokenId: string, targetTokenId: string) => Promise<void>;
  sacrificeDisabled?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  actionReason?: string;
  loading?: boolean;
  animationEnabled?: boolean;
  maxAnimated?: number;
  animatedCount?: number;
  selectedSlot?: number | null;
  onSlotSelect?: (flatIndex: number) => void;
  pickAltMode?: boolean;
  onRemoveAnimation?: () => void;
  canRemoveAnimation?: boolean;
  studioMode?: StudioEditorMode;
  onStudioModeChange?: (mode: StudioEditorMode) => void;
  selectedSlotPreview?: SelectedSlotPreview | null;
  animLimitHint?: string | null;
}

export function StudioWorkspace({
  nft,
  editorRef,
  pack,
  lookup,
  layout,
  clusters,
  onClustersChange,
  themeId,
  onThemeChange,
  palette,
  onSymbolPick,
  maxSymbols,
  symbolCount,
  editCost,
  editDiff,
  compositionChanged,
  sacrificeCandidates,
  onSacrifice,
  sacrificeDisabled,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  actionReason,
  loading,
  animationEnabled,
  maxAnimated = 0,
  animatedCount = 0,
  selectedSlot,
  onSlotSelect,
  pickAltMode,
  onRemoveAnimation,
  canRemoveAnimation,
  studioMode = 'edit',
  onStudioModeChange,
  selectedSlotPreview,
  animLimitHint,
}: StudioWorkspaceProps) {
  const isAnimateMode = studioMode === 'animate';

  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <div className={styles.previewCol} id="studio-editor-anchor">
          <span className={styles.previewLabel}>Preview</span>
          {animationEnabled && maxAnimated > 0 && onStudioModeChange && (
            <div className={styles.modeSwitch} role="tablist" aria-label="Editor mode">
              <button
                type="button"
                role="tab"
                aria-selected={studioMode === 'edit'}
                className={[styles.modeBtn, studioMode === 'edit' && styles.modeBtnActive]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onStudioModeChange('edit')}
              >
                Edit
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={studioMode === 'animate'}
                className={[styles.modeBtn, studioMode === 'animate' && styles.modeBtnActive]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onStudioModeChange('animate')}
              >
                Animate
              </button>
            </div>
          )}

          {isAnimateMode && (
            <ol className={styles.animSteps}>
              <li className={selectedSlot !== null ? styles.animStepDone : styles.animStepActive}>
                1. Click a symbol in the preview
              </li>
              <li
                className={
                  pickAltMode
                    ? styles.animStepActive
                    : selectedSlotPreview?.animated
                      ? styles.animStepDone
                      : undefined
                }
              >
                2. Pick the <strong>second frame</strong> from the palette
              </li>
              <li>3. Apply edit to save on-chain</li>
            </ol>
          )}

          <StudioGlyphEditor
            ref={editorRef}
            pack={pack}
            lookup={lookup}
            layout={layout}
            clusters={clusters}
            onClustersChange={onClustersChange}
            themeId={themeId}
            maxSymbols={maxSymbols}
            emptyHint="Pick symbols →"
            selectedSlot={selectedSlot}
            onSlotSelect={onSlotSelect}
            pickAltMode={pickAltMode}
            mode={studioMode}
          />

          {isAnimateMode && selectedSlotPreview && (
            <div className={styles.slotPanel}>
              <span className={styles.slotPanelLabel}>Selected slot</span>
              <p className={styles.slotPanelFrames}>
                Frame A: <strong className="kao">{selectedSlotPreview.frameA}</strong>
                {selectedSlotPreview.frameB ? (
                  <>
                    {' '}
                    ↔ Frame B: <strong className="kao">{selectedSlotPreview.frameB}</strong>
                  </>
                ) : pickAltMode ? (
                  <> → pick Frame B from palette</>
                ) : null}
              </p>
            </div>
          )}

          {animLimitHint && <p className={styles.animLimitHint}>{animLimitHint}</p>}

          {isAnimateMode && canRemoveAnimation && (
            <div className={styles.animToolbar}>
              <button type="button" className={styles.animBtn} onClick={onRemoveAnimation}>
                Remove animation from slot
              </button>
            </div>
          )}

          {nft.revealed ? (
            <p className={styles.stats}>
              Ink {nft.ink} · Lvl {nft.level} · {nft.unlockedSymbols}/{MAX_UNLOCKED_SYMBOLS} slots
              {maxAnimated > 0 && ` · ${animatedCount}/${maxAnimated} anim`}
            </p>
          ) : (
            <p className={styles.stats}>
              {symbolCount}/{maxSymbols} symbols
            </p>
          )}
        </div>

        <div className={styles.toolsCol}>
          <div className={styles.block}>
            <span className={styles.label}>Background</span>
            <ThemePicker themes={layout.themes} value={themeId} onChange={onThemeChange} />
          </div>

          <div
            className={[styles.block, isAnimateMode && pickAltMode && styles.blockPickAlt]
              .filter(Boolean)
              .join(' ')}
          >
            <span className={styles.label}>
              {isAnimateMode
                ? pickAltMode
                  ? 'Pick Frame B (2nd symbol)'
                  : 'Symbols — Frame B only'
                : 'Symbols — tap to add'}
            </span>
            <p className={styles.hint}>
              {isAnimateMode && pickAltMode
                ? `Choose a different symbol — preview will alternate ${selectedSlotPreview?.frameA ?? 'A'} ↔ your pick. Must differ from Frame A.`
                : isAnimateMode
                  ? animLimitHint ??
                    (selectedSlotPreview?.animated
                      ? 'Pick a symbol to change Frame B, or select another slot.'
                      : 'Select a symbol in the preview, then pick Frame B. Symbols are not added in Animate mode.')
                  : 'Modifiers attach to the last symbol. Each layer = 1 slot.'}
            </p>
            {palette.length > 0 ? (
              <RoleSymbolPalette categories={palette} onSymbolPick={onSymbolPick} />
            ) : (
              <p className={styles.paletteLoading}>Loading symbols…</p>
            )}
          </div>

          {nft.revealed && (
            <InkPanel
              target={nft}
              editCost={editCost}
              editDiff={editDiff}
              compositionChanged={compositionChanged}
              candidates={sacrificeCandidates}
              onSacrifice={onSacrifice}
              sacrificeDisabled={sacrificeDisabled}
              animatedCount={animatedCount}
              maxAnimated={maxAnimated}
            />
          )}

          <div className={styles.actionBlock}>
            {actionReason && <p className={styles.actionReason}>{actionReason}</p>}
            <Button variant="primary" disabled={primaryDisabled || loading} onClick={onPrimary}>
              {loading ? '…' : primaryLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
