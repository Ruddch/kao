import { ConnectKitButton } from 'connectkit';
import { Button } from '../Button';
import styles from './WalletButton.module.css';

export function WalletButton() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, truncatedAddress, ensName }) => (
        <Button
          variant={isConnected ? 'ghost' : 'primary'}
          className={styles.wallet}
          onClick={show}
        >
          {isConnecting
            ? '...'
            : isConnected
              ? (ensName ?? truncatedAddress ?? '—')
              : 'Connect Wallet'}
        </Button>
      )}
    </ConnectKitButton.Custom>
  );
}
