import type { KaomojiNft } from '../../../types/nft';
import { SacrificePanel } from '../SacrificePanel';
import styles from './InkPanel.module.css';

interface InkPanelProps {
  target: KaomojiNft;
  candidates: KaomojiNft[];
  selectedSacrificeIds: string[];
  onSacrificeSelectionChange: (burnTokenIds: string[]) => void;
  onSacrifice: (burnTokenIds: string[], targetTokenId: string) => Promise<void>;
  sacrificeDisabled?: boolean;
}

export function InkPanel({
  target,
  candidates,
  selectedSacrificeIds,
  onSacrificeSelectionChange,
  onSacrifice,
  sacrificeDisabled,
}: InkPanelProps) {
  return (
    <div className={styles.root}>
      <span className={styles.topUpLabel}>Add Ink — sacrifice another Kaomoji</span>
      <SacrificePanel
        target={target}
        candidates={candidates}
        selectedBurnIds={selectedSacrificeIds}
        onSelectionChange={onSacrificeSelectionChange}
        onSacrifice={onSacrifice}
        disabled={sacrificeDisabled}
        compact
      />
    </div>
  );
}
