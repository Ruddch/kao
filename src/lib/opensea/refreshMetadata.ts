import { COLLECTION } from '../../config/external';

const OPENSEA_REFRESH_BASE = `https://api.opensea.io/api/v2/chain/ethereum/contract/${COLLECTION.contractAddress}/nfts`;

/**
 * Queue OpenSea metadata refresh after on-chain reveal/edit.
 * API key comes from GitHub Secrets → VITE_OPENSEA_API_KEY at build time.
 * Fire-and-forget: never block the reveal UX.
 */
export function refreshOpenseaMetadata(tokenIds: string[]): void {
  const apiKey = import.meta.env.VITE_OPENSEA_API_KEY?.trim();
  if (!apiKey) return;

  const ids = [...new Set(tokenIds.map((id) => id.trim()).filter((id) => /^\d+$/.test(id)))];
  if (!ids.length) return;

  void (async () => {
    for (const tokenId of ids) {
      try {
        const res = await fetch(`${OPENSEA_REFRESH_BASE}/${tokenId}/refresh`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'x-api-key': apiKey,
          },
        });
        if (!res.ok && import.meta.env.DEV) {
          console.warn(`[opensea] refresh #${tokenId} → ${res.status}`);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(`[opensea] refresh #${tokenId} failed:`, err);
        }
      }
    }
  })();
}
