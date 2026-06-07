import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  clampKaomoji,
  hasNewDisallowedChar,
  isAllowedKaomojiChar,
  KAOMOJI_MAX_LENGTH,
} from '../../../data/mock/kaomojiEditor';
import {
  isDarkStudioBg,
  PLATE_CONTRAST,
  capitalizeColorId,
  type StudioBgColor,
} from '../../../data/mock/studioColors';
import colorStyles from '../studioColors.module.css';
import styles from './KaomojiInlineEditor.module.css';

export interface KaomojiInlineEditorHandle {
  focus: () => void;
  insertAtCaret: (symbol: string) => void;
  getCaret: () => number;
}

interface KaomojiInlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  bg?: StudioBgColor;
}

export const KaomojiInlineEditor = forwardRef<KaomojiInlineEditorHandle, KaomojiInlineEditorProps>(
  function KaomojiInlineEditor({ value, onChange, bg = 'yellow' }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [shake, setShake] = useState(false);
    const plateBg = PLATE_CONTRAST[bg];
    const bgCap = capitalizeColorId(bg);
    const plateCap = capitalizeColorId(plateBg);
    const charCount = Math.max([...value].length, 1);
    const darkBg = isDarkStudioBg(bg);
    const chars = [...value];

    const stickerStyle = {
      '--char-count': charCount,
    } as CSSProperties;

    useEffect(() => {
      if (!shake) return;
      const timer = window.setTimeout(() => setShake(false), 360);
      return () => window.clearTimeout(timer);
    }, [shake]);

    const fieldClass = [
      styles.editorField,
      colorStyles[`bg${bgCap}`],
      shake && styles.editorFieldShake,
    ]
      .filter(Boolean)
      .join(' ');

    const textClass = styles.editorText;

    const highlightClass = [
      textClass,
      styles.highlight,
      darkBg && styles.highlightLight,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClass = [
      textClass,
      styles.editorInput,
      darkBg && styles.editorInputLight,
    ]
      .filter(Boolean)
      .join(' ');

    const invalidCharClass = darkBg ? styles.charInvalidOnDark : styles.charInvalid;

    const handleChange = (nextRaw: string) => {
      const next = clampKaomoji(nextRaw);
      if (hasNewDisallowedChar(value, next)) {
        setShake(true);
      }
      onChange(next);
    };

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      getCaret: () => textareaRef.current?.selectionStart ?? value.length,
      insertAtCaret: (symbol: string) => {
        const el = textareaRef.current;
        if (!el) return;

        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next = clampKaomoji(value.slice(0, start) + symbol + value.slice(end));
        onChange(next);

        const caret = Math.min(start + symbol.length, next.length);
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(caret, caret);
        });
      },
    }));

    return (
      <div className={styles.wrap}>
        <div className={styles.stage}>
          <div className={styles.sticker} style={stickerStyle}>
            <div
              className={[styles.plate, colorStyles[`plate${plateCap}`]].filter(Boolean).join(' ')}
              aria-hidden="true"
            />
            <div className={fieldClass}>
              <div className={highlightClass} aria-hidden="true">
                {chars.length === 0 ? (
                  '\u00a0'
                ) : (
                  chars.map((char, index) => (
                    <span
                      key={`${index}-${char}`}
                      className={!isAllowedKaomojiChar(char) ? invalidCharClass : undefined}
                    >
                      {char}
                    </span>
                  ))
                )}
              </div>
              <textarea
                ref={textareaRef}
                className={['kao', inputClass].join(' ')}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                rows={1}
                spellCheck={false}
                aria-label="Edit kaomoji"
              />
            </div>
          </div>
        </div>
        <p className={styles.hint}>
          Click to edit · {charCount}/{KAOMOJI_MAX_LENGTH} chars
        </p>
      </div>
    );
  },
);
