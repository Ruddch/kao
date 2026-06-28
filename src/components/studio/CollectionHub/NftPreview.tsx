import { isAnimatedPreviewHtml } from '../../../lib/onchain/stickerAnimatedSvg';
import type { KaomojiNft } from '../../../types/nft';

import styles from './CollectionHub.module.css';

function NftPreview({ nft }: { nft: KaomojiNft }) {
  const animated = nft.animatedPreviewImage;
  if (animated && isAnimatedPreviewHtml(animated)) {
    return (
      <iframe
        src={animated}
        title=""
        className={styles.previewIframe}
        tabIndex={-1}
        aria-hidden="true"
      />
    );
  }

  if (nft.previewImage) {
    return <img src={nft.previewImage} alt="" className={styles.previewImg} />;
  }

  return <span className={styles.placeholder}>?</span>;
}

export { NftPreview, isAnimatedPreviewHtml };
