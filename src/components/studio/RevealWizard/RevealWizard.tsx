import { useMemo, type RefObject } from 'react';
import { RoleSymbolPalette } from '../../home/RoleSymbolPalette';
import {
  clustersToText,
  type Document,
  type GlyphLookup,
  type GlyphPack,
  type PaletteCategory,
} from '../../../lib/glyphs';
import type { LayoutConstants } from '../../../lib/onchain/glyphIndex';
import { buildOnchainStickerSvg, stickerSvgToDataUrl } from '../../../lib/onchain/stickerSvg';
import type { KaomojiNft, RevealStep } from '../../../types/nft';
import {
  StudioGlyphEditor,
  type StudioGlyphEditorHandle,
} from '../StudioGlyphEditor';
import { ThemePicker } from '../ThemePicker';
import styles from './RevealWizard.module.css';

const STEP_LABELS: Record<RevealStep, string> = {
  design: 'Design',
  theme: 'Theme',
  review: 'Review',
};

interface RevealWizardProps {
  nft: KaomojiNft;
  step: RevealStep;
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
  onBack: () => void;
}

export function RevealWizard({
  nft,
  step,
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
  onBack,
}: RevealWizardProps) {
  const steps: RevealStep[] = ['design', 'theme', 'review'];
  const stepIndex = steps.indexOf(step);

  const reviewUrl = useMemo(
    () => stickerSvgToDataUrl(buildOnchainStickerSvg(clusters, pack, layout, themeId)),
    [clusters, pack, layout, themeId],
  );

  const symbolCount = clusters.reduce((n, c) => n + 1 + c.marks.length, 0);
  const previewText = clustersToText(clusters, pack);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button type="button" className={styles.backBtn} onClick={onBack}>
            ← Hub
          </button>
          <h2 className={styles.title}>Reveal · #{nft.tokenId}</h2>
        </div>
        <span className={styles.limit}>Limit: {maxSymbols} symbols</span>
      </header>

      <div className={styles.steps} role="tablist" aria-label="Reveal steps">
        {steps.map((s, i) => (
          <span
            key={s}
            className={
              i === stepIndex ? styles.stepActive : i < stepIndex ? styles.stepDone : styles.step
            }
            aria-current={i === stepIndex ? 'step' : undefined}
          >
            {STEP_LABELS[s]}
          </span>
        ))}
      </div>

      {step === 'review' ? (
        <div className={styles.review}>
          <img src={reviewUrl} alt={`Kaomoji #${nft.tokenId} preview`} className={styles.reviewImg} />
          <p className={styles.reviewMeta}>
            #{nft.tokenId} · {symbolCount}/{maxSymbols} symbols · theme {themeId + 1}
            {previewText && (
              <>
                <br />
                {previewText}
              </>
            )}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.editorWrap}>
            <StudioGlyphEditor
              ref={editorRef}
              pack={pack}
              lookup={lookup}
              layout={layout}
              clusters={clusters}
              onClustersChange={onClustersChange}
              themeId={themeId}
              maxSymbols={maxSymbols}
            />
          </div>

          {step === 'theme' && (
            <div className={styles.tools}>
              <span className={styles.toolsLabel}>Background</span>
              <ThemePicker themes={layout.themes} value={themeId} onChange={onThemeChange} />
            </div>
          )}

          {step === 'design' && (
            <div className={styles.tools}>
              <span className={styles.toolsLabel}>Symbols</span>
              {palette.length > 0 ? (
                <RoleSymbolPalette categories={palette} onSymbolPick={onSymbolPick} />
              ) : (
                <p className={styles.paletteLoading}>Loading symbols…</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
