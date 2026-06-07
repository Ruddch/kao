import styles from './KaomojiCell.module.css';

interface KaomojiCellProps {
  kaomoji: string;
  bg?: 'white' | 'cyan' | 'red' | 'pink' | 'green' | 'blue' | 'yellow';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const BG_MAP = {
  white: styles.bgWhite,
  cyan: styles.bgCyan,
  red: styles.bgRed,
  pink: styles.bgPink,
  green: styles.bgGreen,
  blue: styles.bgBlue,
  yellow: styles.bgYellow,
};

export function KaomojiCell({
  kaomoji,
  bg = 'white',
  selected,
  onClick,
  className,
}: KaomojiCellProps) {
  return (
    <button
      type="button"
      className={[
        styles.cell,
        BG_MAP[bg],
        selected && styles.selected,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      <span className={`kao ${styles.kao}`}>{kaomoji}</span>
    </button>
  );
}
