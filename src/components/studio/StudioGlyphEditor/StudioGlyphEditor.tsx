import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  clustersToText,
  parseText,
  type Document,
  type GlyphLookup,
  type GlyphPack,
} from '../../../lib/glyphs';
import type { OnchainLayoutConstants } from '../../../lib/onchain/glyphIndex';
import { computeStickerLayout } from '../../../lib/onchain/stickerLayout';
import { KaomojiAnimatedPreview } from '../KaomojiAnimatedPreview';
import styles from './StudioGlyphEditor.module.css';

export interface StudioGlyphEditorHandle {
  focus: () => void;
  insertAtCaret: (symbol: string) => void;
  getCaret: () => number;
}

export type StudioEditorMode = 'edit' | 'animate';

interface StudioGlyphEditorProps {
  pack: GlyphPack;
  lookup: GlyphLookup;
  layout: OnchainLayoutConstants;
  clusters: Document;
  onClustersChange: (clusters: Document) => void;
  themeId: number;
  maxSymbols: number;
  compact?: boolean;
  emptyHint?: string;
  selectedSlot?: number | null;
  onSlotSelect?: (flatIndex: number) => void;
  pickAltMode?: boolean;
  mode?: StudioEditorMode;
}

function countSymbols(clusters: Document): number {
  return clusters.reduce((n, c) => n + 1 + c.marks.length, 0);
}

const DISPLAY_CANVAS = 360;
const DISPLAY_CANVAS_COMPACT = 280;

