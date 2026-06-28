import styles from './NftInventory.module.css';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import type { KaomojiNft } from '../../../types/nft';

interface NftInventoryProps {
  nfts: KaomojiNft[];
  selectedId: string | null;
  onSelect: (tokenId: string) => void;
  loading?: boolean;
}

export function NftInventory({ nfts, selectedId, onSelect, loading }: NftInventoryProps) {
  if (loading) {
    return <p className={styles.status}>Loading your Kaomoji…</p>;
  }

  if (nfts.length === 0) {
    return <p className={styles.status}>No Kaomoji in this wallet yet.</p>;
  }

  return (
    <div className={styles.root}>
      <p className={styles.label}>My Kaomoji ({nfts.length})</p>
      <div className={styles.scroll}>
        {nfts.map((nft) => {
          const active = nft.tokenId === selectedId;
          return (
            <button
              key={nft.tokenId}
              type="button"
              className={[styles.cellBtn, active && styles.cellBtnActive]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(nft.tokenId)}
            >
              <Card variant="nftCell" className={styles.cell}>
                <div className={styles.preview}>
                  {nft.previewImage ? (
                    <img
                      src={nft.previewImage}
                      alt={`Kaomoji #${nft.tokenId}`}
                      className={styles.previewImg}
                    />
                  ) : (
                    <span className={styles.placeholder}>KAO</span>
                  )}
                </div>
                <div className={styles.meta}>
                  <span className={styles.id}>#{nft.tokenId}</span>
                  {nft.revealed ? (
                    <Badge variant="eligible">Ink {nft.ink}</Badge>
                  ) : (
                    <Badge variant="soon">Unrevealed</Badge>
                  )}
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
