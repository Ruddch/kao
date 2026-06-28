import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  flattenSlots,
  getFontFamilyForChar,
  hasDocumentAnimation,
  type Document,
  type FlatSlot,
  type GlyphLookup,
  type GlyphPack,
} from '../../../lib/glyphs';
import type { OnchainLayoutConstants } from '../../../lib/onchain/glyphIndex';
import { computeStickerLayout } from '../../../lib/onchain/stickerLayout';
import styles from './KaomojiAnimatedPreview.module.css';

const DISPLAY_CANVAS = 360;
const DISPLAY_CANVAS_COMPACT = 120;

export interface KaomojiAnimatedPreviewProps {
  clusters: Document;
  pack: GlyphPack;
  lookup: GlyphLookup;
  layout: OnchainLayoutConstants;
  themeId: number;
  /** Whole-face crossfade when the document has animation slots. */
  playAnimation?: boolean;
  compact?: boolean;
  selectedSlot?: number | null;
  onSlotSelect?: (flatIndex: number) => void;
}

function slotDisplayKey(slot: FlatSlot, variant: 'A' | 'B'): string {
  if (variant === 'A') return slot.frameAKey;
  return slot.frameBKey ?? slot.frameAKey;
}

function renderSlotChar(
  key: string,
  pack: GlyphPack,
  lookup: GlyphLookup,
  className: string,
) {
  const glyph = pack.symbols[key];
  const char = glyph?.char ?? '?';
  return (
    <span className={className} style={{ fontFamily: getFontFamilyForChar(char, pack, lookup) }}>
      {char}
    </span>
  );
}

function FaceGlyphRow({
  slots,
  variant,
  pack,
  lookup,
  fontSize,
  layerClass,
}: {
  slots: FlatSlot[];
  variant: 'A' | 'B';
  pack: GlyphPack;
  lookup: GlyphLookup;
  fontSize: number;
  layerClass?: string;
}) {
  if (slots.length === 0) {
    return <span className={[styles.glyphRow, layerClass].filter(Boolean).join(' ')}>{'\u00a0'}</span>;
  }

  return (
    <span
      className={[styles.glyphRow, styles.faceLayer, layerClass].filter(Boolean).join(' ')}
      style={{ fontSize: `${fontSize}px` }}
      aria-hidden="true"
    >
      {slots.map((slot) => (
        <span key={`${variant}-${slot.flatIndex}`} className={styles.slot}>
          {renderSlotChar(slotDisplayKey(slot, variant), pack, lookup, styles.animFrame)}
        </span>
      ))}
    </span>
  );
}

function SlotHitRow({
  slots,
  pack,
  lookup,
  fontSize,
  selectedSlot,
  onSlotSelect,
}: {
  slots: FlatSlot[];
  pack: GlyphPack;
  lookup: GlyphLookup;
  fontSize: number;
  selectedSlot?: number | null;
  onSlotSelect: (flatIndex: number) => void;
}) {
  const handleSlotClick = (event: MouseEvent, flatIndex: number) => {
    event.stopPropagation();
    event.preventDefault();
    onSlotSelect(flatIndex);
  };

  return (
    <span
      className={[styles.glyphRow, styles.hitRow].join(' ')}
      style={{ fontSize: `${fontSize}px` }}
    >
      {slots.map((slot) => {
        const selected = selectedSlot === slot.flatIndex;
        const animated = Boolean(slot.frameBKey);
        return (
          <span
            key={slot.flatIndex}
            className={[
              styles.slot,
              styles.slotHit,
              animated && styles.slotAnimated,
              selected && styles.slotSelected,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={(e) => handleSlotClick(e, slot.flatIndex)}
            onPointerDown={(e) => e.stopPropagation()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSlotSelect(slot.flatIndex);
              }
            }}
            aria-pressed={selected}
            aria-label={`Symbol slot ${slot.flatIndex + 1}`}
          >
            {renderSlotChar(slot.frameAKey, pack, lookup, styles.animFrame)}
          </span>
        );
      })}
    </span>
  );
}

/** DOM glyph preview — same fonts/layout as edit; whole-face crossfade when animated. */
export function KaomojiAnimatedPreview({
  clusters,
  pack,
  lookup,
  layout,
  themeId,
  playAnimation = false,
  compact,
  selectedSlot,
  onSlotSelect,
}: KaomojiAnimatedPreviewProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const interactive = Boolean(onSlotSelect);
  const animated = hasDocumentAnimation(clusters);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const fontSize = useMemo(() => {
    const sticker = computeStickerLayout(clusters, pack, layout, themeId);
    const displayCanvas = compact ? DISPLAY_CANVAS_COMPACT : DISPLAY_CANVAS;
    return sticker.fontSize * (displayCanvas / sticker.canvas);
  }, [clusters, pack, layout, themeId, compact]);

  const slots = useMemo(() => flattenSlots(clusters), [clusters]);
  const showCrossfade = animated && playAnimation && !reducedMotion;

  return (
    <span className={styles.composeStack}>
      {showCrossfade ? (
        <>
          <FaceGlyphRow
            slots={slots}
            variant="A"
            pack={pack}
            lookup={lookup}
            fontSize={fontSize}
            layerClass={styles.faceLayerA}
          />
          <FaceGlyphRow
            slots={slots}
            variant="B"
            pack={pack}
            lookup={lookup}
            fontSize={fontSize}
            layerClass={styles.faceLayerB}
          />
        </>
      ) : (
        <FaceGlyphRow
          slots={slots}
          variant="A"
          pack={pack}
          lookup={lookup}
          fontSize={fontSize}
        />
      )}
      {interactive && onSlotSelect && (
        <SlotHitRow
          slots={slots}
          pack={pack}
          lookup={lookup}
          fontSize={fontSize}
          selectedSlot={selectedSlot}
          onSlotSelect={onSlotSelect}
        />
      )}
    </span>
  );
}
