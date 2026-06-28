import { basescanTxUrl } from '../../../config/external';
import type { TxStatus } from '../../../types/web3';
import { Button } from '../../ui/Button';
import styles from './TxOverlay.module.css';

interface TxOverlayProps {
  status: TxStatus;
  successTitle?: string;
  onDismiss?: () => void;
}

export function TxOverlay({ status, successTitle, onDismiss }: TxOverlayProps) {
  if (status.state === 'idle') return null;

  const isPending = status.state === 'pending' || status.state === 'confirming';
  const isSuccess = status.state === 'success';
  const isError = status.state === 'failed';

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div
        className={[
          styles.card,
          isSuccess && styles.cardSuccess,
          isError && styles.cardError,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {isPending && (
          <>
            <p className={styles.spinner}>{status.message}</p>
            {status.hash && (
              <a
                className={styles.link}
                href={basescanTxUrl(status.hash)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View tx
              </a>
            )}
          </>
        )}

        {isSuccess && (
          <>
            <h3 className={styles.title}>{successTitle ?? 'Done!'}</h3>
            <p className={styles.message}>{status.message}</p>
            {status.hash && (
              <a
                className={styles.link}
                href={basescanTxUrl(status.hash)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View tx
              </a>
            )}
            {onDismiss && (
              <div className={styles.actions}>
                <Button variant="primary" onClick={onDismiss}>
                  Continue
                </Button>
              </div>
            )}
          </>
        )}

        {isError && (
          <>
            <h3 className={styles.title}>Transaction failed</h3>
            <p className={styles.message}>{status.message}</p>
            {onDismiss && (
              <div className={styles.actions}>
                <Button variant="secondary" onClick={onDismiss}>
                  Dismiss
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
