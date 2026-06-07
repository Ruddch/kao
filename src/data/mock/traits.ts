import type { TraitOption } from '../../types/nft';

export const TRAIT_OPTIONS: Record<string, TraitOption[]> = {
  eyes: [
    { id: 'eyes-1', label: 'Happy', kaomojiPart: '◕‿◕' },
    { id: 'eyes-2', label: 'Wide', kaomojiPart: '⊙_⊙' },
    { id: 'eyes-3', label: 'Sleepy', kaomojiPart: '−_−' },
    { id: 'eyes-4', label: 'Sparkle', kaomojiPart: '✧‿✧' },
  ],
  mouth: [
    { id: 'mouth-1', label: 'Smile', kaomojiPart: '‿' },
    { id: 'mouth-2', label: 'Open', kaomojiPart: 'o' },
    { id: 'mouth-3', label: 'Flat', kaomojiPart: 'ー' },
    { id: 'mouth-4', label: 'Wavy', kaomojiPart: 'ω' },
  ],
  hands: [
    { id: 'hands-1', label: 'None', kaomojiPart: '' },
    { id: 'hands-2', label: 'Wave', kaomojiPart: 'ヽ' },
    { id: 'hands-3', label: 'Hug', kaomojiPart: '(っ' },
    { id: 'hands-4', label: 'Shrug', kaomojiPart: '¯\\' },
  ],
  bg: [
    { id: 'bg-1', label: 'Yellow', kaomojiPart: '' },
    { id: 'bg-2', label: 'Cyan', kaomojiPart: '' },
    { id: 'bg-3', label: 'Pink', kaomojiPart: '' },
    { id: 'bg-4', label: 'Green', kaomojiPart: '' },
  ],
};

export const TRAIT_CATEGORIES = ['eyes', 'mouth', 'hands', 'bg'] as const;