export const StudioGlyphEditor = forwardRef<StudioGlyphEditorHandle, StudioGlyphEditorProps>(
  function StudioGlyphEditor(
    {
      pack,
      lookup,
      layout,
      clusters,
      onClustersChange,
      themeId,
      maxSymbols,
      compact,
      emptyHint,
      selectedSlot,
      onSlotSelect,
      pickAltMode,
      mode = 'edit',
    },
    ref,
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const pendingSelectionRef = useRef<{ caret: number; focus: boolean } | null>(null);
    const [shake, setShake] = useState(false);
    const [combiningError, setCombiningError] = useState(false);
    const [marksError, setMarksError] = useState(false);

    const isAnimateMode = mode === 'animate';
    const text = clustersToText(clusters, pack);
    const symbolCount = countSymbols(clusters);
    const isEmpty = symbolCount === 0;

    const sticker = useMemo(
      () => computeStickerLayout(clusters, pack, layout, themeId),
      [clusters, pack, layout, themeId],
    );

    const displayCanvas = compact ? DISPLAY_CANVAS_COMPACT : DISPLAY_CANVAS;
    const unit = displayCanvas / sticker.canvas;
    const fontSize = sticker.fontSize * unit;

    const canvasStyle = useMemo(
      () =>
        ({
          '--display-canvas': `${displayCanvas}px`,
          '--theme-bg': sticker.themeHex,
          '--shadow-fill': layout.shadowFill,
          '--card-fill': layout.cardFill,
          '--card-stroke': layout.cardStroke,
          '--glyph-fill': layout.glyphFill,
          '--text-size': `${fontSize}px`,
        }) as CSSProperties,
      [sticker, layout, displayCanvas, fontSize],
    );

    const shadowStyle = useMemo(
      () =>
        ({
          left: sticker.shadowX * unit,
          top: sticker.shadowY * unit,
          width: sticker.cardW * unit,
          height: sticker.cardH * unit,
        }) as CSSProperties,
      [sticker, unit],
    );

    const cardStyle = useMemo(
      () =>
        ({
          left: sticker.cardX * unit,
          top: sticker.cardY * unit,
          width: sticker.cardW * unit,
          height: sticker.cardH * unit,
          borderWidth: layout.stroke * unit,
        }) as CSSProperties,
      [sticker, unit, layout.stroke],
    );

    useEffect(() => {
      if (!shake) return;
      const timer = window.setTimeout(() => setShake(false), 360);
      return () => window.clearTimeout(timer);
    }, [shake]);

    useEffect(() => {
      if (!combiningError) return;
      const timer = window.setTimeout(() => setCombiningError(false), 2000);
      return () => window.clearTimeout(timer);
    }, [combiningError]);

    useEffect(() => {
      if (!marksError) return;
      const timer = window.setTimeout(() => setMarksError(false), 2000);
      return () => window.clearTimeout(timer);
    }, [marksError]);

    useLayoutEffect(() => {
      const pending = pendingSelectionRef.current;
      if (!pending) return;
      pendingSelectionRef.current = null;
      const el = textareaRef.current;
      if (!el) return;
      if (pending.focus) el.focus();
      el.setSelectionRange(pending.caret, pending.caret);
    }, [text]);

    const applyParseResult = (nextText: string, caretAfterEdit?: number) => {
      const result = parseText(nextText, pack, lookup);
      if (!result.ok) {
        pendingSelectionRef.current = null;
        setShake(true);
        if (result.error === 'combining_without_base') setCombiningError(true);
        if (result.error === 'too_many_marks') setMarksError(true);
        return;
      }
      if (countSymbols(result.clusters) > maxSymbols) {
        setShake(true);
        return;
      }

      const outputText = clustersToText(result.clusters, pack);
      const nextCaret =
        caretAfterEdit !== undefined
          ? Math.min(Math.max(0, caretAfterEdit), outputText.length)
          : outputText.length;
      pendingSelectionRef.current = { caret: nextCaret, focus: true };
      onClustersChange(result.clusters);
    };

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      getCaret: () => textareaRef.current?.selectionStart ?? text.length,
      insertAtCaret: (symbol: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const nextText = text.slice(0, start) + symbol + text.slice(end);
        const caret = start + [...symbol].length;
        pendingSelectionRef.current = { caret, focus: true };
        applyParseResult(nextText, caret);
      },
    }));

    const fieldClass = [styles.editorField, shake && styles.editorFieldShake]
      .filter(Boolean)
      .join(' ');

    const stageClass = [styles.stage, compact && styles.stageCompact].filter(Boolean).join(' ');

    const highlightClass = [
      styles.editorText,
      styles.highlight,
      isAnimateMode && onSlotSelect && styles.highlightInteractive,
    ]
      .filter(Boolean)
      .join(' ');

    const hintText = (() => {
      if (combiningError) return 'Add a base symbol before combining marks';
      if (marksError) return 'Max 4 combining marks per symbol';
      if (isAnimateMode) {
        if (pickAltMode) return 'Step 2: pick the second frame from the palette →';
        if (selectedSlot !== null && selectedSlot !== undefined) {
          return 'Click another symbol to animate, or pick a new Frame B from the palette';
        }
        return 'Step 1: click a symbol in the preview';
      }
      return `${symbolCount}/${maxSymbols} symbols · click preview or use palette`;
    })();

    return (
      <div className={styles.wrap}>
        <div className={stageClass}>
          <div
            className={[styles.canvas, isAnimateMode && styles.canvasAnimate].filter(Boolean).join(' ')}
            style={canvasStyle}
            onClick={() => {
              if (!isAnimateMode) textareaRef.current?.focus();
            }}
            role="presentation"
          >
            <div className={styles.shadow} style={shadowStyle} aria-hidden="true" />
            <div className={styles.card} style={cardStyle}>
              <div className={fieldClass}>
                <div className={highlightClass}>
                  {isEmpty ? (
                    '\u00a0'
                  ) : (
                    <KaomojiAnimatedPreview
                      clusters={clusters}
                      pack={pack}
                      lookup={lookup}
                      layout={layout}
                      themeId={themeId}
                      playAnimation={isAnimateMode}
                      selectedSlot={isAnimateMode ? selectedSlot : null}
                      onSlotSelect={isAnimateMode ? onSlotSelect : undefined}
                    />
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  className={[
                    'kao',
                    styles.editorText,
                    styles.editorInput,
                    isAnimateMode && styles.editorInputHidden,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  value={text}
                  readOnly={isAnimateMode}
                  tabIndex={isAnimateMode ? -1 : 0}
                  onChange={(e) => {
                    if (isAnimateMode) return;
                    const caret = e.target.selectionStart ?? e.target.value.length;
                    applyParseResult(e.target.value, caret);
                  }}
                  rows={1}
                  spellCheck={false}
                  aria-label={isAnimateMode ? 'Kaomoji preview (animate mode)' : 'Edit kaomoji'}
                  aria-hidden={isAnimateMode}
                />
              </div>
              {isEmpty && emptyHint && <span className={styles.emptyHint}>{emptyHint}</span>}
            </div>
          </div>
        </div>
        <p className={styles.hint}>{hintText}</p>
      </div>
    );
  },
);
