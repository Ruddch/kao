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

export interface KaomojiNft {
  tokenId: string;
  revealed: boolean;
  ink: number;
  inkReceived: number;
  level: number;
  unlockedSymbols: number;
  mintUnlockedSymbols: number;
  animatedUnlocked: number;
  composition: Uint8Array | null;
  clusters: import('../lib/glyphs/types').Document | null;
  themeId: number | null;
  layoutAlign: number | null;
  /** Static sticker — tokenURI `image`. */
  previewImage: string | null;
  /** Animated sticker HTML — tokenURI `animation_url` (use in iframe). */
  animatedPreviewImage: string | null;
}

export type StudioView = 'hub' | 'reveal' | 'workshop';

export type RevealStep = 'design' | 'theme' | 'review';

export type StudioTxAction = 'reveal' | 'edit' | 'sacrifice';

/** @deprecated Use StudioView */
export type StudioMode = 'reveal' | 'edit' | 'sacrifice';

/** @deprecated Unused */
export type EditorMode = 'modify' | 'burn';
