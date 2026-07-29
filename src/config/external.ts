export const EXTERNAL_LINKS = {
  twitter: 'https://x.com/kaomojinft',
  discord: 'https://discord.gg/kaomoji',
  opensea: 'https://opensea.io/collection/kaomoji',
  etherscan: 'https://etherscan.io',
} as const;

export const COLLECTION = {
  name: 'Kaomoji Genesis',
  nameJa: 'カオモジ',
  totalSupply: 3333,
  contractAddress: '0xd2291d9ef533917333b71d909534288fe7cb1ec1' as const,
  glyphPackAddress: '0x650Dc171B168f6DdedEeFe8a93651F9367738663' as const,
  glyphCacheAddress: '0x0E3E08d00fC8bBd4D9B894000bf1D1BBcF8daBe7' as const,
  rendererAddress: '0x47Cc3Ae4Eb45167A4F3A3E889Bae5D6fE51a038B' as const,
  compositionPoolAddress: '0xe03d4A13229FE7149aa54aCF7A687550Bd9AE2dB' as const,
  chainId: 1,
  chainName: 'Ethereum',
} as const;

export function explorerTxUrl(hash: string): string {
  return `${EXTERNAL_LINKS.etherscan}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${EXTERNAL_LINKS.etherscan}/address/${address}`;
}

/** @deprecated Use explorerTxUrl */
export const basescanTxUrl = explorerTxUrl;

/** @deprecated Use explorerAddressUrl */
export const basescanAddressUrl = explorerAddressUrl;
