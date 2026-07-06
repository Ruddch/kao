import type { Address, Hex } from 'viem';
import { loadGlyphPack } from '../glyphs';
import type { Document } from '../glyphs/types';
import { kaomojiNftAbiTyped, KAOMOJI_NFT_ADDRESS } from '../../contracts/kaomojiNft';
import type { KaomojiNft } from '../../types/nft';
import { getBasePublicClient } from './baseRpc';
import { decodeToDocument, loadLayoutConstants, type LayoutConstants } from './glyphIndex';
import { LAYOUT_ALIGN_CENTER } from './compositionCodec';
import { multicallInChunks, isMulticallSuccess } from './multicallChunks';
import { buildKaomojiPreviewImages } from './buildKaomojiPreviewImages';
import {
  derivedKaomojiFields,
  normalizeKaomojiNft,
  toContractBool,
  toContractNumber,
} from './normalize';
import { animatedSlotsUnlocked, levelFromInkReceived } from './inkMath';
import { parseTokenUriMedia, type TokenUriMedia } from './tokenUri';
import type { GlyphPack } from '../glyphs/types';

const STATE_READS = [
  'isRevealed',
  'inkOf',
  'levelOf',
  'unlockedSymbolsOf',
  'compositionOf',
] as const;

/** ~4 NFTs × 5 state fields — keeps multicall calldata under public RPC limits. */
const STATE_CHUNK_SIZE = STATE_READS.length * 4;
const OWNER_SCAN_CHUNK_SIZE = 16;
const TOKEN_URI_CHUNK_SIZE = 8;
const CHUNK_DELAY_MS = 400;

