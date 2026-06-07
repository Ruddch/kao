export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
}

export type TxHash = `0x${string}`;

export interface NftService {
  getOwnedTokens(address: string): Promise<import('./nft').Nft[]>;
  modify(tokenId: string, traits: import('./nft').NftTraits): Promise<TxHash>;
  burn(tokenId: string): Promise<TxHash>;
}

export interface TxStatus {
  state: 'idle' | 'pending' | 'confirming' | 'success' | 'failed';
  hash: TxHash | null;
  message: string;
}
