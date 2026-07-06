import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Address } from 'viem';
import type { Document } from '../lib/glyphs/types';
import type { KaomojiNft } from '../types/nft';
import { isRateLimitError } from '../lib/onchain/baseRpc';
import {
  fetchKaomojiEntry,
  fetchOwnedKaomojiList,
  patchKaomojiDraft,
  patchSacrificeResult,
} from '../lib/onchain/fetchOwnedTokens';
import { buildKaomojiPreviewImages } from '../lib/onchain/buildKaomojiPreviewImages';
import type { GlyphPack } from '../lib/glyphs/types';
import type { LayoutConstants } from '../lib/onchain/glyphIndex';

export function ownedKaomojiQueryKey(address: Address | undefined) {
  return ['ownedKaomoji', address] as const;
}

export function useOwnedKaomoji(address: Address | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ownedKaomojiQueryKey(address),
    enabled: Boolean(address),
    queryFn: async () => {
      if (!address) return [];
      return fetchOwnedKaomojiList(address);
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (isRateLimitError(error)) return failureCount < 3;
      return failureCount < 1;
    },
    retryDelay: (attempt, error) =>
      isRateLimitError(error) ? 2_000 * (attempt + 1) : 1_000,
  });

  const patchFromDraft = useCallback(
    (
      tokenId: string,
      draft: {
        clusters: Document;
        themeId: number;
        layoutAlign: number;
        pack: GlyphPack;
        layout: LayoutConstants;
        revealed?: boolean;
      },
    ) => {
      if (!address) return;
      const { previewImage, animatedPreviewImage } = buildKaomojiPreviewImages(
        draft.clusters,
        draft.pack,
        draft.layout,
        draft.themeId,
        draft.layoutAlign,
      );
      queryClient.setQueryData<KaomojiNft[]>(ownedKaomojiQueryKey(address), (old) => {
        if (!old) return old;
        return patchKaomojiDraft(old, tokenId, {
          clusters: draft.clusters,
          themeId: draft.themeId,
          layoutAlign: draft.layoutAlign,
          previewImage,
          animatedPreviewImage,
          revealed: draft.revealed,
        });
      });
    },
    [address, queryClient],
  );

  const syncEntry = useCallback(
    async (tokenId: string) => {
      if (!address) return;
      try {
        const entry = await fetchKaomojiEntry(tokenId);
        queryClient.setQueryData<KaomojiNft[]>(ownedKaomojiQueryKey(address), (old) => {
          if (!old) return [entry];
          const index = old.findIndex((nft) => nft.tokenId === tokenId);
          if (index === -1) return [...old, entry];
          const next = old.slice();
          next[index] = entry;
          return next;
        });
      } catch {
        await queryClient.invalidateQueries({ queryKey: ownedKaomojiQueryKey(address) });
      }
    },
    [address, queryClient],
  );

  const applySacrifice = useCallback(
    (burnTokenIds: string[], targetTokenId: string, inkReward: number) => {
      if (!address || burnTokenIds.length === 0) return;
      queryClient.setQueryData<KaomojiNft[]>(ownedKaomojiQueryKey(address), (old) => {
        if (!old) return old;
        return patchSacrificeResult(old, burnTokenIds, targetTokenId, inkReward);
      });
    },
    [address, queryClient],
  );

  return { ...query, patchFromDraft, syncEntry, applySacrifice };
}
