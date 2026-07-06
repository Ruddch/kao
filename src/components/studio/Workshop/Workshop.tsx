import { useState, type RefObject } from 'react';
import { RoleSymbolPalette } from '../../home/RoleSymbolPalette';
import type { Document, GlyphLookup, GlyphPack, PaletteCategory } from '../../../lib/glyphs';
import type { LayoutConstants } from '../../../lib/onchain/glyphIndex';
import { MAX_UNLOCKED_SYMBOLS } from '../../../lib/onchain/normalize';
import type { KaomojiNft } from '../../../types/nft';
import { InkPanel } from '../InkPanel';
import {
  StudioGlyphEditor,
  type StudioGlyphEditorHandle,
} from '../StudioGlyphEditor';
import { ThemePicker } from '../ThemePicker';
import styles from './Workshop.module.css';

interface WorkshopProps {
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
  sacrificeCandidates: KaomojiNft[];
  onSacrifice: (burnTokenIds: string[], targetTokenId: string) => Promise<void>;
  sacrificeDisabled?: boolean;
  onBack: () => void;
}

export function Workshop({
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
  sacrificeCandidates,
  onSacrifice,
  sacrificeDisabled,
  onBack,
}: WorkshopProps) {
  const [selectedSacrificeIds, setSelectedSacrificeIds] = useState<string[]>([]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button type="button" className={styles.backBtn} onClick={onBack}>
            ← Hub
          </button>
          <h2 className={styles.workshopTitle}>Workshop · #{nft.tokenId}</h2>
        </div>
        <div className={styles.stats}>
          <span>Ink: {nft.ink}</span>
          <span>Level: {nft.level}</span>
          <span>Symbols: {nft.unlockedSymbols}/20</span>
        </div>
      </header>

      <div className={styles.editorWrap}>
        <StudioGlyphEditor
          ref={editorRef}
          pack={pack}
          lookup={lookup}
          layout={layout}
          clusters={clusters}
          onClustersChange={onClustersChange}
          themeId={themeId}
          maxSymbols={MAX_UNLOCKED_SYMBOLS}
        />
      </div>

      <div className={styles.tools}>
        <div className={styles.toolsRow}>
          <span className={styles.toolsLabel}>Background</span>
          <ThemePicker themes={layout.themes} value={themeId} onChange={onThemeChange} />
        </div>

        <div className={styles.toolsRow}>
          <span className={styles.toolsLabel}>Symbols</span>
          {palette.length > 0 ? (
            <RoleSymbolPalette categories={palette} onSymbolPick={onSymbolPick} />
          ) : (
            <p className={styles.paletteLoading}>Loading symbols…</p>
          )}
        </div>

        <InkPanel
          target={nft}
          candidates={sacrificeCandidates}
          selectedSacrificeIds={selectedSacrificeIds}
          onSacrificeSelectionChange={setSelectedSacrificeIds}
          onSacrifice={onSacrifice}
          sacrificeDisabled={sacrificeDisabled}
        />
      </div>
    </div>
  );
}
