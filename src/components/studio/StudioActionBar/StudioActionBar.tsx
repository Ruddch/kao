import { Button } from '../../ui/Button';
import styles from './StudioActionBar.module.css';

interface StudioActionBarProps {
  reason?: string;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  loading?: boolean;
}

export function StudioActionBar({
  reason,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  loading,
}: StudioActionBarProps) {
  return (
    <footer className={styles.bar}>
      {reason && <p className={styles.reason}>{reason}</p>}
      <div className={styles.actions}>
        {secondaryLabel && onSecondary && (
          <button type="button" className={styles.secondaryBtn} onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
        <div className={styles.primaryWrap}>
          <Button
            variant="primary"
            disabled={primaryDisabled || loading}
            onClick={onPrimary}
          >
            {loading ? '…' : primaryLabel}
          </Button>
        </div>
      </div>
    </footer>
  );
}
