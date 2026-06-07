import styles from './KaomojiDisplay.module.css';

type Size = 'sm' | 'md' | 'hero';

interface KaomojiDisplayProps {
  kaomoji: string;
  size?: Size;
  dashed?: boolean;
  className?: string;
}

export function KaomojiDisplay({ kaomoji, size = 'md', dashed, className }: KaomojiDisplayProps) {
  return (
    <div
      className={[
        styles.display,
        styles[size],
        dashed && styles.dashed,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
    >
      <span className={`kao ${styles.text}`}>{kaomoji}</span>
    </div>
  );
}
