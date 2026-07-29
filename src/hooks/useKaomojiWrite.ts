import { useCallback, useRef, useState } from 'react';
import { useWriteContract } from 'wagmi';
import {
  kaomojiNftAbiTyped,
  KAOMOJI_NFT_ADDRESS,
} from '../contracts/kaomojiNft';
import { getBasePublicClient } from '../lib/onchain/baseRpc';
import {
  buildGlyphsToCache,
  documentToOnchainClusters,
  encodeDocument,
} from '../lib/onchain/glyphIndex';
import { compositionToHex, uniqueGlyphIds } from '../lib/onchain/compositionCodec';
import { readCachedGlyphIds } from '../lib/onchain/fetchOwnedTokens';
import { formatContractError } from '../lib/onchain/txErrors';
import { refreshOpenseaMetadata } from '../lib/opensea/refreshMetadata';
import type { Document } from '../lib/glyphs/types';
import type { TxHash, TxStatus } from '../types/web3';

function mapGlyphsToCache(
  glyphsToCache: Awaited<ReturnType<typeof buildGlyphsToCache>>,
) {
  return glyphsToCache.map((g) => ({
    glyphId: g.glyphId,
    glyphData: g.glyphData,
    proof: g.proof,
  }));
}

async function prepareGlyphs(clusters: Document, themeId: number, layoutAlign: number) {
  const bytes = await encodeDocument(clusters, themeId, layoutAlign);
  const onchainClusters = await documentToOnchainClusters(clusters);
  const glyphIds = uniqueGlyphIds(onchainClusters);
  const cached = await readCachedGlyphIds(glyphIds);
  const glyphsToCache = await buildGlyphsToCache(glyphIds, cached);
  return {
    composition: compositionToHex(bytes),
    glyphsToCache,
  };
}

async function waitForReceipt(hash: TxHash) {
  const client = getBasePublicClient();
  const receipt = await client.waitForTransactionReceipt({ hash });
  if (receipt.status === 'reverted') {
    throw new Error('Transaction reverted on-chain');
  }
}

function isUserRejection(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('user rejected') ||
    m.includes('user denied') ||
    m.includes('rejected the request') ||
    m.includes('request rejected') ||
    m.includes('denied transaction signature')
  );
}

export type RevealAllResult = {
  revealedIds: string[];
  lastHash: TxHash | null;
  complete: boolean;
};

