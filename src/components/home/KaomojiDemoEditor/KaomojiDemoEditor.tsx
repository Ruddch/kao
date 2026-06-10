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
  clampDocumentText,
  clustersToText,
  getFontFamilyForChar,
  KAOMOJI_DEMO_MAX_LENGTH,
  parseText,
  type Document,
  type GlyphLookup,
  type GlyphPack,
} from '../../../lib/glyphs';
import styles from './KaomojiDemoEditor.module.css';

export interface KaomojiDemoEditorHandle {
  focus: () => void;
  insertAtCaret: (symbol: string) => void;
  getCaret: () => number;
}

interface KaomojiDemoEditorProps {
  pack: GlyphPack;
  lookup: GlyphLookup;
  initialText?: string;
}

const DEFAULT_TEXT = '(◕‿◕)';

export const KaomojiDemoEditor = forwardRef<KaomojiDemoEditorHandle, KaomojiDemoEditorProps>(
  function KaomojiDemoEditor({ pack, lookup, initialText = DEFAULT_TEXT }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const pendingSelectionRef = useRef<{ caret: number; focus: boolean } | null>(null);
    const [shake, setShake] = useState(false);
    const [combiningError, setCombiningError] = useState(false);

    const initialParse = useMemo(
      () => parseText(initialText, pack, lookup),
      [initialText, pack, lookup],
    );

    const [clusters, setClusters] = useState<Document>(
      initialParse.ok ? initialParse.clusters : [],
    );

    const text = clustersToText(clusters, pack);
    const chars = [...text];
    const charCount = Math.max(chars.length, 1);

    const stickerStyle = {
      '--char-count': charCount,
    } as CSSProperties;

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

    useLayoutEffect(() => {
      const pending = pendingSelectionRef.current;
      if (!pending) return;
      pendingSelectionRef.current = null;

      const el = textareaRef.current;
      if (!el) return;

      if (pending.focus) el.focus();
      el.setSelectionRange(pending.caret, pending.caret);
    }, [text]);

    const applyParseResult = (nextText: string) => {
      const clamped = clampDocumentText(nextText, KAOMOJI_DEMO_MAX_LENGTH);
      const result = parseText(clamped, pack, lookup);

      if (!result.ok) {
        pendingSelectionRef.current = null;
        setShake(true);
        if (result.error === 'combining_without_base') {
          setCombiningError(true);
        }
        return;
      }

      setClusters(result.clusters);
    };

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      getCaret: () => textareaRef.current?.selectionStart ?? text.length,
      insertAtCaret: (symbol: string) => {
        const el = textareaRef.current;
        if (!el) return;

        const wasFocused = document.activeElement === el;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const nextText = text.slice(0, start) + symbol + text.slice(end);
        const caret = Math.min(start + [...symbol].length, KAOMOJI_DEMO_MAX_LENGTH);

        pendingSelectionRef.current = { caret, focus: !wasFocused };
        applyParseResult(nextText);
      },
    }));

    const fieldClass = [styles.editorField, shake && styles.editorFieldShake]
      .filter(Boolean)
      .join(' ');

    const textClass = styles.editorText;

    return (
      <div className={styles.wrap}>
        <div className={styles.stage}>
          <div className={styles.sticker} style={stickerStyle}>
            <div className={fieldClass}>
              <div className={[textClass, styles.highlight].join(' ')} aria-hidden="true">
                {chars.length === 0 ? (
                  '\u00a0'
                ) : (
                  chars.map((char, index) => (
                    <span
                      key={`${index}-${char}`}
                      style={{ fontFamily: getFontFamilyForChar(char, pack, lookup) }}
                    >
                      {char}
                    </span>
                  ))
                )}
              </div>
              <textarea
                ref={textareaRef}
                className={['kao', textClass, styles.editorInput].join(' ')}
                value={text}
                onChange={(e) => applyParseResult(e.target.value)}
                rows={1}
                spellCheck={false}
                aria-label="Edit kaomoji"
              />
            </div>
          </div>
        </div>
        <p className={styles.hint}>
          {combiningError
            ? 'Add a base symbol before combining marks'
            : `Click to edit · ${charCount}/${KAOMOJI_DEMO_MAX_LENGTH} chars`}
        </p>
      </div>
    );
  },
);
