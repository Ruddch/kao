import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Link } from 'react-router-dom';

import type { KaomojiNft } from '../../../types/nft';
import { NftPreview } from './NftPreview';

import styles from './CollectionHub.module.css';

interface CollectionHubProps {
  nfts: KaomojiNft[];
  activeTokenId: string | null;
  loading?: boolean;
  onSelect: (nft: KaomojiNft) => void;
  /** Sticky action under the grid (e.g. Reveal all). */
  footer?: ReactNode;
}

export function CollectionHub({
  nfts,
  activeTokenId,
  loading,
  onSelect,
  footer,
}: CollectionHubProps) {
  const [collapsed, setCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    if (!activeTokenId || collapsed) return;
    const button = itemRefs.current.get(activeTokenId);
    button?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeTokenId, collapsed, nfts.length]);

  if (loading) {
    return (
      <aside className={styles.root}>
        <p className={styles.status}>Loading your Kaomoji…</p>
      </aside>
    );
  }

  if (nfts.length === 0 && !footer) {
    return (
      <aside className={styles.root}>
        <p className={styles.status}>
          No Kaomoji yet. <Link to="/checker">Mint one</Link> to start.
        </p>
      </aside>
    );
  }

  const handleSelect = (nft: KaomojiNft) => {
    if (collapsed) setCollapsed(false);
    onSelect(nft);
  };

  const renderCard = (nft: KaomojiNft) => {
    const active = nft.tokenId === activeTokenId;

    return (
      <button
        key={nft.tokenId}
        ref={(node) => {
          if (node) itemRefs.current.set(nft.tokenId, node);
          else itemRefs.current.delete(nft.tokenId);
        }}
        type="button"
        className={[styles.cellBtn, active && styles.cellBtnActive].filter(Boolean).join(' ')}
        onClick={() => handleSelect(nft)}
        aria-pressed={active}
        aria-label={`Kaomoji #${nft.tokenId}${nft.revealed ? '' : ', unrevealed'}`}
      >
        <div className={styles.cell}>
          <div className={styles.preview}>
            <NftPreview nft={nft} />
          </div>
          <span className={styles.id}>#{nft.tokenId}</span>
        </div>
      </button>
    );
  };

  return (
    <aside className={[styles.root, collapsed && styles.rootCollapsed].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
        aria-controls="studio-nft-panel"
        aria-label={collapsed ? 'Expand Your Kaomoji' : 'Collapse Your Kaomoji'}
      >
        <span className={styles.toggleIcon} aria-hidden="true">
          {collapsed ? '›' : '‹'}
        </span>
        <span className={styles.toggleLabel}>Your Kaomoji</span>
      </button>

      <div id="studio-nft-panel" ref={panelRef} className={styles.panel}>
        {nfts.length === 0 ? (
          <p className={styles.status}>
            No Kaomoji yet. <Link to="/checker">Mint one</Link> to start.
          </p>
        ) : (
          <div className={styles.grid}>{nfts.map(renderCard)}</div>
        )}
        {footer && !collapsed && <div className={styles.footer}>{footer}</div>}
      </div>
    </aside>
  );
}