export function useKaomojiWrite() {
  const { writeContractAsync, isPending: isWriting, reset } = useWriteContract();
  const [confirming, setConfirming] = useState(false);
  const activeHashRef = useRef<TxHash | null>(null);

  const [status, setStatus] = useState<TxStatus>({
    state: 'idle',
    hash: null,
    message: '',
  });

  const runTx = useCallback(
    async (confirmingMessage: string, write: () => Promise<TxHash>): Promise<TxHash> => {
      try {
        const txHash = await write();
        activeHashRef.current = txHash;
        setConfirming(true);
        setStatus({ state: 'confirming', hash: txHash, message: confirmingMessage });
        await waitForReceipt(txHash);
        setStatus({ state: 'success', hash: txHash, message: 'Transaction confirmed' });
        return txHash;
      } catch (err) {
        const raw = err instanceof Error ? err.message : 'Transaction failed';
        const txMessage = formatContractError(raw);
        setStatus({
          state: 'failed',
          hash: activeHashRef.current,
          message: txMessage,
        });
        throw err;
      } finally {
        setConfirming(false);
      }
    },
    [],
  );

  /** Random composition from the on-chain pool — no user-supplied layout. */
  const reveal = useCallback(
    async (tokenId: string) => {
      setStatus({ state: 'pending', hash: null, message: 'Confirm reveal in wallet…' });
      const hash = await runTx('Revealing on-chain…', () =>
        writeContractAsync({
          address: KAOMOJI_NFT_ADDRESS,
          abi: kaomojiNftAbiTyped,
          functionName: 'reveal',
          args: [BigInt(tokenId), []],
        }),
      );
      refreshOpenseaMetadata([tokenId]);
      return hash;
    },
    [runTx, writeContractAsync],
  );

  /**
   * Reveal many tokens. Contract has no revealBatch — sequential `reveal` calls.
   * If the user rejects mid-batch, earlier confirms stay revealed and we report
   * partial success instead of a hard failure.
   */
  const revealAll = useCallback(
    async (
      tokenIds: string[],
      options?: {
        onRevealed?: (tokenId: string) => void;
        onPartialStop?: () => void;
      },
    ): Promise<RevealAllResult> => {
      if (tokenIds.length === 0) {
        throw new Error('No unrevealed Kaomoji to reveal');
      }

      const revealedIds: string[] = [];
      let lastHash: TxHash | null = null;
      const total = tokenIds.length;

      for (let i = 0; i < tokenIds.length; i += 1) {
        const id = tokenIds[i];
        const n = i + 1;
        setStatus({
          state: 'pending',
          hash: null,
          message:
            total === 1
              ? 'Confirm reveal in wallet…'
              : `Confirm reveal ${n}/${total} (#${id}) in wallet…`,
        });
        try {
          const txHash = await writeContractAsync({
            address: KAOMOJI_NFT_ADDRESS,
            abi: kaomojiNftAbiTyped,
            functionName: 'reveal',
            args: [BigInt(id), []],
          });
          lastHash = txHash;
          activeHashRef.current = txHash;
          setConfirming(true);
          setStatus({
            state: 'confirming',
            hash: txHash,
            message:
              total === 1
                ? 'Revealing on-chain…'
                : `Revealing ${n}/${total} on-chain…`,
          });
          await waitForReceipt(txHash);
          revealedIds.push(id);
          refreshOpenseaMetadata([id]);
          options?.onRevealed?.(id);
        } catch (err) {
          const raw = err instanceof Error ? err.message : 'Transaction failed';
          const reason = isUserRejection(raw)
            ? 'Wallet rejected the transaction'
            : formatContractError(raw);

          setConfirming(false);

          if (revealedIds.length > 0) {
            const remaining = total - revealedIds.length;
            options?.onPartialStop?.();
            setStatus({
              state: 'success',
              hash: lastHash,
              message: `Revealed ${revealedIds.length} of ${total}. Stopped at #${id}: ${reason}. ${remaining} left unrevealed.`,
            });
            return { revealedIds, lastHash, complete: false };
          }

          setStatus({
            state: 'failed',
            hash: activeHashRef.current,
            message: reason,
          });
          throw err;
        } finally {
          setConfirming(false);
        }
      }

      setStatus({
        state: 'success',
        hash: lastHash,
        message:
          tokenIds.length === 1
            ? 'Reveal confirmed'
            : `Revealed ${tokenIds.length} Kaomoji`,
      });
      return { revealedIds, lastHash, complete: true };
    },
    [writeContractAsync],
  );

  const edit = useCallback(
    async (tokenId: string, clusters: Document, themeId: number, layoutAlign: number) => {
      setStatus({ state: 'pending', hash: null, message: 'Preparing edit…' });
      const { composition, glyphsToCache } = await prepareGlyphs(clusters, themeId, layoutAlign);
      setStatus({ state: 'pending', hash: null, message: 'Confirm in wallet…' });
      const hash = await runTx('Applying edit…', () =>
        writeContractAsync({
          address: KAOMOJI_NFT_ADDRESS,
          abi: kaomojiNftAbiTyped,
          functionName: 'edit',
          args: [BigInt(tokenId), composition, mapGlyphsToCache(glyphsToCache)],
        }),
      );
      refreshOpenseaMetadata([tokenId]);
      return hash;
    },
    [runTx, writeContractAsync],
  );

  const sacrifice = useCallback(
    async (burnTokenIds: string[], targetTokenId: string) => {
      if (burnTokenIds.length === 0) {
        throw new Error('Select at least one Kaomoji to sacrifice');
      }
      setStatus({ state: 'pending', hash: null, message: 'Confirm sacrifice…' });
      const count = burnTokenIds.length;
      const hash = await runTx(
        count === 1 ? 'Sacrificing NFT…' : `Sacrificing ${count} NFTs…`,
        () =>
          writeContractAsync({
            address: KAOMOJI_NFT_ADDRESS,
            abi: kaomojiNftAbiTyped,
            functionName: 'sacrificeBatch',
            args: [burnTokenIds.map((id) => BigInt(id)), BigInt(targetTokenId)],
          }),
      );
      // Target traits (ink/level) change; burned ids disappear from the market.
      refreshOpenseaMetadata([targetTokenId, ...burnTokenIds]);
      return hash;
    },
    [runTx, writeContractAsync],
  );

  const resetStatus = useCallback(() => {
    activeHashRef.current = null;
    reset();
    setConfirming(false);
    setStatus({ state: 'idle', hash: null, message: '' });
  }, [reset]);

  return {
    reveal,
    revealAll,
    edit,
    sacrifice,
    status,
    isPending: isWriting || confirming,
    resetStatus,
  };
};
