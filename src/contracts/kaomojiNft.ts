import type { Abi } from 'viem';
import { COLLECTION } from '../config/external';
import kaomojiNftAbi from './kaomojiNft.abi.json';

export const kaomojiNftAbiTyped = kaomojiNftAbi as Abi;

export const KAOMOJI_NFT_ADDRESS = COLLECTION.contractAddress;

export const glyphCacheAbi = [
  {
    type: 'function',
    name: 'hasGlyph',
    inputs: [{ name: 'glyphId', type: 'uint16' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

export const GLYPH_CACHE_ADDRESS = COLLECTION.glyphCacheAddress;