function parseCompositionHex(compositionHex: Hex): Uint8Array | null {
  if (!compositionHex || compositionHex === '0x') return null;
  const normalized = compositionHex.slice(2);
  const composition = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < composition.length; i++) {
    composition[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return composition;
}

function parseStateSlice(
  slice: unknown[],
): Omit<
  KaomojiNft,
  'tokenId' | 'clusters' | 'themeId' | 'layoutAlign' | 'previewImage' | 'animatedPreviewImage'
> {
  const [revealed, ink, level, unlockedSymbols, compositionHex] = slice as [
    boolean,
    bigint,
    number,
    number,
    Hex,
  ];

  const normalizedLevel = toContractNumber(level, 1);
  const derived = derivedKaomojiFields(normalizedLevel);

  return {
    revealed: toContractBool(revealed),
    ink: toContractNumber(ink),
    level: normalizedLevel,
    unlockedSymbols: toContractNumber(unlockedSymbols),
    ...derived,
    composition: parseCompositionHex(compositionHex),
  };
}

function stateContractsFor(tokenIds: string[]) {
  return tokenIds.flatMap((tokenId) => {
    const id = BigInt(tokenId);
    return STATE_READS.map((functionName) => ({
      address: KAOMOJI_NFT_ADDRESS,
      abi: kaomojiNftAbiTyped,
      functionName,
      args: [id] as const,
    }));
  });
}

async function fetchTokenUriMedia(tokenIds: string[]): Promise<Map<string, TokenUriMedia>> {
  if (tokenIds.length === 0) return new Map();

  const client = getBasePublicClient();
  const contracts = tokenIds.map((tokenId) => ({
    address: KAOMOJI_NFT_ADDRESS,
    abi: kaomojiNftAbiTyped,
    functionName: 'tokenURI' as const,
    args: [BigInt(tokenId)] as const,
  }));

  const results = await multicallInChunks(client, contracts, {
    chunkSize: TOKEN_URI_CHUNK_SIZE,
    delayMs: CHUNK_DELAY_MS,
    allowFailure: true,
  });

  const media = new Map<string, TokenUriMedia>();
  for (let i = 0; i < tokenIds.length; i++) {
    const row = results[i];
    if (!isMulticallSuccess(row)) continue;
    media.set(tokenIds[i], parseTokenUriMedia(row.result as string));
  }

  return media;
}

async function buildKaomojiNft(
  tokenId: string,
  state: ReturnType<typeof parseStateSlice>,
  pack: GlyphPack,
  layout: LayoutConstants,
  tokenUri: TokenUriMedia | null,
): Promise<KaomojiNft> {
  let clusters: KaomojiNft['clusters'] = null;
  let themeId: number | null = null;
  let layoutAlign: number | null = null;

  if (state.composition && state.composition.length > 0) {
    const decoded = await decodeToDocument(state.composition);
    clusters = decoded.clusters;
    themeId = decoded.themeId;
    layoutAlign = decoded.layoutAlign;
  }

  let previewImage = tokenUri?.image ?? null;
  let animatedPreviewImage = tokenUri?.animationUrl ?? null;

  if (clusters && clusters.length > 0) {
    const built = buildKaomojiPreviewImages(
      clusters,
      pack,
      layout,
      themeId ?? 0,
      layoutAlign ?? LAYOUT_ALIGN_CENTER,
    );
    previewImage = built.previewImage;
    animatedPreviewImage = tokenUri?.animationUrl ?? built.animatedPreviewImage;
  }

  return normalizeKaomojiNft(tokenId, {
    ...state,
    clusters,
    themeId,
    layoutAlign,
    previewImage,
    animatedPreviewImage,
  });
}

async function discoverOwnedTokenIds(address: Address): Promise<string[]> {
  const client = getBasePublicClient();
  const normalized = address.toLowerCase();

  const balance = await client.readContract({
    address: KAOMOJI_NFT_ADDRESS,
    abi: kaomojiNftAbiTyped,
    functionName: 'balanceOf',
    args: [address],
  });
  if (balance === 0n) return [];

  const totalMinted = await client.readContract({
    address: KAOMOJI_NFT_ADDRESS,
    abi: kaomojiNftAbiTyped,
    functionName: 'totalMinted',
  });
  const supply = toContractNumber(totalMinted);
  if (supply === 0) return [];

  const ownerContracts = Array.from({ length: supply }, (_, i) => ({
    address: KAOMOJI_NFT_ADDRESS,
    abi: kaomojiNftAbiTyped,
    functionName: 'ownerOf' as const,
    args: [BigInt(i)] as const,
  }));

  const ownerResults = await multicallInChunks(client, ownerContracts, {
    chunkSize: OWNER_SCAN_CHUNK_SIZE,
    delayMs: CHUNK_DELAY_MS,
    allowFailure: true,
  });

  const tokenIds: string[] = [];
  for (let i = 0; i < ownerResults.length; i++) {
    const row = ownerResults[i];
    if (!isMulticallSuccess(row)) continue;
    const owner = row.result as Address;
    if (owner.toLowerCase() === normalized) tokenIds.push(String(i));
  }

  return tokenIds;
}

export async function fetchOwnedKaomojiList(address: Address): Promise<KaomojiNft[]> {
  const tokenIds = await discoverOwnedTokenIds(address);
  if (tokenIds.length === 0) return [];

  const client = getBasePublicClient();
  const stateResults = (await multicallInChunks(client, stateContractsFor(tokenIds), {
    chunkSize: STATE_CHUNK_SIZE,
    delayMs: CHUNK_DELAY_MS,
    allowFailure: false,
  })) as unknown[];

  const tokenUriIds: string[] = [];
  for (let i = 0; i < tokenIds.length; i++) {
    const base = i * STATE_READS.length;
    const revealed = toContractBool(stateResults[base] as boolean);
    const level = toContractNumber(stateResults[base + 2] as number, 1);
    const animatedUnlocked = animatedSlotsUnlocked(level);
    if (!revealed || animatedUnlocked > 0) tokenUriIds.push(tokenIds[i]);
  }

  const [tokenUriMedia, pack, layout] = await Promise.all([
    fetchTokenUriMedia(tokenUriIds),
    loadGlyphPack(),
    loadLayoutConstants(),
  ]);

  const nfts: KaomojiNft[] = [];

  for (let i = 0; i < tokenIds.length; i++) {
    const tokenId = tokenIds[i];
    const sliceStart = i * STATE_READS.length;
    const slice = stateResults.slice(sliceStart, sliceStart + STATE_READS.length);
    const state = parseStateSlice(slice);

    nfts.push(
      await buildKaomojiNft(
        tokenId,
        state,
        pack,
        layout,
        tokenUriMedia.get(tokenId) ?? null,
      ),
    );
  }

  return nfts;
}

/** Fetch a single Kaomoji entry — much faster than reloading the full wallet list. */
export async function fetchKaomojiEntry(tokenId: string): Promise<KaomojiNft> {
  const client = getBasePublicClient();
  const stateResults = (await multicallInChunks(client, stateContractsFor([tokenId]), {
    chunkSize: STATE_CHUNK_SIZE,
    delayMs: CHUNK_DELAY_MS,
    allowFailure: false,
  })) as unknown[];
  const state = parseStateSlice(stateResults);

  let tokenUri: TokenUriMedia | null = null;
  if (!state.revealed || state.animatedUnlocked > 0) {
    const media = await fetchTokenUriMedia([tokenId]);
    tokenUri = media.get(tokenId) ?? null;
  }

  const [pack, layout] = await Promise.all([loadGlyphPack(), loadLayoutConstants()]);
  return buildKaomojiNft(tokenId, state, pack, layout, tokenUri);
}

export function patchKaomojiDraft(
  nfts: KaomojiNft[],
  tokenId: string,
  draft: {
    clusters: Document;
    themeId: number;
    layoutAlign: number;
    previewImage: string;
    animatedPreviewImage: string | null;
    revealed?: boolean;
  },
): KaomojiNft[] {
  return nfts.map((nft) =>
    nft.tokenId === tokenId
      ? {
          ...nft,
          revealed: draft.revealed ?? nft.revealed,
          clusters: draft.clusters,
          themeId: draft.themeId,
          layoutAlign: draft.layoutAlign,
          previewImage: draft.previewImage,
          animatedPreviewImage: draft.animatedPreviewImage,
        }
      : nft,
  );
}

export function patchSacrificeResult(
  nfts: KaomojiNft[],
  burnTokenId: string,
  targetTokenId: string,
  inkReward: number,
): KaomojiNft[] {
  return nfts
    .filter((nft) => nft.tokenId !== burnTokenId)
    .map((nft) => {
      if (nft.tokenId !== targetTokenId) return nft;
      const inkReceived = nft.inkReceived + inkReward;
      const level = levelFromInkReceived(inkReceived);
      return {
        ...nft,
        ink: nft.ink + inkReward,
        inkReceived,
        level,
        animatedUnlocked: animatedSlotsUnlocked(level),
      };
    });
}

export async function fetchOwnedTokenIds(address: Address): Promise<string[]> {
  return discoverOwnedTokenIds(address);
}

export async function readCachedGlyphIds(glyphIds: number[]): Promise<Set<number>> {
  const client = getBasePublicClient();
  const cached = new Set<number>();
  const { glyphCacheAbi, GLYPH_CACHE_ADDRESS } = await import('../../contracts/kaomojiNft');

  if (glyphIds.length === 0) return cached;

  const contracts = glyphIds.map((glyphId) => ({
    address: GLYPH_CACHE_ADDRESS,
    abi: glyphCacheAbi,
    functionName: 'hasGlyph' as const,
    args: [glyphId] as const,
  }));

  const results = await multicallInChunks(client, contracts, {
    chunkSize: 24,
    delayMs: CHUNK_DELAY_MS,
    allowFailure: true,
  });

  for (let i = 0; i < glyphIds.length; i++) {
    const row = results[i];
    if (isMulticallSuccess(row) && row.result) cached.add(glyphIds[i]);
  }

  return cached;
}

export async function fetchKaomojiState(tokenId: string) {
  const client = getBasePublicClient();
  const id = BigInt(tokenId);

  const stateResults = await client.multicall({
    contracts: STATE_READS.map((functionName) => ({
      address: KAOMOJI_NFT_ADDRESS,
      abi: kaomojiNftAbiTyped,
      functionName,
      args: [id] as const,
    })),
    allowFailure: false,
  });

  return parseStateSlice(stateResults);
}

export async function fetchOwnedKaomoji(address: Address): Promise<string[]> {
  return fetchOwnedTokenIds(address);
}
