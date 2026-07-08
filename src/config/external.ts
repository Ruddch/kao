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
  contractAddress: '0x49Adf3974D5450B95d89F69EDCB40DFdBDC11b37' as const,
  glyphPackAddress: '0x98558C945A0c5AC5327b2fE4Ecc0BE5d2C5676C3' as const,
  glyphCacheAddress: '0xbDBbDD60Fb241F8A7CA67743a2E168322B4acc4D' as const,
  rendererAddress: '0x41fD7836Dc265204624F0debf2CE4Ce6f21eb7eE' as const,
  chainId: 8453,
  chainName: 'Base',
} as const;

export function basescanTxUrl(hash: string): string {
  return `${EXTERNAL_LINKS.basescan}/tx/${hash}`;
}

export function basescanAddressUrl(address: string): string {
  return `${EXTERNAL_LINKS.basescan}/address/${address}`;
}
