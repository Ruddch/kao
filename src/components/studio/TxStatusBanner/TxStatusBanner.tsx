import { explorerTxUrl } from '../../../config/external';
import type { TxStatus } from '../../../types/web3';
import styles from './TxStatusBanner.module.css';

interface TxStatusBannerProps {
  status: TxStatus;
  onDismiss?: () => void;
}

export function TxStatusBanner({ status, onDismiss }: TxStatusBannerProps) {
  if (status.state === 'idle') return null;

  const isError = status.state === 'failed';

  return (
    <div
      className={[
        styles.banner,
        status.state === 'success' && styles.success,
        isError && styles.error,
        status.state === 'confirming' && styles.pending,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className={styles.message}>{status.message}</p>
      {status.hash && (
        <a
          className={styles.link}
          href={explorerTxUrl(status.hash)}
          target="_blank"
          rel="noopener noreferrer"
        >
          View tx
        </a>
      )}
      {onDismiss && (status.state === 'success' || isError) && (
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  );
}
