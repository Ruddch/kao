export interface NftTraits {
  eyes: string;
  mouth: string;
  hands: string;
  bg: string;
}

export interface Nft {
  tokenId: string;
  kaomoji: string;
  traits: NftTraits;
  modified: boolean;
}

export type TraitCategory = keyof NftTraits;

export interface TraitOption {
  id: string;
  label: string;
  kaomojiPart: string;
}

export type EditorMode = 'modify' | 'burn';
