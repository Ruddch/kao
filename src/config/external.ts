export const EXTERNAL_LINKS = {
  twitter: 'https://x.com/kaomojinft',
  discord: 'https://discord.gg/kaomoji',
  opensea: 'https://opensea.io/collection/kaomoji',
  basescan: 'https://basescan.org',
} as const;

export const COLLECTION = {
  name: 'Kaomoji Genesis',
  nameJa: 'カオモジ',
  totalSupply: 10_000,
  contractAddress: '0x88057f4bbDB7ba48AE9E6d2566b1C54398FC630B' as const,
  glyphPackAddress: '0xeB34ae886C3F45c61D73b4525071df44c2F46de7' as const,
  glyphCacheAddress: '0x1B95b5E48FacD5c825EC706bd8EE4380b5E3cBbd' as const,
  rendererAddress: '0xb64220225fFB9422D391fdAc3152fF0E56bd574F' as const,
  chainId: 8453,
  chainName: 'Base',
} as const;

export function basescanTxUrl(hash: string): string {
  return `${EXTERNAL_LINKS.basescan}/tx/${hash}`;
}

export function basescanAddressUrl(address: string): string {
  return `${EXTERNAL_LINKS.basescan}/address/${address}`;
}
