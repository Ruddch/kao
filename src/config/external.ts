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
  contractAddress: '0x962b7004f2C8cc7236b346fbD836fB87767eB9D4' as const,
  glyphPackAddress: '0xBBD9CbA8ee3fBcc0Dd2A11Cd474f5996a8e6E681' as const,
  glyphCacheAddress: '0x59D2E9c0d906d5c5CbA01c0ee85c09DBdCc1dCBA' as const,
  rendererAddress: '0x298dC811246F8a82e23B072B614164dae24154e3' as const,
  chainId: 8453,
  chainName: 'Base',
} as const;

export function basescanTxUrl(hash: string): string {
  return `${EXTERNAL_LINKS.basescan}/tx/${hash}`;
}

export function basescanAddressUrl(address: string): string {
  return `${EXTERNAL_LINKS.basescan}/address/${address}`;
}
